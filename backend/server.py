from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, uuid, random, json, logging, requests
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional
from io import BytesIO
from pydantic import BaseModel
import pandas as pd

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "plenalitik"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.warning(f"Storage init failed: {e}")
        return None

def put_object(path, data, content_type):
    key = init_storage()
    if not key:
        return None
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()

# ---- Seed Constants ----
import json as _json, os as _os
_DATA_DIR = _os.path.join(_os.path.dirname(__file__), "data")
def _load_json(fname):
    path = _os.path.join(_DATA_DIR, fname)
    if _os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return _json.load(f)
    return {}
SKILL_TAXONOMY = _load_json("skills.json").get("beceriler", [])
ROLE_TAXONOMY = _load_json("roles.json").get("roller", [])
CAREER_PATHS = _load_json("career-paths.json").get("kariyer_yollari", [])
CLUSTER_TAXONOMY = _load_json("skill-clusters.json").get("kumeler", [])
PROFICIENCY_LEVELS = _load_json("proficiency-levels.json").get("seviyeler", [])
SKILL_MAP = {s["id"]: s for s in SKILL_TAXONOMY}
ROLE_MAP = {r["id"]: r for r in ROLE_TAXONOMY}

MALE_NAMES = ["Ahmet","Mehmet","Mustafa","Ali","Hasan","Ibrahim","Yusuf","Omer","Murat","Emre","Burak","Can","Serkan","Onur","Tolga","Kerem","Baris","Cem","Deniz","Oguz","Kaan","Arda","Berk","Efe","Furkan","Gokhan","Hakan","Tarik","Volkan","Selim"]
FEMALE_NAMES = ["Ayse","Fatma","Zeynep","Elif","Merve","Selin","Esra","Busra","Derya","Gizem","Ebru","Pinar","Basak","Irem","Cansu","Ceren","Gamze","Hande","Nur","Sevgi","Asli","Defne","Eda","Hazal","Melis","Naz","Ozge","Tugce","Yagmur","Buse"]
LAST_NAMES = ["Yilmaz","Kaya","Demir","Celik","Sahin","Yildiz","Aydin","Ozdemir","Arslan","Dogan","Kilic","Aslan","Koc","Polat","Kurt","Ozturk","Eren","Acar","Cetin","Aksoy","Aktas","Basaran","Cengiz","Duran","Gunes","Karaca","Sari","Tunc","Unal","Tekin"]
# Departments mapped to role families
DEPARTMENTS = ["Kredi ve Risk","Hazine","Bireysel Bankacılık","Kurumsal Bankacılık","Şube Operasyonları","Dijital Bankacılık","Uyum ve Mevzuat","Veri ve Analitik","İnsan Kaynakları","Operasyon ve Süreç"]
DEPT_WEIGHTS = [15,8,14,10,16,9,6,8,6,8]
# Map departments to role taxonomy families
DEPT_ROLE_FAMILIES = {
    "Kredi ve Risk": ["Kredi ve Risk"],
    "Hazine": ["Hazine ve Sermaye Piyasaları"],
    "Bireysel Bankacılık": ["Bireysel Bankacılık","Şube ve Bireysel Bankacılık"],
    "Kurumsal Bankacılık": ["Kurumsal Bankacılık","Şube ve KOBİ Bankacılığı"],
    "Şube Operasyonları": ["Şube Operasyonları"],
    "Dijital Bankacılık": ["Dijital Bankacılık","Müşteri Deneyimi ve CRM"],
    "Uyum ve Mevzuat": ["Uyum ve Mevzuat"],
    "Veri ve Analitik": ["Veri ve Analitik"],
    "İnsan Kaynakları": ["İnsan Kaynakları"],
    "Operasyon ve Süreç": ["Operasyon ve Süreç"],
}
# Kademe → Band mapping
KADEME_BAND = {1: "A", 2: "B", 3: "C", 4: "D", 5: "E", 6: "E"}
POSITIONS_BY_BAND = {
    "A": ["Uzman Yardımcısı","Yetkili","Stajyer","Asistan"],
    "B": ["Uzman","Analist","Koordinatör","Temsilci"],
    "C": ["Kıdemli Uzman","Kıdemli Analist","Birim Yöneticisi","Takım Lideri"],
    "D": ["Müdür","Bölüm Başkanı","Müdür Yardımcısı","Grup Müdürü"],
    "E": ["Direktör","Genel Müdür Yardımcısı","Genel Müdür","Başkan"]
}
BANDS = ["A","B","C","D","E"]
BAND_WEIGHTS = [20,30,25,15,10]
CITIES = ["Istanbul","Ankara","Izmir","Bursa","Antalya","Kocaeli","Eskişehir","Konya","Gaziantep","Kayseri"]
CITY_WEIGHTS = [35,15,12,7,5,6,4,5,6,5]
CITY_COUNTRY = {c: "Turkey" for c in CITIES}
EDUCATION_LEVELS = ["Lise","Lisans","Yüksek Lisans","Doktora"]
EDUCATION_WEIGHTS = [10,50,30,10]
UNIVERSITIES = ["Boğaziçi Üniversitesi","İTÜ","ODTÜ","Bilkent Üniversitesi","Koç Üniversitesi","Sabancı Üniversitesi","İstanbul Üniversitesi","Galatasaray Üniversitesi","Hacettepe Üniversitesi","Yıldız Teknik Üniversitesi","Marmara Üniversitesi","Ege Üniversitesi","Dokuz Eylül Üniversitesi","Gazi Üniversitesi","Anadolu Üniversitesi"]
MARITAL_STATUS = ["Bekar","Evli","Boşanmış"]
MARITAL_WEIGHTS = [35,55,10]
LEAVING_REASONS_VOL = ["Resignation","Better Opportunity","Relocation","Personal Reasons","Career Change","Retirement"]
LEAVING_REASONS_INVOL = ["Performance Issues","Restructuring","End of Contract"]
SALARY_BY_BAND = {"A":(15000,30000),"B":(30000,50000),"C":(50000,80000),"D":(80000,130000),"E":(130000,250000)}

# ---- Branch / Sales Constants ----
REGIONS = ["Marmara","Ege","İç Anadolu","Akdeniz","Karadeniz","Doğu Anadolu","Güneydoğu Anadolu"]
BRANCH_DATA = [
    {"name":"Kadıköy","region":"Marmara","city":"Istanbul","lat":40.99,"lng":29.03,"segment":"Karma"},
    {"name":"Levent","region":"Marmara","city":"Istanbul","lat":41.08,"lng":29.01,"segment":"Ticari"},
    {"name":"Bakırköy","region":"Marmara","city":"Istanbul","lat":40.98,"lng":28.87,"segment":"Bireysel"},
    {"name":"Beşiktaş","region":"Marmara","city":"Istanbul","lat":41.04,"lng":29.00,"segment":"Karma"},
    {"name":"Ataşehir","region":"Marmara","city":"Istanbul","lat":40.99,"lng":29.12,"segment":"Ticari"},
    {"name":"Üsküdar","region":"Marmara","city":"Istanbul","lat":41.02,"lng":29.02,"segment":"Bireysel"},
    {"name":"Şişli","region":"Marmara","city":"Istanbul","lat":41.06,"lng":28.99,"segment":"Ticari"},
    {"name":"Pendik","region":"Marmara","city":"Istanbul","lat":40.88,"lng":29.23,"segment":"Bireysel"},
    {"name":"Bursa Merkez","region":"Marmara","city":"Bursa","lat":40.19,"lng":29.06,"segment":"Karma"},
    {"name":"Kocaeli","region":"Marmara","city":"Kocaeli","lat":40.77,"lng":29.92,"segment":"Ticari"},
    {"name":"Ankara Kızılay","region":"İç Anadolu","city":"Ankara","lat":39.92,"lng":32.85,"segment":"Karma"},
    {"name":"Ankara Çankaya","region":"İç Anadolu","city":"Ankara","lat":39.90,"lng":32.86,"segment":"Ticari"},
    {"name":"Ankara Eryaman","region":"İç Anadolu","city":"Ankara","lat":39.97,"lng":32.65,"segment":"Bireysel"},
    {"name":"Eskişehir","region":"İç Anadolu","city":"Eskişehir","lat":39.77,"lng":30.52,"segment":"Bireysel"},
    {"name":"Konya","region":"İç Anadolu","city":"Konya","lat":37.87,"lng":32.48,"segment":"Karma"},
    {"name":"İzmir Alsancak","region":"Ege","city":"Izmir","lat":38.44,"lng":27.14,"segment":"Ticari"},
    {"name":"İzmir Bornova","region":"Ege","city":"Izmir","lat":38.47,"lng":27.22,"segment":"Bireysel"},
    {"name":"Denizli","region":"Ege","city":"Denizli","lat":37.77,"lng":29.09,"segment":"Karma"},
    {"name":"Antalya Merkez","region":"Akdeniz","city":"Antalya","lat":36.90,"lng":30.70,"segment":"Karma"},
    {"name":"Mersin","region":"Akdeniz","city":"Mersin","lat":36.80,"lng":34.63,"segment":"Ticari"},
    {"name":"Adana","region":"Akdeniz","city":"Adana","lat":37.00,"lng":35.33,"segment":"Bireysel"},
    {"name":"Gaziantep","region":"Güneydoğu Anadolu","city":"Gaziantep","lat":37.06,"lng":37.38,"segment":"Karma"},
    {"name":"Diyarbakır","region":"Güneydoğu Anadolu","city":"Diyarbakır","lat":37.91,"lng":40.22,"segment":"Bireysel"},
    {"name":"Şanlıurfa","region":"Güneydoğu Anadolu","city":"Şanlıurfa","lat":37.16,"lng":38.79,"segment":"Bireysel"},
    {"name":"Trabzon","region":"Karadeniz","city":"Trabzon","lat":41.00,"lng":39.72,"segment":"Karma"},
    {"name":"Samsun","region":"Karadeniz","city":"Samsun","lat":41.29,"lng":36.33,"segment":"Bireysel"},
    {"name":"Erzurum","region":"Doğu Anadolu","city":"Erzurum","lat":39.91,"lng":41.27,"segment":"Bireysel"},
    {"name":"Malatya","region":"Doğu Anadolu","city":"Malatya","lat":38.35,"lng":38.31,"segment":"Karma"},
    {"name":"Van","region":"Doğu Anadolu","city":"Van","lat":38.49,"lng":43.38,"segment":"Bireysel"},
    {"name":"Kayseri","region":"İç Anadolu","city":"Kayseri","lat":38.73,"lng":35.48,"segment":"Ticari"},
]
SEGMENTS = ["Bireysel","Ticari","Karma"]
SEGMENT_WEIGHTS = {"Bireysel":0.8,"Ticari":1.2,"Karma":1.0}
PRIM_TIERS = [
    {"min":0,"max":85,"rate":0,"label":"Eşik Altı"},
    {"min":85,"max":100,"rate":0.005,"label":"Kısmi"},
    {"min":100,"max":120,"rate":0.01,"label":"Tam"},
    {"min":120,"max":999,"rate":0.015,"label":"Hızlandırıcı"}
]

def generate_branches():
    branches = []
    for i, bd in enumerate(BRANCH_DATA):
        branches.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"branch-{bd['name']}")),
            "name": f"{bd['name']} Şubesi",
            "region": bd["region"], "city": bd["city"],
            "lat": bd["lat"], "lng": bd["lng"],
            "segment": bd["segment"],
            "headcount": 0, "target_headcount": random.randint(8, 22),
            "opened_date": f"{random.randint(2015,2023)}-{random.randint(1,12):02d}-01"
        })
    return branches

def generate_sales_data(employees, branches):
    random.seed(55)
    sales = []
    branch_map = {b["id"]: b for b in branches}
    months = [f"2025-{m:02d}" for m in range(1, 13)]
    for emp in employees:
        if emp.get("role_type") != "sales" or emp.get("status") != "active":
            continue
        bid = emp.get("branch_id", "")
        branch = branch_map.get(bid)
        if not branch:
            continue
        seg_k = SEGMENT_WEIGHTS.get(branch.get("segment", "Karma"), 1.0)
        base_target = random.uniform(400000, 1200000) * seg_k
        # Each employee has a skill-based performance factor
        perf_factor = 0.55 + (emp.get("performance_score", 3) / 5) * 0.65
        for period in months:
            monthly_target = round(base_target / 12, 2)
            noise = random.gauss(1.0, 0.15)
            monthly_actual = round(monthly_target * perf_factor * noise, 2)
            ach = round(monthly_actual / monthly_target * 100, 1) if monthly_target else 0
            # Tiered commission
            comm = 0
            for tier in PRIM_TIERS:
                if ach >= tier["min"]:
                    if ach < tier["max"]:
                        comm = round(monthly_actual * tier["rate"], 2)
                        break
            sales.append({
                "employee_id": emp["id"], "employee_name": emp["name"],
                "branch_id": bid, "branch_name": branch["name"],
                "region": branch["region"], "segment": branch["segment"],
                "period": period,
                "target": monthly_target, "actual": monthly_actual,
                "achievement_pct": ach, "commission": comm,
                "portfolio_size": random.randint(15, 120)
            })
    return sales

def generate_seed_data(count=500):
    random.seed(42)
    employees = []
    # Seasonal hiring weights: Q1 high, Q2 medium, Q3 high, Q4 low
    MONTH_HIRE_WEIGHTS = [12,10,11, 8,7,6, 10,11,9, 6,5,5]
    # Year hiring distribution: more recent = more hires
    YEAR_WEIGHTS = {2018:40, 2019:50, 2020:35, 2021:55, 2022:70, 2023:80, 2024:90, 2025:80}
    # Department-specific turnover multiplier
    DEPT_TURNOVER = {"Sales":1.6, "Marketing":1.3, "Operations":1.4, "Information Technology":1.1, "Human Resources":0.9, "Finance":0.8, "Legal":0.7, "Research & Development":0.9, "Administration":1.0, "Supply Chain":1.2}
    # Weighted leaving reasons
    LEAVE_WEIGHTS = [("Better Opportunity","voluntary",28),("Resignation","voluntary",22),("Personal Reasons","voluntary",14),("Career Change","voluntary",10),("Relocation","voluntary",6),("Retirement","voluntary",3),("Performance Issues","involuntary",9),("Restructuring","involuntary",5),("End of Contract","involuntary",3)]
    leave_reasons = [l[0] for l in LEAVE_WEIGHTS]
    leave_types = [l[1] for l in LEAVE_WEIGHTS]
    leave_w = [l[2] for l in LEAVE_WEIGHTS]

    for i in range(count):
        city = random.choices(CITIES, weights=CITY_WEIGHTS, k=1)[0]
        country = CITY_COUNTRY[city]
        gender = random.choices(["Male","Female"], weights=[55,45], k=1)[0]
        first = random.choice(MALE_NAMES if gender == "Male" else FEMALE_NAMES)
        last = random.choice(LAST_NAMES)
        band = random.choices(BANDS, weights=BAND_WEIGHTS, k=1)[0]
        age_min = {"A":22,"B":25,"C":28,"D":32,"E":38}[band]
        age_max = {"A":35,"B":42,"C":50,"D":55,"E":62}[band]
        age = random.randint(age_min, age_max)
        # Year weighted toward recent
        hy = random.choices(list(YEAR_WEIGHTS.keys()), weights=list(YEAR_WEIGHTS.values()), k=1)[0]
        hm = random.choices(range(1,13), weights=MONTH_HIRE_WEIGHTS, k=1)[0]
        hd = random.randint(1, 28)
        hire_date = f"{hy}-{hm:02d}-{hd:02d}"
        seniority = max(0, round(2025 - hy + random.uniform(-0.5, 0.5), 1))
        dept = random.choices(DEPARTMENTS, weights=DEPT_WEIGHTS, k=1)[0]
        pos = get_role_for_employee(dept, band)
        edu = random.choices(EDUCATION_LEVELS, weights=EDUCATION_WEIGHTS, k=1)[0]
        uni = random.choice(UNIVERSITIES) if edu != "High School" else None
        marital = random.choices(MARITAL_STATUS, weights=MARITAL_WEIGHTS, k=1)[0]
        sal_range = SALARY_BY_BAND[band]
        salary = round(random.uniform(sal_range[0], sal_range[1]), -2)
        # Performance: department and band affect score
        base_perf = 3.5 if band in ["D","E"] else 3.3
        perf = max(1.0, min(5.0, round(random.gauss(base_perf, 0.8), 1)))
        is_talent = random.random() < (0.18 if perf >= 4.0 else 0.05)
        is_manager = band in ["D","E"]
        is_disabled = random.random() < 0.03
        is_full_time = random.random() < 0.93
        status = "active"
        termination_date = None
        leaving_reason = None
        termination_type = None
        # Turnover: dept-specific rate, higher for new hires, lower for seniors
        dept_mult = DEPT_TURNOVER.get(dept, 1.0)
        base_turnover = 0.18 * dept_mult
        if seniority < 1: base_turnover *= 1.8  # early attrition
        elif seniority > 7: base_turnover *= 0.6  # loyal long-timers
        if perf < 2.5: base_turnover *= 1.5  # low performers leave more
        if random.random() < min(0.45, base_turnover):
            min_ty = max(hy, 2020)
            if min_ty <= 2025:
                ty = random.choices(range(min_ty, 2026), weights=[max(1, y-2019) for y in range(min_ty, 2026)], k=1)[0]
                tm = random.choices(range(1,13), weights=[8,7,9,10,8,11,7,6,9,10,8,7], k=1)[0]
                td = random.randint(1, 28)
                if f"{ty}-{tm:02d}" > hire_date[:7]:
                    termination_date = f"{ty}-{tm:02d}-{td:02d}"
                    idx = random.choices(range(len(leave_reasons)), weights=leave_w, k=1)[0]
                    leaving_reason = leave_reasons[idx]
                    termination_type = leave_types[idx]
                    status = "terminated"
        emp = {
            "id": str(uuid.uuid4()), "name": f"{first} {last}", "gender": gender, "age": age,
            "hire_date": hire_date, "termination_date": termination_date, "department": dept,
            "job_title": pos, "band": band, "salary": salary, "city": city, "country": country,
            "education_level": edu, "university": uni, "marital_status": marital,
            "is_talent": is_talent, "is_manager": is_manager, "is_disabled": is_disabled,
            "is_full_time": is_full_time, "performance_score": perf, "seniority_years": seniority,
            "mobility_flag": random.random() < 0.35,
            "branch_id": "", "region": "", "role_type": "support",
            "status": status, "leaving_reason": leaving_reason, "termination_type": termination_type,
            "data_source": "seed", "created_at": datetime.now(timezone.utc).isoformat()
        }
        employees.append(emp)
    # Assign branches to employees
    branches = generate_branches()
    branch_ids = [b["id"] for b in branches]
    branch_regions = {b["id"]: b["region"] for b in branches}
    big_city_branches = [b["id"] for b in branches if b["city"] in ["Istanbul","Ankara","Izmir"]]
    small_city_branches = [b["id"] for b in branches if b["city"] not in ["Istanbul","Ankara","Izmir"]]
    for emp in employees:
        if random.random() < 0.65:
            bid = random.choice(big_city_branches)
        else:
            bid = random.choice(small_city_branches) if small_city_branches else random.choice(branch_ids)
        emp["branch_id"] = bid
        emp["region"] = branch_regions[bid]
        if emp["department"] == "Sales" or (emp["band"] in ["A","B"] and random.random() < 0.4):
            emp["role_type"] = "sales"
        elif emp["is_manager"]:
            emp["role_type"] = "manager"
        else:
            emp["role_type"] = "support"
        # Assign banking taxonomy skills
        emp["skills"] = generate_employee_skills(emp["department"], emp["band"])
    # Update branch headcounts
    for b in branches:
        b["headcount"] = len([e for e in employees if e["branch_id"] == b["id"] and e["status"] == "active"])
    return employees

# ---- New Module Constants ----
RECRUITMENT_SOURCES = ["LinkedIn","Referral","Career Site","Agency","Job Board","University","Social Media"]
COURSE_NAMES = ["Leadership Fundamentals","Advanced Project Management","Data Analytics","Cybersecurity Basics","Effective Communication","Python Programming","Cloud Architecture","Financial Modeling","Design Thinking","Agile Methodology","Machine Learning","Compliance Training","Time Management","Presentation Skills","Strategic Planning","Team Building"]
COURSE_CATEGORIES = ["Technical","Leadership","Compliance","Soft Skills","Language"]

# ---- Skills & Competency Framework ----
TECH_SKILLS = ["Python","JavaScript","React","Data Analytics","Cloud Computing","AI/ML","Prompt Engineering","Cybersecurity","DevOps","SQL","UX Design","Java","Agile","Machine Learning","Deep Learning","NLP","Computer Vision","Embedded Systems","Systems Engineering","Autonomous Systems","IoT","Blockchain"]
SOFT_SKILLS = ["Leadership","Communication","Problem Solving","Strategic Thinking","Team Management","Negotiation","Presentation","Critical Thinking","Creativity","Emotional Intelligence","Conflict Resolution","Time Management","Mentoring","Cross-functional Collaboration","Change Management"]
DOMAIN_SKILLS = ["Financial Analysis","HR Management","Project Management","Digital Marketing","Legal Compliance","Supply Chain","Sales Strategy","Business Intelligence","Risk Management","Quality Assurance","Talent Development","Organizational Design"]

# Departman bazlı yetkinlik kümeleri (taxonomy'den)
DEPT_SKILL_CLUSTERS = {
    "Kredi ve Risk": ["kredi-risk-yonetimi","veri-analitigi-bi","uyum-mevzuat-hukuk"],
    "Hazine": ["hazine-sermaye-piyasalari","veri-analitigi-bi"],
    "Bireysel Bankacılık": ["bireysel-bankacilik","sube-operasyonlari","musteri-deneyimi-crm"],
    "Kurumsal Bankacılık": ["kurumsal-ticari-bankacilik","kredi-risk-yonetimi"],
    "Şube Operasyonları": ["sube-operasyonlari","bireysel-bankacilik","musteri-deneyimi-crm"],
    "Dijital Bankacılık": ["dijital-bankacilik","musteri-deneyimi-crm","veri-analitigi-bi"],
    "Uyum ve Mevzuat": ["uyum-mevzuat-hukuk","operasyon-sureç-yonetimi"],
    "Veri ve Analitik": ["veri-analitigi-bi","dijital-bankacilik"],
    "İnsan Kaynakları": ["liderlik-yonetim","davranissal-iletisim","operasyon-sureç-yonetimi"],
    "Operasyon ve Süreç": ["operasyon-sureç-yonetimi","sube-operasyonlari","uyum-mevzuat-hukuk"],
}
PROFICIENCY_LABELS = {1: "Farkında", 2: "Uygulayıcı", 3: "Yetkin", 4: "İleri", 5: "Uzman"}
# Departman bazlı yetkinlik odakları (internal mobility için)
DEPT_SKILL_FOCUS = {
    "Kredi ve Risk": {"tech": ["Bireysel Kredi Skorlama", "KOBİ Kredi Skorlama ve Değerlendirmesi", "Basel III/IV Uygulamaları", "Risk Modeli Validasyonu"], "soft": ["Eleştirel Düşünme ve Problem Çözme", "Yazılı ve Sözlü İletişim"], "domain": ["Kurumsal Kredi Tahsis ve Yapılandırma", "Portföy Risk Yönetimi"]},
    "Hazine": {"tech": ["Aktif-Pasif Yönetimi (ALM)", "FX ve Para Piyasaları İşlemleri", "Türev Araçlar ve Hedging"], "soft": ["Stratejik Düşünme ve Karar Verme"], "domain": ["Sabit Getirili Menkul Kıymetler", "Yatırım Bankacılığı (IB)"]},
    "Bireysel Bankacılık": {"tech": ["Bireysel Kredi Ürünleri (İhtiyaç, Konut, Taşıt)", "Kart ve Ödeme Sistemleri"], "soft": ["Müşteri Odaklılık", "Müzakere ve Etki Becerileri"], "domain": ["Mevduat ve Birikim Ürünleri", "Bireysel Emeklilik ve Sigorta Ürünleri"]},
    "Kurumsal Bankacılık": {"tech": ["KOBİ Bankacılığı", "Kurumsal Bankacılık (Büyük Müşteri)"], "soft": ["Müzakere ve Etki Becerileri"], "domain": ["Dış Ticaret Finansmanı ve Akreditif", "Nakit Yönetimi (Cash Management)"]},
    "Şube Operasyonları": {"tech": ["Gişe ve Nakit Yönetimi", "Şube Satış ve Hedef Yönetimi"], "soft": ["Müşteri Odaklılık", "Takım Çalışması ve İşbirliği"], "domain": ["Şube Yönetimi", "Müşteri Kazanımı ve Onboarding"]},
    "Dijital Bankacılık": {"tech": ["Mobil Bankacılık Ürün Yönetimi", "Open Banking ve API Ekosistemi", "Dijital Ödeme Sistemleri ve QR"], "soft": ["Eleştirel Düşünme ve Problem Çözme"], "domain": ["Dijital Müşteri Yolculuğu"]},
    "Uyum ve Mevzuat": {"tech": ["BDDK Mevzuatı ve Bankacılık Düzenlemeleri", "MASAK ve Suç Gelirleri Aklanması ile Mücadele"], "soft": ["Yazılı ve Sözlü İletişim"], "domain": ["KVKK ve Kişisel Veri Yönetimi", "İç Kontrol ve İç Denetim"]},
    "Veri ve Analitik": {"tech": ["SQL ve Veri Sorgulama", "BI Dashboard ve Veri Görselleştirme", "Makine Öğrenmesi ve Modelleme"], "soft": ["Eleştirel Düşünme ve Problem Çözme"], "domain": ["Veri Mühendisliği ve ETL", "İstatistik ve Risk Modellemesi"]},
    "İnsan Kaynakları": {"tech": ["Ekip Yönetimi ve İnsan Kaynakları", "Performans Yönetimi ve Geri Bildirim"], "soft": ["Koçluk ve Mentorluk", "Değişim Yönetimi"], "domain": ["Stratejik Düşünme ve Karar Verme"]},
    "Operasyon ve Süreç": {"tech": ["Süreç Tasarımı ve İyileştirme", "RPA ve Süreç Otomasyonu"], "soft": ["Takım Çalışması ve İşbirliği"], "domain": ["Takas ve Mutabakat (Settlement)", "EFT, Havale ve FAST Operasyonları"]},
}
CAREER_PATH_BANDS = {
    "A": {"next": "B", "title": "Uzman", "timeline": "12-18 ay"},
    "B": {"next": "C", "title": "Kıdemli Uzman", "timeline": "18-24 ay"},
    "C": {"next": "D", "title": "Müdür", "timeline": "24-36 ay"},
    "D": {"next": "E", "title": "Direktör", "timeline": "36-48 ay"},
    "E": {"next": "E", "title": "Üst Yönetim", "timeline": "devam eden"}
}

def generate_employee_skills(department, band):
    """Generate skills from real banking taxonomy for an employee."""
    clusters = DEPT_SKILL_CLUSTERS.get(department, ["liderlik-yonetim","davranissal-iletisim"])
    # Always add leadership/behavioral for managers
    all_clusters = list(set(clusters + ["liderlik-yonetim","davranissal-iletisim"]))
    # Get skills from relevant clusters
    dept_skills = [s for s in SKILL_TAXONOMY if s["kume_id"] in all_clusters]
    primary_skills = [s for s in SKILL_TAXONOMY if s["kume_id"] in clusters]
    if not dept_skills:
        dept_skills = SKILL_TAXONOMY[:20]
        primary_skills = dept_skills
    band_range = {"A": (1,3), "B": (2,4), "C": (2,5), "D": (3,5), "E": (3,5)}
    mn, mx = band_range.get(band, (1,5))
    skills = []
    # Primary skills (from department clusters)
    n_primary = min(len(primary_skills), random.randint(4, 7))
    for s in random.sample(primary_skills, n_primary):
        skills.append({"skill": s["ad"], "skill_id": s["id"], "category": s["kume_id"], "proficiency": random.randint(mn, mx)})
    # Soft/leadership skills
    soft_skills = [s for s in SKILL_TAXONOMY if s["kume_id"] in ["liderlik-yonetim","davranissal-iletisim"]]
    n_soft = min(len(soft_skills), random.randint(2, 4))
    for s in random.sample(soft_skills, n_soft):
        if s["ad"] not in [sk["skill"] for sk in skills]:
            skills.append({"skill": s["ad"], "skill_id": s["id"], "category": s["kume_id"], "proficiency": random.randint(max(1,mn-1), mx)})
    return skills

def get_role_for_employee(department, band):
    """Get a matching role title from taxonomy based on department and band."""
    families = DEPT_ROLE_FAMILIES.get(department, [])
    matching_roles = [r for r in ROLE_TAXONOMY if r["aile"] in families]
    band_kademe = {"A": [1], "B": [2], "C": [3], "D": [4], "E": [5,6]}
    target_kademeler = band_kademe.get(band, [1,2])
    exact = [r for r in matching_roles if r["kademe_seviyesi"] in target_kademeler]
    if exact:
        return random.choice(exact)["unvan"]
    if matching_roles:
        return random.choice(matching_roles)["unvan"]
    return random.choice(POSITIONS_BY_BAND.get(band, ["Uzman"]))


def generate_recruitment_data(count=200):
    random.seed(43)
    candidates = []
    for i in range(count):
        gender = random.choice(["Male","Female"])
        name = f"{random.choice(MALE_NAMES if gender=='Male' else FEMALE_NAMES)} {random.choice(LAST_NAMES)}"
        dept = random.choices(DEPARTMENTS, weights=DEPT_WEIGHTS, k=1)[0]
        pos = random.choice(sum(POSITIONS_BY_BAND.values(), []))
        source = random.choice(RECRUITMENT_SOURCES)
        r = random.random()
        if r < 0.12: stage = "Hired"
        elif r < 0.22: stage = "Offered"
        elif r < 0.42: stage = "Interviewed"
        elif r < 0.62: stage = "Screened"
        elif r < 0.78: stage = "Rejected"
        else: stage = "Applied"
        applied_date = f"2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        days = random.randint(15, 90) if stage in ["Hired","Offered"] else random.randint(3, 45)
        cost = round(random.uniform(2000, 15000), -2) if stage == "Hired" else 0
        candidates.append({"id": str(uuid.uuid4()), "candidate_name": name, "position": pos, "department": dept, "source": source, "stage": stage, "applied_date": applied_date, "days_in_pipeline": days, "cost": cost, "experience_years": random.randint(0, 20), "education": random.choices(EDUCATION_LEVELS, weights=EDUCATION_WEIGHTS, k=1)[0], "created_at": datetime.now(timezone.utc).isoformat()})
    return candidates

def generate_training_data(employees, count=300):
    random.seed(44)
    records = []
    active = [e for e in employees if e['status'] == 'active']
    for i in range(count):
        emp = random.choice(active)
        course = random.choice(COURSE_NAMES)
        cat = random.choice(COURSE_CATEGORIES)
        status = random.choices(["Completed","In Progress","Not Started"], weights=[60,25,15], k=1)[0]
        hours = round(random.uniform(4, 40), 1) if status != "Not Started" else 0
        score = round(random.uniform(55, 100), 1) if status == "Completed" else None
        records.append({"id": str(uuid.uuid4()), "employee_id": emp['id'], "employee_name": emp['name'], "department": emp['department'], "course_name": course, "category": cat, "hours": hours, "status": status, "score": score, "date": f"2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}", "cost": round(random.uniform(200, 5000), -2), "created_at": datetime.now(timezone.utc).isoformat()})
    return records

def generate_engagement_data(employees):
    random.seed(45)
    surveys = []
    active = [e for e in employees if e['status'] == 'active']
    for emp in active:
        eng = round(max(1, min(10, random.gauss(7, 1.5))), 1)
        surveys.append({"id": str(uuid.uuid4()), "employee_id": emp['id'], "employee_name": emp['name'], "department": emp['department'], "engagement_score": eng, "enps_score": random.randint(-20, 80), "satisfaction": round(max(1, min(5, random.gauss(3.5, 0.8))), 1), "work_life_balance": round(max(1, min(5, random.gauss(3.3, 0.9))), 1), "career_growth": round(max(1, min(5, random.gauss(3.2, 1.0))), 1), "manager_rating": round(max(1, min(5, random.gauss(3.6, 0.7))), 1), "recognition": round(max(1, min(5, random.gauss(3.4, 0.8))), 1), "culture_alignment": round(max(1, min(5, random.gauss(3.5, 0.7))), 1), "survey_date": f"2025-{random.randint(1,6):02d}-01", "absenteeism_days": random.randint(0, 15), "created_at": datetime.now(timezone.utc).isoformat()})
    return surveys


# ---- Helpers ----
AGE_RANGES = ["20-25","26-30","31-35","36-40","41-45","46-50","51-55","55+"]
SENIORITY_RANGES = ["0-1","1-3","3-5","5-10","10-15","15-20","20+"]
MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

def get_age_range(age):
    if age < 25: return "20-25"
    elif age < 30: return "26-30"
    elif age < 35: return "31-35"
    elif age < 40: return "36-40"
    elif age < 45: return "41-45"
    elif age < 50: return "46-50"
    elif age < 55: return "51-55"
    else: return "55+"

def get_seniority_range(y):
    if y < 1: return "0-1"
    elif y < 3: return "1-3"
    elif y < 5: return "3-5"
    elif y < 10: return "5-10"
    elif y < 15: return "10-15"
    elif y < 20: return "15-20"
    else: return "20+"

def count_by(items, key):
    counts = {}
    for item in items:
        val = item.get(key, "Unknown")
        if val is None:
            val = "Unknown"
        counts[val] = counts.get(val, 0) + 1
    return [{"name": name, "value": total} for name, total in sorted(counts.items())]

def count_by_range(items, key, fn, ranges):
    counts = {rng: 0 for rng in ranges}
    for item in items:
        rng = fn(item.get(key, 0))
        if rng in counts:
            counts[rng] += 1
    return [{"range": rng, "count": counts[rng]} for rng in ranges]

def count_by_gender_range(items, key, fn, ranges):
    male_counts = {rng: 0 for rng in ranges}
    female_counts = {rng: 0 for rng in ranges}
    for item in items:
        rng = fn(item.get(key, 0))
        if rng in male_counts:
            if item.get("gender") == "Male":
                male_counts[rng] += 1
            else:
                female_counts[rng] += 1
    return [{"range": rng, "male": male_counts[rng], "female": female_counts[rng]} for rng in ranges]

def shorten_dept(dept):
    return dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")

async def get_filtered(year, country=None, tenant=None):
    query = {}
    if tenant:
        query["tenant_id"] = tenant
    all_emp = await db.employees.find(query, {"_id": 0}).to_list(10000)
    if country:
        all_emp = [e for e in all_emp if e.get('country') == country]
    active = [e for e in all_emp if e['hire_date'][:4] <= str(year) and (not e.get('termination_date') or e['termination_date'][:4] > str(year))]
    hired = [e for e in all_emp if e['hire_date'][:4] == str(year)]
    left = [e for e in all_emp if e.get('termination_date') and e['termination_date'][:4] == str(year)]
    return all_emp, active, hired, left

def safe_avg(items, key):
    vals = [i.get(key, 0) for i in items if i.get(key) is not None]
    return round(sum(vals)/len(vals), 1) if vals else 0

# ---- Startup ----
@app.on_event("startup")
async def startup():
    try:
        count = await db.employees.count_documents({})
        if count == 0:
            logger.info("Seeding demo data (first deploy)...")
            emps = generate_seed_data(500)
            for emp in emps:
                random.seed(hash(emp['id']) % 2**32)
                emp['skills'] = generate_employee_skills(emp.get('department',''), emp.get('band','B'))
            await db.employees.insert_many(emps)
            logger.info(f"Seeded {len(emps)} employees with skills")
            # Seed branches
            branches = generate_branches()
            for b in branches:
                b["headcount"] = len([e for e in emps if e["branch_id"] == b["id"] and e["status"] == "active"])
            await db.branches.insert_many(branches)
            logger.info(f"Seeded {len(branches)} branches")
            # Seed sales performance
            sales = generate_sales_data(emps, branches)
            if sales:
                await db.sales_performance.insert_many(sales)
                logger.info(f"Seeded {len(sales)} sales records")
            cands = generate_recruitment_data(200)
            await db.recruitment.insert_many(cands)
            logger.info(f"Seeded {len(cands)} candidates")
            trn = generate_training_data(emps, 300)
            await db.training.insert_many(trn)
            logger.info(f"Seeded {len(trn)} training records")
            eng = generate_engagement_data(emps)
            await db.engagement.insert_many(eng)
            logger.info(f"Seeded {len(eng)} engagement surveys")
            logger.info("Demo data seeding complete!")
        else:
            if await db.branches.count_documents({}) == 0:
                logger.info("Adding branches and sales data to existing DB...")
                emps = await db.employees.find({}, {"_id": 0}).to_list(10000)
                branches = generate_branches()
                # Assign branches to employees that don't have one
                from pymongo import UpdateOne
                branch_ids = [b["id"] for b in branches]
                branch_regions = {b["id"]: b["region"] for b in branches}
                big_city_branches = [b["id"] for b in branches if b["city"] in ["Istanbul","Ankara","Izmir"]]
                small_city_branches = [b["id"] for b in branches if b["city"] not in ["Istanbul","Ankara","Izmir"]]
                ops = []
                for emp in emps:
                    if not emp.get("branch_id"):
                        bid = random.choice(big_city_branches) if random.random() < 0.65 else random.choice(small_city_branches)
                        role_type = "sales" if (emp.get("department") == "Sales" or (emp.get("band","C") in ["A","B"] and random.random() < 0.4)) else ("manager" if emp.get("is_manager") else "support")
                        ops.append(UpdateOne({"id": emp["id"]}, {"$set": {"branch_id": bid, "region": branch_regions[bid], "role_type": role_type}}))
                if ops:
                    await db.employees.bulk_write(ops)
                # Recount headcounts
                active_emps = await db.employees.find({"status": "active"}, {"_id": 0}).to_list(10000)
                for b in branches:
                    b["headcount"] = len([e for e in active_emps if e.get("branch_id") == b["id"]])
                await db.branches.insert_many(branches)
                logger.info(f"Seeded {len(branches)} branches")
                sales = generate_sales_data(active_emps, branches)
                if sales:
                    await db.sales_performance.insert_many(sales)
                    logger.info(f"Seeded {len(sales)} sales records")
            if await db.recruitment.count_documents({}) == 0:
                cands = generate_recruitment_data(200)
                await db.recruitment.insert_many(cands)
            if await db.training.count_documents({}) == 0:
                emps = await db.employees.find({}, {"_id": 0}).to_list(10000)
                trn = generate_training_data(emps, 300)
                await db.training.insert_many(trn)
            if await db.engagement.count_documents({}) == 0:
                emps = await db.employees.find({}, {"_id": 0}).to_list(10000)
                eng = generate_engagement_data(emps)
                await db.engagement.insert_many(eng)
            no_skills = await db.employees.count_documents({"skills": {"$exists": False}})
            if no_skills > 0:
                logger.info(f"Adding skills to {no_skills} employees...")
                emps_no_skills = await db.employees.find({"skills": {"$exists": False}}).to_list(10000)
                from pymongo import UpdateOne
                ops = []
                for emp in emps_no_skills:
                    random.seed(hash(str(emp.get('_id',''))) % 2**32)
                    skills = generate_employee_skills(emp.get('department',''), emp.get('band','B'))
                    ops.append(UpdateOne({"_id": emp['_id']}, {"$set": {"skills": skills}}))
                if ops:
                    await db.employees.bulk_write(ops)
                logger.info(f"Skills added to {no_skills} employees")
            # Migration: replace Italian names with Turkish names
            italian_firsts = {"Marco","Luca","Alessandro","Andrea","Giovanni","Matteo","Francesco","Lorenzo","Davide","Giuseppe",
                              "Giulia","Francesca","Sara","Chiara","Valentina","Elena","Alessia","Marta","Laura","Anna"}
            italian_lasts = {"Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo","Ricci","Marino","Greco"}
            all_emps = await db.employees.find({}, {"_id": 0, "name": 1}).to_list(10000)
            from pymongo import UpdateOne as UO
            name_ops = []
            for emp in all_emps:
                name = emp.get("name","")
                parts = name.split()
                if len(parts) >= 2:
                    first, last = parts[0], parts[-1]
                    changed = False
                    if first in italian_firsts:
                        first = random.choice(MALE_NAMES if random.random() < 0.55 else FEMALE_NAMES)
                        changed = True
                    if last in italian_lasts:
                        last = random.choice(LAST_NAMES)
                        changed = True
                    if "Dilan" in name:
                        first = "Cansu"
                        changed = True
                    if changed:
                        new_name = f"{first} {last}"
                        name_ops.append(UO({"name": name}, {"$set": {"name": new_name}}))
            if name_ops:
                await db.employees.bulk_write(name_ops)
                # Also update sales_performance employee_name
                for op in name_ops:
                    old_name = op._filter["name"]
                    new_name = op._doc["$set"]["name"]
                    await db.sales_performance.update_many({"employee_name": old_name}, {"$set": {"employee_name": new_name}})
                logger.info(f"Migrated {len(name_ops)} Italian/unwanted names to Turkish")
    except Exception as e:
        logger.error(f"Startup seed error: {e}")
    # Seed admin user
    try:
        from auth import seed_admin
        await seed_admin(db)
        logger.info("Admin user ready")
    except Exception as e:
        logger.error(f"Admin seed error: {e}")
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.warning(f"Storage init: {e}")

@api_router.get("/")
async def root():
    return {"message": "Plenalitik API v1.0"}

@api_router.post("/seed")
async def seed_data():
    await db.employees.delete_many({})
    emps = generate_seed_data(500)
    # Add skills to employees
    for emp in emps:
        random.seed(hash(emp['id']) % 2**32)
        emp['skills'] = generate_employee_skills(emp.get('department',''), emp.get('band','B'))
    await db.employees.insert_many(emps)
    return {"message": f"Seeded {len(emps)} employees", "count": len(emps)}

@api_router.get("/dashboard/years")
async def get_years():
    emps = await db.employees.find({}, {"_id": 0, "hire_date": 1}).to_list(10000)
    years = sorted(set(int(e['hire_date'][:4]) for e in emps), reverse=True)
    return {"years": years}

# ---- Overview ----
@api_router.get("/dashboard/overview")
async def get_overview(year: int = 2025, country: str = None, tenant: str = None):
    all_emp, active, hired, left = await get_filtered(year, country, tenant=tenant)
    hc = len(active)
    disabled = len([e for e in active if e.get('is_disabled')])
    managers = len([e for e in active if e.get('is_manager')])
    hc_by_month = []
    for mi, mn in enumerate(MONTHS):
        ms = f"{year}-{mi+1:02d}"
        c = len([e for e in all_emp if e['hire_date'][:7] <= ms and (not e.get('termination_date') or e['termination_date'][:7] > ms)])
        hc_by_month.append({"month": mn, "count": c})
    # Q-o-Q trends (compare with previous year same period)
    _, prev_active, prev_hired, prev_left = await get_filtered(year - 1, country, tenant=tenant)
    prev_hc = len(prev_active)
    prev_turnover = round(len(prev_left)/prev_hc*100,1) if prev_hc else 0
    cur_turnover = round(len(left)/hc*100,1) if hc else 0
    trends = {
        "headcount": {"prev": prev_hc, "delta": hc - prev_hc, "pct": round((hc - prev_hc)/prev_hc*100,1) if prev_hc else 0},
        "hires": {"prev": len(prev_hired), "delta": len(hired) - len(prev_hired), "pct": round((len(hired) - len(prev_hired))/len(prev_hired)*100,1) if prev_hired else 0},
        "leaves": {"prev": len(prev_left), "delta": len(left) - len(prev_left), "pct": round((len(left) - len(prev_left))/max(1,len(prev_left))*100,1)},
        "turnover": {"prev": prev_turnover, "delta": round(cur_turnover - prev_turnover, 1), "pct": 0}
    }
    # Country distribution
    country_dist = count_by(active, 'country') if not country else []
    return {
        "kpis": {"headcount": hc, "hires": len(hired), "leaves": len(left),
                 "turnover_rate": cur_turnover,
                 "disabled_pct": round(disabled/hc*100,1) if hc else 0},
        "trends": trends,
        "gender_distribution": count_by(active, 'gender'),
        "age_distribution": count_by_range(active, 'age', get_age_range, AGE_RANGES),
        "seniority_distribution": count_by_range(active, 'seniority_years', get_seniority_range, SENIORITY_RANGES),
        "band_distribution": count_by(active, 'band'),
        "department_distribution": count_by(active, 'department'),
        "country_distribution": country_dist,
        "headcount_by_month": hc_by_month,
        "manager_distribution": [{"name": "Manager", "value": managers}, {"name": "Non-Manager", "value": hc - managers}]
    }

# ---- Headcount ----
@api_router.get("/dashboard/headcount")
async def get_headcount(year: int = 2025, country: str = None, tenant: str = None):
    _, active, _, _ = await get_filtered(year, country, tenant=tenant)
    hc = len(active)
    female_leaders = len([e for e in active if e.get('gender') == 'Female' and e.get('is_manager')])
    talents = len([e for e in active if e.get('is_talent')])
    band_gender = []
    for b in BANDS:
        be = [e for e in active if e.get('band') == b]
        band_gender.append({"band": b, "male": len([e for e in be if e['gender']=='Male']), "female": len([e for e in be if e['gender']=='Female'])})
    emp_list = [{"name":e['name'],"department":e['department'],"job_title":e['job_title'],"band":e['band'],"age":e['age'],"gender":e['gender'],"city":e['city'],"salary":e['salary']} for e in active[:50]]
    return {
        "kpis": {"headcount": hc, "female_leaders": female_leaders, "talents": talents,
                 "avg_age": safe_avg(active, 'age'), "avg_seniority": safe_avg(active, 'seniority_years')},
        "department_distribution": count_by(active, 'department'),
        "age_gender": count_by_gender_range(active, 'age', get_age_range, AGE_RANGES),
        "seniority_gender": count_by_gender_range(active, 'seniority_years', get_seniority_range, SENIORITY_RANGES),
        "band_gender": band_gender,
        "city_distribution": count_by(active, 'city'),
        "education_distribution": count_by(active, 'education_level'),
        "marital_distribution": count_by(active, 'marital_status'),
        "fulltime_distribution": [
            {"name": "Full Time", "value": len([e for e in active if e.get('is_full_time')])},
            {"name": "Part Time", "value": len([e for e in active if not e.get('is_full_time')])}
        ],
        "employee_list": emp_list
    }

# ---- Hires ----
@api_router.get("/dashboard/hires")
async def get_hires(year: int = 2025, tenant: str = None):
    _, active, hired, _ = await get_filtered(year, tenant=tenant)
    hc = len(active)
    females = len([e for e in hired if e['gender']=='Female'])
    hires_month = []
    for mi, mn in enumerate(MONTHS):
        ms = f"{year}-{mi+1:02d}"
        hires_month.append({"month": mn, "count": len([e for e in hired if e['hire_date'][:7]==ms])})
    still_active = len([e for e in hired if e['status']=='active'])
    retention = round(still_active/len(hired)*100,1) if hired else 0
    emp_list = [{"name":e['name'],"department":e['department'],"job_title":e['job_title'],"band":e['band'],"hire_date":e['hire_date'],"gender":e['gender']} for e in hired[:50]]
    return {
        "kpis": {"total_hires": len(hired), "avg_age": safe_avg(hired,'age'),
                 "retention_rate": retention, "female_ratio": round(females/len(hired)*100,1) if hired else 0},
        "hires_by_month": hires_month,
        "gender_distribution": count_by(hired, 'gender'),
        "age_distribution": count_by_range(hired, 'age', get_age_range, AGE_RANGES),
        "department_distribution": count_by(hired, 'department'),
        "education_distribution": count_by(hired, 'education_level'),
        "band_distribution": count_by(hired, 'band'),
        "employee_list": emp_list
    }

# ---- Leaves ----
@api_router.get("/dashboard/leaves")
async def get_leaves(year: int = 2025, tenant: str = None):
    _, active, _, left = await get_filtered(year, tenant=tenant)
    females = len([e for e in left if e['gender']=='Female'])
    leaves_month = []
    for mi, mn in enumerate(MONTHS):
        ms = f"{year}-{mi+1:02d}"
        leaves_month.append({"month": mn, "count": len([e for e in left if e.get('termination_date','')[:7]==ms])})
    reasons = {}
    for e in left:
        r = e.get('leaving_reason', 'Unknown')
        reasons[r] = reasons.get(r, 0) + 1
    emp_list = [{"name":e['name'],"department":e['department'],"job_title":e['job_title'],"termination_date":e['termination_date'],"leaving_reason":e.get('leaving_reason',''),"gender":e['gender']} for e in left[:50]]
    return {
        "kpis": {"total_leaves": len(left), "avg_age": safe_avg(left,'age'),
                 "avg_seniority": safe_avg(left,'seniority_years'), "female_ratio": round(females/len(left)*100,1) if left else 0},
        "leaves_by_month": leaves_month,
        "gender_distribution": count_by(left, 'gender'),
        "age_distribution": count_by_range(left, 'age', get_age_range, AGE_RANGES),
        "department_distribution": count_by(left, 'department'),
        "leaving_reasons": [{"reason": k, "count": v} for k, v in sorted(reasons.items(), key=lambda x:-x[1])],
        "employee_list": emp_list
    }

# ---- Turnover ----
def _compute_monthly_turnover(left, hc, year):
    result = []
    cum = 0
    for mi, mn in enumerate(MONTHS):
        ms = f"{year}-{mi+1:02d}"
        monthly_left = len([e for e in left if e.get('termination_date','')[:7] == ms])
        rate = round(monthly_left / hc * 100, 1) if hc else 0
        cum += rate
        result.append({"month": mn, "rate": rate, "cumulative": round(cum, 1)})
    return result

def _compute_group_turnover(active, left, groups, group_key, label_key="name", label_fn=None):
    result = []
    for group in groups:
        grp_active = [e for e in active if (label_fn(e) if label_fn else e.get(group_key)) == group]
        grp_left = [e for e in left if (label_fn(e) if label_fn else e.get(group_key)) == group]
        rate = round(len(grp_left) / len(grp_active) * 100, 1) if grp_active else 0
        result.append({label_key: group, "rate": rate})
    return result

@api_router.get("/dashboard/turnover")
async def get_turnover(year: int = 2025, country: str = None, tenant: str = None):
    all_emp, active, hired, left = await get_filtered(year, country, tenant=tenant)
    hc = len(active)
    vol = [e for e in left if e.get('termination_type') == 'voluntary']
    invol = [e for e in left if e.get('termination_type') == 'involuntary']
    talent_left = [e for e in left if e.get('is_talent')]
    new_hire_left = [e for e in left if e['hire_date'][:4] == str(year)]

    turnover_month = _compute_monthly_turnover(left, hc, year)

    reasons = {}
    for emp in left:
        reason = emp.get('leaving_reason', 'Unknown')
        reasons[reason] = reasons.get(reason, 0) + 1

    dept_turnover = _compute_group_turnover(active, left, [shorten_dept(d) for d in DEPARTMENTS], 'department', 'department',
                                             lambda e: shorten_dept(e['department']))
    age_turnover = _compute_group_turnover(active, left, AGE_RANGES, 'age', 'range', lambda e: get_age_range(e['age']))
    gender_turnover = _compute_group_turnover(active, left, ["Male", "Female"], 'gender', 'gender')

    yearly = []
    for y in range(2020, year + 1):
        _, ya, _, yl = await get_filtered(y, country, tenant=tenant)
        rate = round(len(yl) / len(ya) * 100, 1) if ya else 0
        yearly.append({"year": y, "rate": rate})

    return {
        "kpis": {
            "turnover_rate": round(len(left) / hc * 100, 1) if hc else 0,
            "voluntary_rate": round(len(vol) / hc * 100, 1) if hc else 0,
            "involuntary_rate": round(len(invol) / hc * 100, 1) if hc else 0,
            "talent_turnover": round(len(talent_left) / hc * 100, 1) if hc else 0,
            "new_hire_turnover": round(len(new_hire_left) / hc * 100, 1) if hc else 0,
        },
        "turnover_by_month": turnover_month,
        "leaving_reasons": [{"reason": k, "count": v} for k, v in sorted(reasons.items(), key=lambda x: -x[1])],
        "turnover_by_department": dept_turnover,
        "turnover_by_age": age_turnover,
        "turnover_by_gender": gender_turnover,
        "turnover_by_year": yearly,
    }

# ---- Movement ----
@api_router.get("/dashboard/movement")
async def get_movement(year: int = 2025, tenant: str = None):
    all_emp, active, hired, left = await get_filtered(year, tenant=tenant)
    hc = len(active)
    early_left = [e for e in left if e['hire_date'][:4]==str(year) or (int(e.get('termination_date','2025')[:4]) - int(e['hire_date'][:4])) < 1]
    failure_180 = round(len(early_left)/len(hired)*100,1) if hired else 0
    hl_month = []
    for mi, mn in enumerate(MONTHS):
        ms = f"{year}-{mi+1:02d}"
        h = len([e for e in hired if e['hire_date'][:7]==ms])
        l = len([e for e in left if e.get('termination_date','')[:7]==ms])
        hl_month.append({"month": mn, "hires": h, "leaves": l})
    hl_dept = []
    for dept in DEPARTMENTS:
        short = dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        h = len([e for e in hired if e['department']==dept])
        l = len([e for e in left if e['department']==dept])
        hl_dept.append({"department": short, "hires": h, "leaves": l})
    retention_yearly = []
    for y in range(2020, year+1):
        _, ya, _, yl = await get_filtered(y, tenant=tenant)
        rate = round((1 - len(yl)/len(ya))*100,1) if ya else 100
        retention_yearly.append({"year": y, "rate": rate})
    band_move = []
    for b in BANDS:
        h = len([e for e in hired if e['band']==b])
        l = len([e for e in left if e['band']==b])
        band_move.append({"band": b, "hires": h, "leaves": l})
    age_move = []
    for ar in AGE_RANGES:
        h = len([e for e in hired if get_age_range(e['age'])==ar])
        l = len([e for e in left if get_age_range(e['age'])==ar])
        age_move.append({"range": ar, "hires": h, "leaves": l})
    return {
        "kpis": {"hires": len(hired), "leaves": len(left), "net_movement": len(hired)-len(left), "failure_rate_180": failure_180},
        "hires_leaves_by_month": hl_month,
        "hires_leaves_by_department": hl_dept,
        "retention_by_year": retention_yearly,
        "movement_by_band": band_move,
        "movement_by_age": age_move
    }

# ---- AI Forecast ----
class ForecastRequest(BaseModel):
    year: int = 2025
    tenant: Optional[str] = None

def _compute_headcount_forecast(hc, net, year):
    forecast = []
    cur = hc
    for month_name in ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]:
        cur = int(cur + net + random.uniform(-2, 2))
        forecast.append({"month": f"{month_name} {year}", "predicted": cur, "lower": int(cur * 0.95), "upper": int(cur * 1.05)})
    return forecast

def _compute_dept_risks(active, left):
    risks = []
    for dept in DEPARTMENTS:
        dept_active = [e for e in active if e['department'] == dept]
        dept_left = [e for e in left if e['department'] == dept]
        risk = round(len(dept_left) / len(dept_active) * 100, 1) if dept_active else 0
        risks.append({"department": shorten_dept(dept), "risk": risk, "headcount": len(dept_active)})
    return sorted(risks, key=lambda x: -x['risk'])

def _build_at_risk_list(active):
    at_risk = sorted([e for e in active if e.get('performance_score', 3) < 2.5], key=lambda x: x.get('performance_score', 3))[:10]
    return [{"name": e['name'], "department": e['department'], "performance": e.get('performance_score', 0),
             "seniority": e.get('seniority_years', 0),
             "risk_level": "Yüksek" if e.get('performance_score', 3) < 2 else "Orta"} for e in at_risk]

@api_router.post("/ai/forecast")
async def ai_forecast(body: ForecastRequest):
    year = body.year
    tenant = body.tenant
    all_emp, active, hired, left = await get_filtered(year, tenant=tenant)
    hc = len(active)
    turnover_rate = len(left) / hc if hc else 0
    net = len(hired) / 12 - len(left) / 12

    hc_forecast = _compute_headcount_forecast(hc, net, year)
    dept_risks = _compute_dept_risks(active, left)
    at_risk_list = _build_at_risk_list(active)

    attrition_level = "Düşük" if turnover_rate < 0.1 else "Orta" if turnover_rate < 0.2 else "Yüksek"
    avg_perf = safe_avg(active, 'performance_score')
    burnout = max(0, min(1, (5 - avg_perf) / 5 * 0.6))
    burnout_level = "Düşük" if burnout < 0.3 else "Orta" if burnout < 0.6 else "Yüksek"

    result = {
        "attrition_risk": {"score": round(turnover_rate, 2), "level": attrition_level},
        "headcount_forecast": hc_forecast,
        "burnout_risk": {"score": round(burnout, 2), "level": burnout_level},
        "department_risks": dept_risks[:6],
        "at_risk_employees": at_risk_list,
        "recommendations": [
            "Yüksek devir oranına sahip departmanlarda tutma stratejilerine odaklan",
            "Yeni işe alınanlar için 180 gün başarısızlık oranını azaltacak mentorluk programı uygula",
            "Yetenek tutma için ücret politikasını gözden geçir",
            "Yüksek performanslı çalışanlar için kariyer gelişim yolları oluştur",
            "Oryantasyon sürecini iyileştir",
        ],
        "ai_summary": "",
    }
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        summary_data = {"headcount": hc, "hires": len(hired), "leaves": len(left),
                        "turnover_pct": round(turnover_rate * 100, 1),
                        "avg_age": safe_avg(active, 'age'), "avg_seniority": safe_avg(active, 'seniority_years'),
                        "top_risk_depts": [d['department'] for d in dept_risks[:3]]}
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()),
                       system_message="Deneyimli bir İK analitiği danışmanısın. Kısa ve uygulanabilir içgörüler ver. Türkçe yaz. En fazla 150 kelime.")
        chat.with_model("openai", "gpt-5.2")
        msg = UserMessage(text=f"{year} yılı İK verilerini analiz et ve temel işgücü öngörülerini sun:\n{json.dumps(summary_data)}")
        response = await chat.send_message(msg)
        result["ai_summary"] = response
    except Exception as e:
        logger.error(f"AI error: {e}")
        result["ai_summary"] = "AI analysis unavailable. Showing computed forecasts based on historical patterns."
    return result

# ---- Data Upload ----
def _map_upload_columns(df):
    col_map = {}
    for col in df.columns:
        cl = col.lower().strip()
        if 'name' in cl or 'ad' in cl: col_map[col] = 'name'
        elif 'gender' in cl or 'cinsiyet' in cl: col_map[col] = 'gender'
        elif 'age' in cl or 'yas' in cl: col_map[col] = 'age'
        elif 'department' in cl or 'departman' in cl or 'birim' in cl: col_map[col] = 'department'
        elif 'title' in cl or 'pozisyon' in cl or 'position' in cl: col_map[col] = 'job_title'
        elif 'band' in cl: col_map[col] = 'band'
        elif 'salary' in cl or 'maas' in cl: col_map[col] = 'salary'
        elif 'city' in cl or 'sehir' in cl: col_map[col] = 'city'
        elif 'hire' in cl or 'ise_giris' in cl or 'start' in cl: col_map[col] = 'hire_date'
        elif 'education' in cl or 'egitim' in cl: col_map[col] = 'education_level'
    return col_map

def _create_employee_from_record(rec):
    return {
        "id": str(uuid.uuid4()),
        "name": str(rec.get('name', 'Unknown')),
        "gender": str(rec.get('gender', random.choice(['Male', 'Female']))),
        "age": int(rec.get('age', random.randint(25, 45))),
        "hire_date": str(rec.get('hire_date', f"2024-{random.randint(1,12):02d}-01")),
        "termination_date": None,
        "department": str(rec.get('department', 'General')),
        "job_title": str(rec.get('job_title', 'Specialist')),
        "band": str(rec.get('band', random.choice(BANDS))),
        "salary": float(rec.get('salary', 50000)),
        "city": str(rec.get('city', 'Istanbul')),
        "education_level": str(rec.get('education_level', 'Bachelor')),
        "university": None, "marital_status": "Single",
        "is_talent": False, "is_manager": False, "is_disabled": False, "is_full_time": True,
        "performance_score": round(random.uniform(2.5, 4.5), 1),
        "seniority_years": round(random.uniform(0, 5), 1),
        "status": "active", "leaving_reason": None, "termination_type": None,
        "data_source": "upload", "created_at": datetime.now(timezone.utc).isoformat(),
    }

def _try_store_file(content, ext, content_type):
    try:
        sp = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
        put_object(sp, content, content_type or "application/octet-stream")
        return sp
    except Exception:
        return None

@api_router.post("/data/upload")
async def upload_data(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "unknown"
    ext = filename.split('.')[-1].lower()
    if ext not in ['xlsx', 'xls', 'csv']:
        raise HTTPException(400, "Unsupported format. Use .xlsx or .csv")
    try:
        df = pd.read_excel(BytesIO(content)) if ext in ['xlsx', 'xls'] else pd.read_csv(BytesIO(content))
        storage_path = _try_store_file(content, ext, file.content_type)
        col_map = _map_upload_columns(df)
        df_renamed = df.rename(columns=col_map)
        records = df_renamed.to_dict('records')
        employees = [_create_employee_from_record(rec) for rec in records]
        if employees:
            await db.employees.insert_many(employees)
        file_rec = {
            "id": str(uuid.uuid4()), "filename": filename, "storage_path": storage_path,
            "row_count": len(records), "columns": list(df.columns),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.data_sources.insert_one(file_rec)
        return {"message": f"Imported {len(records)} records", "filename": filename,
                "row_count": len(records), "columns": list(df.columns), "mapped_columns": col_map}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Error processing file: {str(e)}")

@api_router.get("/data/sources")
async def get_sources():
    sources = await db.data_sources.find({}, {"_id": 0}).to_list(100)
    return {"sources": sources}

@api_router.delete("/data/reset")
async def reset_data():
    await db.employees.delete_many({})
    await db.data_sources.delete_many({})
    await db.recruitment.delete_many({})
    await db.training.delete_many({})
    await db.engagement.delete_many({})
    await db.branches.delete_many({})
    await db.sales_performance.delete_many({})
    emps = generate_seed_data(500)
    for emp in emps:
        random.seed(hash(emp['id']) % 2**32)
        emp['skills'] = generate_employee_skills(emp.get('department',''), emp.get('band','B'))
    await db.employees.insert_many(emps)
    branches = generate_branches()
    for b in branches:
        b["headcount"] = len([e for e in emps if e["branch_id"] == b["id"] and e["status"] == "active"])
    await db.branches.insert_many(branches)
    sales = generate_sales_data(emps, branches)
    if sales:
        await db.sales_performance.insert_many(sales)
    cands = generate_recruitment_data(200)
    await db.recruitment.insert_many(cands)
    trn = generate_training_data(emps, 300)
    await db.training.insert_many(trn)
    eng = generate_engagement_data(emps)
    await db.engagement.insert_many(eng)
    return {"message": "Reset to demo data", "count": len(emps)}

# ---- Recruitment ----
@api_router.get("/dashboard/recruitment")
async def get_recruitment(year: int = 2025, tenant: str = None):
    rq = {"tenant_id": tenant} if tenant else {}
    all_cands = await db.recruitment.find(rq, {"_id": 0}).to_list(10000)
    cands = [c for c in all_cands if c.get('applied_date','')[:4] == str(year)]
    total = len(cands)
    hired = [c for c in cands if c['stage'] == 'Hired']
    offered = [c for c in cands if c['stage'] in ['Offered','Hired']]
    avg_days = safe_avg(hired, 'days_in_pipeline') if hired else safe_avg(cands, 'days_in_pipeline')
    total_cost = sum(c['cost'] for c in hired)
    cost_per = round(total_cost / len(hired)) if hired else 0
    accept = round(len(hired) / len(offered) * 100, 1) if offered else 0
    screened = len([c for c in cands if c['stage'] in ['Screened','Interviewed','Offered','Hired']])
    interviewed = len([c for c in cands if c['stage'] in ['Interviewed','Offered','Hired']])
    funnel = [{"stage":"Applied","count":total},{"stage":"Screened","count":screened},{"stage":"Interviewed","count":interviewed},{"stage":"Offered","count":len(offered)},{"stage":"Hired","count":len(hired)}]
    by_month = [{"month": mn, "count": len([c for c in cands if c['applied_date'][:7]==f"{year}-{mi+1:02d}"])} for mi, mn in enumerate(MONTHS)]
    return {
        "kpis": {"total_candidates": total, "hired": len(hired), "time_to_fill": avg_days, "cost_per_hire": cost_per, "offer_acceptance": accept},
        "funnel": funnel,
        "by_source": count_by(cands, 'source'),
        "hires_by_department": count_by(hired, 'department'),
        "applications_by_month": by_month,
        "by_education": count_by(hired, 'education'),
        "pipeline_by_stage": [{"stage": s, "count": len([c for c in cands if c['stage']==s])} for s in ["Applied","Screened","Interviewed","Offered","Hired","Rejected"]]
    }

# ---- Performance ----
@api_router.get("/dashboard/performance")
async def get_performance(year: int = 2025, tenant: str = None):
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    scores = [e.get('performance_score', 3) for e in active]
    avg_score = round(sum(scores)/len(scores), 1) if scores else 0
    high = len([s for s in scores if s >= 4.0])
    low = len([s for s in scores if s < 2.5])
    hc = len(active)
    dist = [{"range": "1.0-2.0", "count": len([s for s in scores if s < 2.0])}, {"range": "2.0-2.5", "count": len([s for s in scores if 2.0 <= s < 2.5])}, {"range": "2.5-3.0", "count": len([s for s in scores if 2.5 <= s < 3.0])}, {"range": "3.0-3.5", "count": len([s for s in scores if 3.0 <= s < 3.5])}, {"range": "3.5-4.0", "count": len([s for s in scores if 3.5 <= s < 4.0])}, {"range": "4.0-4.5", "count": len([s for s in scores if 4.0 <= s < 4.5])}, {"range": "4.5-5.0", "count": len([s for s in scores if s >= 4.5])}]
    by_dept = []
    for dept in DEPARTMENTS:
        de = [e for e in active if e['department'] == dept]
        avg = safe_avg(de, 'performance_score')
        short = dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        by_dept.append({"department": short, "score": avg, "count": len(de)})
    by_band = [{"band": b, "score": safe_avg([e for e in active if e['band']==b], 'performance_score')} for b in BANDS]
    top = sorted(active, key=lambda e: -e.get('performance_score', 0))[:10]
    top_list = [{"name": e['name'], "department": e['department'], "score": e.get('performance_score',0), "band": e['band']} for e in top]
    return {
        "kpis": {"avg_score": avg_score, "high_performers": high, "high_pct": round(high/hc*100,1) if hc else 0, "low_performers": low, "low_pct": round(low/hc*100,1) if hc else 0},
        "distribution": dist, "by_department": by_dept, "by_band": by_band, "top_performers": top_list
    }

# ---- Learning ----
@api_router.get("/dashboard/learning")
async def get_learning(year: int = 2025, tenant: str = None):
    tq = {"tenant_id": tenant} if tenant else {}
    all_trn = await db.training.find(tq, {"_id": 0}).to_list(10000)
    trn = [t for t in all_trn if t.get('date','')[:4] == str(year)]
    total = len(trn)
    completed = [t for t in trn if t['status'] == 'Completed']
    in_progress = [t for t in trn if t['status'] == 'In Progress']
    total_hours = round(sum(t.get('hours', 0) for t in trn), 1)
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    hc = len(active)
    unique_participants = len(set(t['employee_id'] for t in trn if t.get('employee_id')))
    participation = round(unique_participants / hc * 100, 1) if hc else 0
    completion = round(len(completed) / total * 100, 1) if total else 0
    avg_score = safe_avg(completed, 'score')
    total_cost = sum(t.get('cost', 0) for t in trn)
    by_cat = count_by(trn, 'category')
    by_status = [{"status": s, "count": len([t for t in trn if t['status']==s])} for s in ["Completed","In Progress","Not Started"]]
    by_dept = []
    for dept in DEPARTMENTS:
        dt = [t for t in trn if t['department'] == dept]
        short = dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        by_dept.append({"department": short, "hours": round(sum(t.get('hours',0) for t in dt),1), "count": len(dt)})
    top_courses = {}
    for t in trn:
        cn = t.get('course_name','Unknown')
        top_courses[cn] = top_courses.get(cn, 0) + 1
    top_list = [{"course": k, "count": v} for k, v in sorted(top_courses.items(), key=lambda x: -x[1])[:10]]
    return {
        "kpis": {"total_programs": total, "total_hours": total_hours, "hours_per_employee": round(total_hours/hc,1) if hc else 0, "participation_rate": participation, "completion_rate": completion, "avg_score": avg_score},
        "by_category": by_cat, "by_status": by_status, "by_department": by_dept, "top_courses": top_list, "total_cost": total_cost
    }

# ---- Compensation ----
@api_router.get("/dashboard/compensation")
async def get_compensation(year: int = 2025, tenant: str = None):
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    salaries = [e.get('salary', 0) for e in active]
    avg_sal = round(sum(salaries)/len(salaries)) if salaries else 0
    total_cost = sum(salaries)
    by_band = []
    for b in BANDS:
        be = [e for e in active if e['band'] == b]
        bs = [e.get('salary',0) for e in be]
        midpoint = (SALARY_BY_BAND[b][0] + SALARY_BY_BAND[b][1]) / 2
        avg = round(sum(bs)/len(bs)) if bs else 0
        compa = round(avg / midpoint, 2) if midpoint else 0
        by_band.append({"band": b, "avg_salary": avg, "min": min(bs) if bs else 0, "max": max(bs) if bs else 0, "midpoint": round(midpoint), "compa_ratio": compa, "count": len(be)})
    overall_compa = round(sum(b['compa_ratio'] for b in by_band) / len(by_band), 2) if by_band else 0
    male_avg = safe_avg([e for e in active if e['gender']=='Male'], 'salary')
    female_avg = safe_avg([e for e in active if e['gender']=='Female'], 'salary')
    pay_gap = round((male_avg - female_avg) / male_avg * 100, 1) if male_avg else 0
    by_dept = []
    for dept in DEPARTMENTS:
        de = [e for e in active if e['department'] == dept]
        short = dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        by_dept.append({"department": short, "avg_salary": safe_avg(de, 'salary'), "count": len(de)})
    sal_ranges = [{"range":"0-25K","count":len([s for s in salaries if s<25000])},{"range":"25-50K","count":len([s for s in salaries if 25000<=s<50000])},{"range":"50-75K","count":len([s for s in salaries if 50000<=s<75000])},{"range":"75-100K","count":len([s for s in salaries if 75000<=s<100000])},{"range":"100-150K","count":len([s for s in salaries if 100000<=s<150000])},{"range":"150K+","count":len([s for s in salaries if s>=150000])}]
    gender_by_band = [{"band": b, "male": safe_avg([e for e in active if e['band']==b and e['gender']=='Male'], 'salary'), "female": safe_avg([e for e in active if e['band']==b and e['gender']=='Female'], 'salary')} for b in BANDS]
    return {
        "kpis": {"avg_salary": avg_sal, "total_cost": total_cost, "compa_ratio": overall_compa, "pay_gap": pay_gap, "male_avg": round(male_avg), "female_avg": round(female_avg)},
        "by_band": by_band, "by_department": by_dept, "salary_distribution": sal_ranges, "gender_by_band": gender_by_band
    }

# ---- Engagement ----
@api_router.get("/dashboard/engagement")
async def get_engagement(year: int = 2025, tenant: str = None):
    eq = {"tenant_id": tenant} if tenant else {}
    all_eng = await db.engagement.find(eq, {"_id": 0}).to_list(10000)
    surveys = all_eng
    total = len(surveys)
    if total == 0:
        return {"kpis": {}, "by_department": [], "score_distribution": [], "drivers": [], "enps_distribution": []}
    avg_eng = round(sum(s['engagement_score'] for s in surveys) / total, 1)
    avg_enps = round(sum(s['enps_score'] for s in surveys) / total, 1)
    promoters = len([s for s in surveys if s['enps_score'] >= 50])
    detractors = len([s for s in surveys if s['enps_score'] <= 0])
    enps = round((promoters - detractors) / total * 100, 1)
    avg_absent = round(sum(s.get('absenteeism_days', 0) for s in surveys) / total, 1)
    drivers = [{"driver": "Satisfaction", "score": round(sum(s['satisfaction'] for s in surveys)/total,1)}, {"driver": "Work-Life Balance", "score": round(sum(s['work_life_balance'] for s in surveys)/total,1)}, {"driver": "Career Growth", "score": round(sum(s['career_growth'] for s in surveys)/total,1)}, {"driver": "Manager Rating", "score": round(sum(s['manager_rating'] for s in surveys)/total,1)}, {"driver": "Recognition", "score": round(sum(s['recognition'] for s in surveys)/total,1)}, {"driver": "Culture", "score": round(sum(s['culture_alignment'] for s in surveys)/total,1)}]
    by_dept = []
    for dept in DEPARTMENTS:
        ds = [s for s in surveys if s['department'] == dept]
        short = dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        if ds:
            by_dept.append({"department": short, "engagement": round(sum(s['engagement_score'] for s in ds)/len(ds),1), "enps": round(sum(s['enps_score'] for s in ds)/len(ds),1), "count": len(ds)})
    score_dist = [{"range":"1-3","count":len([s for s in surveys if s['engagement_score']<3])},{"range":"3-5","count":len([s for s in surveys if 3<=s['engagement_score']<5])},{"range":"5-7","count":len([s for s in surveys if 5<=s['engagement_score']<7])},{"range":"7-9","count":len([s for s in surveys if 7<=s['engagement_score']<9])},{"range":"9-10","count":len([s for s in surveys if s['engagement_score']>=9])}]
    enps_dist = [{"category":"Promoters","count":promoters},{"category":"Passives","count":total-promoters-detractors},{"category":"Detractors","count":detractors}]
    return {
        "kpis": {"avg_engagement": avg_eng, "enps": enps, "avg_enps_raw": avg_enps, "participation_rate": 92.5, "avg_absenteeism": avg_absent, "total_surveys": total},
        "by_department": by_dept, "score_distribution": score_dist, "drivers": drivers, "enps_distribution": enps_dist
    }

# ---- Career & Talent ----
@api_router.get("/dashboard/career")
async def get_career(year: int = 2025, tenant: str = None):
    _, active, hired, left = await get_filtered(year, tenant=tenant)
    hc = len(active)
    talents = [e for e in active if e.get('is_talent')]
    managers = [e for e in active if e.get('is_manager')]
    promotion_est = round(len([e for e in active if e.get('seniority_years',0) < 2 and e.get('band','A') in ['C','D','E']]) / hc * 100, 1) if hc else 0
    internal_mobility = round(len([e for e in hired if e.get('data_source') != 'upload']) / hc * 100, 1) if hc else 0
    succession = round(len([e for e in active if e.get('is_talent') and e.get('band') in ['C','D']]) / len(managers) * 100, 1) if managers else 0
    talent_by_dept = []
    for dept in DEPARTMENTS:
        de = [e for e in active if e['department'] == dept]
        dt = [e for e in de if e.get('is_talent')]
        short = dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        talent_by_dept.append({"department": short, "total": len(de), "talents": len(dt), "ratio": round(len(dt)/len(de)*100,1) if de else 0})
    talent_by_band = [{"band": b, "count": len([e for e in talents if e['band']==b])} for b in BANDS]
    pipeline = [{"level": "Individual Contributor", "count": len([e for e in active if e['band'] in ['A','B','C'] and not e.get('is_manager')])}, {"level": "Manager", "count": len([e for e in active if e['band']=='D'])}, {"level": "Director+", "count": len([e for e in active if e['band']=='E'])}]
    return {
        "kpis": {"talent_pool": len(talents), "talent_ratio": round(len(talents)/hc*100,1) if hc else 0, "promotion_rate": promotion_est, "succession_coverage": succession, "internal_mobility": internal_mobility, "manager_count": len(managers)},
        "talent_by_department": talent_by_dept, "talent_by_band": talent_by_band, "leadership_pipeline": pipeline
    }

# ---- HR Operations ----
@api_router.get("/dashboard/hr-operations")
async def get_hr_operations(year: int = 2025, tenant: str = None):
    _, active, hired, left = await get_filtered(year, tenant=tenant)
    hc = len(active)
    ft = len([e for e in active if e.get('is_full_time')])
    pt = hc - ft
    disabled = len([e for e in active if e.get('is_disabled')])
    by_city = count_by(active, 'city')
    by_edu = count_by(active, 'education_level')
    avg_sen = safe_avg(active, 'seniority_years')
    gen_dist = count_by(active, 'gender')
    dept_size = []
    for dept in DEPARTMENTS:
        de = [e for e in active if e['department'] == dept]
        short = dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        dept_size.append({"department": short, "count": len(de), "managers": len([e for e in de if e.get('is_manager')]), "span": round(len(de)/max(1,len([e for e in de if e.get('is_manager')])),1)})
    metrics = [{"metric": "Onboarding Completion", "value": 94.2, "target": 95},{"metric": "Payroll Accuracy", "value": 99.1, "target": 99.5},{"metric": "Document Compliance", "value": 91.8, "target": 95},{"metric": "Ticket Resolution (days)", "value": 2.3, "target": 2},{"metric": "Digital Process Rate", "value": 78.5, "target": 85},{"metric": "Automation Rate", "value": 62.0, "target": 75}]
    return {
        "kpis": {"total_employees": hc, "full_time": ft, "part_time": pt, "ft_ratio": round(ft/hc*100,1) if hc else 0, "disabled_rate": round(disabled/hc*100,1) if hc else 0, "avg_seniority": avg_sen},
        "by_city": by_city, "by_education": by_edu, "gender_distribution": gen_dist, "department_metrics": dept_size, "operational_metrics": metrics
    }

# ---- Skills Map & Gap Analysis ----
@api_router.get("/dashboard/skills-map")
async def get_skills_map(year: int = 2025, tenant: str = None):
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    skill_agg = {}
    dept_skills = {}
    cat_counts = {"Tech": 0, "Soft": 0, "Domain": 0}
    for emp in active:
        dept = emp['department'].replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        for s in emp.get('skills', []):
            sn, cat, prof = s['skill'], s.get('category', 'general'), s['proficiency']
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
            if sn not in skill_agg:
                skill_agg[sn] = {"skill": sn, "category": cat, "count": 0, "total_prof": 0, "experts": 0, "beginners": 0}
            skill_agg[sn]["count"] += 1
            skill_agg[sn]["total_prof"] += prof
            if prof >= 4: skill_agg[sn]["experts"] += 1
            if prof <= 2: skill_agg[sn]["beginners"] += 1
            if dept not in dept_skills:
                dept_skills[dept] = {}
            if sn not in dept_skills[dept]:
                dept_skills[dept][sn] = {"count": 0, "total": 0}
            dept_skills[dept][sn]["count"] += 1
            dept_skills[dept][sn]["total"] += prof
    for s in skill_agg.values():
        s["avg_proficiency"] = round(s["total_prof"] / s["count"], 1) if s["count"] else 0
        del s["total_prof"]
    all_skills = sorted(skill_agg.values(), key=lambda x: -x["count"])
    gaps = sorted([s for s in all_skills if s["avg_proficiency"] < 3.0], key=lambda x: x["avg_proficiency"])
    critical_needs = sorted([s for s in all_skills if s["avg_proficiency"] < 2.5 and s["count"] >= 5], key=lambda x: x["avg_proficiency"])
    dept_heatmap = []
    top_skills = [s["skill"] for s in all_skills[:15]]
    for dept, skills in dept_skills.items():
        row = {"department": dept}
        for sk in top_skills:
            if sk in skills:
                row[sk] = round(skills[sk]["total"] / skills[sk]["count"], 1) if skills[sk]["count"] else 0
            else:
                row[sk] = 0
        dept_heatmap.append(row)
    return {
        "all_skills": all_skills[:25], "skill_gaps": gaps[:10], "critical_needs": critical_needs[:5],
        "category_distribution": [{"category": k, "count": v} for k, v in cat_counts.items()],
        "department_heatmap": dept_heatmap, "heatmap_skills": top_skills, "total_unique_skills": len(skill_agg)
    }

# ---- Employee Search ----
@api_router.get("/employees/search")
async def search_employees(q: str = "", department: str = "", limit: int = 20, tenant: str = None):
    query = {"$or": [{"status": "active"}, {"status": {"$exists": False}}]}
    if tenant:
        query["tenant_id"] = tenant
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if department:
        query["department"] = department
    try:
        emps = await db.employees.find(query, {"_id": 0}).to_list(limit)
        return {"employees": emps, "total": len(emps)}
    except Exception as e:
        logger.error(f"Employee search error: {e}")
        # Fallback: simple search without regex
        all_emps = await db.employees.find({"_id": 0}).to_list(500)
        filtered = [e for e in all_emps if q.lower() in e.get('name','').lower()] if q else all_emps
        active = [e for e in filtered if e.get('status','active') == 'active' or 'status' not in e]
        return {"employees": active[:limit], "total": len(active)}

# ---- AI Career Development Plan ----
class CareerPlanRequest(BaseModel):
    employee_id: str

@api_router.post("/employee/career-plan")
async def get_career_plan(body: CareerPlanRequest):
    emp = await db.employees.find_one({"id": body.employee_id}, {"_id": 0})
    if not emp:
        raise HTTPException(404, "Employee not found")
    tenant = emp.get("tenant_id")
    skills = emp.get('skills', [])
    skill_text = ", ".join([f"{s['skill']}({s['proficiency']}/5)" for s in skills])
    weak_skills = [s for s in skills if s['proficiency'] <= 2]
    strong_skills = [s for s in skills if s['proficiency'] >= 4]
    # Find potential mentors
    _, active, _, _ = await get_filtered(2025, tenant=tenant)
    mentors = []
    weak_names = {s['skill'] for s in weak_skills}
    for m in active:
        if m['id'] == emp['id'] or m.get('band','A') <= emp.get('band','A'):
            continue
        m_skills = m.get('skills', [])
        matching = [s for s in m_skills if s['skill'] in weak_names and s['proficiency'] >= 4]
        if len(matching) >= 2:
            mentors.append({"name": m['name'], "department": m['department'], "band": m['band'], "job_title": m['job_title'],
                            "matching_skills": [{"skill": s['skill'], "proficiency": s['proficiency']} for s in matching[:4]],
                            "match_score": len(matching)})
    mentors = sorted(mentors, key=lambda x: -x['match_score'])[:5]
    career = CAREER_PATH_BANDS.get(emp.get('band','A'), {})
    # Find matching career paths from taxonomy
    emp_dept = emp.get('department','')
    emp_role_families = DEPT_ROLE_FAMILIES.get(emp_dept, [])
    taxonomy_paths = [p for p in CAREER_PATHS if any(fam in str(p) for fam in emp_role_families)]
    career_path_info = ""
    if taxonomy_paths:
        tp = taxonomy_paths[0]
        career_path_info = f"\nKariyer Yolu: {tp.get('ad','')} ({tp.get('tur','')})"
        for a in tp.get('adimlar', [])[:5]:
            career_path_info += f"\n  {a.get('sira','')}. {a.get('rol_id','')}: {a.get('aciklama','')[:60]}"
    result = {
        "employee": {"name": emp['name'], "department": emp['department'], "job_title": emp['job_title'], "band": emp['band'],
                      "performance_score": emp.get('performance_score',0), "seniority_years": emp.get('seniority_years',0),
                      "age": emp.get('age',0), "skills": skills},
        "skill_analysis": {"strong": [{"skill": s['skill'], "proficiency": s['proficiency']} for s in strong_skills],
                           "weak": [{"skill": s['skill'], "proficiency": s['proficiency']} for s in weak_skills],
                           "total": len(skills), "avg_proficiency": round(sum(s['proficiency'] for s in skills)/len(skills),1) if skills else 0},
        "career_path": {"current_band": emp.get('band','A'), "next_band": career.get('next',''), "next_title": career.get('title',''), "timeline": career.get('timeline','')},
        "mentors": mentors,
        "ai_recommendations": ""
    }
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        prompt = f"""{emp['name']} ({emp['department']}, {emp['job_title']}, Band {emp['band']}) için kısa kariyer gelişim planı.
Perf: {emp.get('performance_score',0)}/5, Kıdem: {emp.get('seniority_years',0)} yıl
Güçlü: {', '.join(s['skill'] for s in strong_skills[:3])}
Gelişim: {', '.join(s['skill'] for s in weak_skills[:3])}

Düz metin, markdown kullanma. Her başlığı büyük harfle yaz.

KAZANILMASI GEREKEN YETKİNLİKLER
En kritik 2 yetkinlik ve nasıl kazanılacağı (2 cümle/yetkinlik).

ÖNERİLEN EĞİTİMLER
3 spesifik eğitim/sertifika (isim, süre, hedef).

GELİŞİM HEDEFLERİ
6 ay ve 1 yıl için birer SMART hedef.

KARİYER YOLU
Sonraki adım ve geçiş koşulları (2-3 cümle).

Toplam 200 kelimeyi geçme. Somut ve uygulanabilir yaz."""

        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()),
                       system_message="İK kariyer danışmanısın. Kısa, somut Türkçe yaz. Markdown kullanma. 200 kelime limit.")
        chat.with_model("openai", "gpt-5.2")
        response = await chat.send_message(UserMessage(text=prompt))
        result["ai_recommendations"] = response
    except Exception as e:
        logger.error(f"AI career plan error: {e}")
        result["ai_recommendations"] = "AI analizi şu anda kullanılamıyor. Algoritmik öneriler yukarıda listelenmiştir."
    return result

# ---- Career Paths API ----
@api_router.get("/career-paths")
async def get_career_paths(department: Optional[str] = None):
    """Return all career paths from taxonomy with resolved role names."""
    paths = []
    for p in CAREER_PATHS:
        # Filter by department if specified
        if department:
            dept_families = DEPT_ROLE_FAMILIES.get(department, [])
            if not any(fam in str(p.get("aile", "")) for fam in dept_families):
                continue
        steps = []
        for a in p.get("adimlar", []):
            role = ROLE_MAP.get(a["rol_id"], {})
            steps.append({
                "sira": a["sira"],
                "rol_id": a["rol_id"],
                "unvan": role.get("unvan", a["rol_id"].replace("-", " ").title()),
                "kademe": role.get("kademe", ""),
                "kademe_seviyesi": role.get("kademe_seviyesi", a["sira"]),
                "tipik_sure_ay": a.get("tipik_sure_ay"),
                "gecis_kosullari": a.get("gecis_kosullari", []),
                "kisa_aciklama": role.get("kisa_aciklama", ""),
            })
        alt_paths = []
        for alt_id in p.get("alternatif_yollar", []):
            alt = next((cp for cp in CAREER_PATHS if cp["id"] == alt_id), None)
            if alt:
                alt_paths.append({"id": alt["id"], "ad": alt["ad"]})
        paths.append({
            "id": p["id"],
            "ad": p["ad"],
            "aciklama": p.get("aciklama", ""),
            "tur": p.get("tur", "dikey"),
            "aile": p.get("aile", ""),
            "adimlar": steps,
            "alternatif_yollar": alt_paths,
        })
    return {"career_paths": paths, "total": len(paths)}

@api_router.get("/career-paths/{path_id}")
async def get_career_path_detail(path_id: str):
    """Return single career path detail with full role info."""
    path = next((p for p in CAREER_PATHS if p["id"] == path_id), None)
    if not path:
        raise HTTPException(404, "Career path not found")
    steps = []
    for a in path.get("adimlar", []):
        role = ROLE_MAP.get(a["rol_id"], {})
        # Get required skills for the role
        required_skills = []
        for sk_ref in role.get("gerekli_beceriler", []):
            sk_id = sk_ref["skill_id"] if isinstance(sk_ref, dict) else sk_ref
            sk = SKILL_MAP.get(sk_id, {})
            if sk:
                required_skills.append({"id": sk["id"], "ad": sk["ad"], "kume_id": sk.get("kume_id", ""),
                                        "gerekli_seviye": sk_ref.get("gerekli_seviye") if isinstance(sk_ref, dict) else None})
        steps.append({
            "sira": a["sira"],
            "rol_id": a["rol_id"],
            "unvan": role.get("unvan", a["rol_id"].replace("-", " ").title()),
            "kademe": role.get("kademe", ""),
            "kademe_seviyesi": role.get("kademe_seviyesi", a["sira"]),
            "tipik_sure_ay": a.get("tipik_sure_ay"),
            "gecis_kosullari": a.get("gecis_kosullari", []),
            "kisa_aciklama": role.get("kisa_aciklama", ""),
            "gerekli_beceriler": required_skills,
        })
    alt_paths = []
    for alt_id in path.get("alternatif_yollar", []):
        alt = next((cp for cp in CAREER_PATHS if cp["id"] == alt_id), None)
        if alt:
            alt_paths.append({"id": alt["id"], "ad": alt["ad"], "tur": alt.get("tur", "dikey")})
    return {
        "id": path["id"],
        "ad": path["ad"],
        "aciklama": path.get("aciklama", ""),
        "tur": path.get("tur", "dikey"),
        "aile": path.get("aile", ""),
        "adimlar": steps,
        "alternatif_yollar": alt_paths,
    }

# ---- Internal Mobility & Skill Gap by Department ----
@api_router.get("/dashboard/internal-mobility")
async def get_internal_mobility(year: int = 2025, tenant: str = None):
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    dept_needs = {}
    dept_surplus = {}
    for dept_name in DEPARTMENTS:
        short = dept_name.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        dept_emps = [e for e in active if e['department'] == dept_name]
        focus = DEPT_SKILL_FOCUS.get(dept_name, {})
        required = set(focus.get("tech",[]) + focus.get("soft",[]) + focus.get("domain",[]))
        covered = {}
        for emp in dept_emps:
            for s in emp.get('skills', []):
                if s['skill'] not in covered:
                    covered[s['skill']] = {"count": 0, "avg": 0, "total": 0}
                covered[s['skill']]["count"] += 1
                covered[s['skill']]["total"] += s['proficiency']
        for sk in covered:
            covered[sk]["avg"] = round(covered[sk]["total"] / covered[sk]["count"], 1)
        gaps = []
        for sk in required:
            if sk not in covered:
                gaps.append({"skill": sk, "coverage": 0, "avg_prof": 0, "status": "Missing"})
            elif covered[sk]["avg"] < 3.0:
                gaps.append({"skill": sk, "coverage": covered[sk]["count"], "avg_prof": covered[sk]["avg"], "status": "Weak"})
        surplus = [{"skill": sk, "count": v["count"], "avg_prof": v["avg"]} for sk, v in covered.items() if v["avg"] >= 4.0 and v["count"] >= 3]
        dept_needs[short] = {"gaps": sorted(gaps, key=lambda x: x["avg_prof"]), "headcount": len(dept_emps)}
        dept_surplus[short] = surplus
    mobility_opps = []
    for dept, data in dept_needs.items():
        for gap in data["gaps"][:3]:
            for s_dept, surplus in dept_surplus.items():
                if s_dept == dept:
                    continue
                for s in surplus:
                    if s["skill"] == gap["skill"]:
                        mobility_opps.append({"skill": gap["skill"], "from_dept": s_dept, "to_dept": dept, "available": s["count"], "from_avg": s["avg_prof"], "to_need": gap["status"]})
    return {"department_needs": dept_needs, "department_surplus": dept_surplus, "mobility_opportunities": mobility_opps[:15]}

# ---- Scenario Simulator ----
class ScenarioRequest(BaseModel):
    year: int = 2025
    growth_rate: float = 10
    budget_change: float = 0
    attrition_change: float = 0
    hiring_boost: int = 0
    new_location_headcount: int = 0
    tenant: Optional[str] = None

@api_router.post("/simulator/scenario")
async def run_scenario(body: ScenarioRequest):
    tenant = body.tenant
    _, active, hired, left = await get_filtered(body.year, tenant=tenant)
    hc = len(active)
    current_attrition = len(left)/hc if hc else 0
    current_cost = sum(e.get('salary',0) for e in active)
    avg_salary = current_cost/hc if hc else 50000
    new_attrition = max(0, current_attrition + body.attrition_change/100)
    growth = body.growth_rate/100
    projections = []
    cur_hc = hc
    for m in range(1, 13):
        monthly_growth = int(cur_hc * growth / 12) + (body.hiring_boost // 12)
        monthly_attrition = int(cur_hc * new_attrition / 12)
        new_loc = body.new_location_headcount // 12 if m <= 6 else 0
        cur_hc = cur_hc + monthly_growth - monthly_attrition + new_loc
        cost = cur_hc * avg_salary * (1 + body.budget_change/100)
        projections.append({"month": MONTHS[m-1], "headcount": cur_hc, "cost": round(cost), "hires": monthly_growth + new_loc, "attrition": monthly_attrition})
    final_hc = projections[-1]["headcount"]
    dept_impact = []
    for dept in DEPARTMENTS:
        de = [e for e in active if e['department']==dept]
        short = dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        projected = int(len(de) * (1 + growth))
        dept_impact.append({"department": short, "current": len(de), "projected": projected, "delta": projected - len(de)})
    # Location breakdown
    tr_active = [e for e in active if e.get('country') == 'Turkey']
    it_active = [e for e in active if e.get('country') == 'Italy']
    tr_hc = len(tr_active)
    it_hc = len(it_active)
    location_impact = [
        {"location": "Turkey", "current": tr_hc, "projected": int(tr_hc * (1 + growth)), "delta": int(tr_hc * growth)},
        {"location": "Italy", "current": it_hc, "projected": int(it_hc * (1 + growth)) + body.new_location_headcount, "delta": int(it_hc * growth) + body.new_location_headcount}
    ]
    return {
        "current": {"headcount": hc, "annual_cost": round(current_cost), "attrition_rate": round(current_attrition*100,1), "avg_salary": round(avg_salary)},
        "projected": {"headcount": final_hc, "annual_cost": round(final_hc * avg_salary * (1 + body.budget_change/100)), "attrition_rate": round(new_attrition*100,1), "net_change": final_hc - hc, "growth_pct": round((final_hc-hc)/hc*100,1) if hc else 0},
        "monthly_projections": projections, "department_impact": dept_impact, "location_impact": location_impact,
        "hiring_need": max(0, final_hc - hc + int(hc * new_attrition)), "cost_delta": round((final_hc * avg_salary * (1+body.budget_change/100)) - current_cost)
    }

# ---- Capability Forecasting ----
@api_router.get("/dashboard/capability-forecast")
async def get_capability_forecast(year: int = 2025, tenant: str = None):
    _, active, _, left = await get_filtered(year, tenant=tenant)
    hc = len(active)
    skill_supply = {}
    for emp in active:
        for s in emp.get('skills', []):
            sn = s['skill']
            if sn not in skill_supply:
                skill_supply[sn] = {"skill": sn, "category": s.get('category', 'general'), "current_count": 0, "avg_prof": 0, "total": 0, "experts": 0, "at_risk": 0}
            skill_supply[sn]["current_count"] += 1
            skill_supply[sn]["total"] += s['proficiency']
            if s['proficiency'] >= 4: skill_supply[sn]["experts"] += 1
    for s in skill_supply.values():
        s["avg_prof"] = round(s["total"]/s["current_count"],1) if s["current_count"] else 0
        del s["total"]
    attrition_rate = len(left)/hc if hc else 0.1
    forecasts = []
    for sn, data in skill_supply.items():
        for horizon in [6, 12, 24]:
            loss_rate = 1 - (1 - attrition_rate) ** (horizon/12)
            projected_loss = int(data["current_count"] * loss_rate)
            demand_growth = int(data["current_count"] * 0.08 * (horizon/12))
            gap = projected_loss + demand_growth
            remaining = data["current_count"] - projected_loss
            status = "Kritik" if remaining < data["current_count"]*0.6 else "Uyarı" if remaining < data["current_count"]*0.8 else "Stabil"
            if horizon == 6:
                forecasts.append({**data, "horizon_6m": {"gap": gap, "remaining": remaining, "status": status},
                    "horizon_12m": {}, "horizon_24m": {}})
        for f in forecasts:
            if f["skill"] == sn:
                for horizon in [12, 24]:
                    loss_rate = 1 - (1 - attrition_rate) ** (horizon/12)
                    projected_loss = int(data["current_count"] * loss_rate)
                    demand_growth = int(data["current_count"] * 0.08 * (horizon/12))
                    remaining = data["current_count"] - projected_loss
                    status = "Kritik" if remaining < data["current_count"]*0.6 else "Uyarı" if remaining < data["current_count"]*0.8 else "Stabil"
                    f[f"horizon_{horizon}m"] = {"gap": projected_loss + demand_growth, "remaining": remaining, "status": status}
    critical_6m = [f for f in forecasts if f.get("horizon_6m",{}).get("status")=="Kritik"]
    warning_12m = [f for f in forecasts if f.get("horizon_12m",{}).get("status") in ["Kritik","Uyarı"]]
    top_demand = sorted(forecasts, key=lambda x: -x.get("horizon_12m",{}).get("gap",0))[:10]
    return {"forecasts": forecasts[:20], "critical_6m": critical_6m[:5], "warning_12m": warning_12m[:8], "top_demand": top_demand, "total_skills": len(forecasts)}

# ---- Succession Planning + Knowledge Risk ----
@api_router.get("/dashboard/succession")
async def get_succession(year: int = 2025, tenant: str = None):
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    band_order = {"A": 1, "B": 2, "C": 3, "D": 4, "E": 5}
    # Critical roles: Band E + Band D with high performance/talent
    critical_roles = [e for e in active if e.get('band') == 'E' or
                      (e.get('band') == 'D' and e.get('is_talent') and e.get('performance_score', 0) >= 4.0)]
    # Successor pool: one band below the role, same or adjacent department
    results = []
    for role in critical_roles:
        role_band = band_order.get(role.get('band','E'), 5)
        role_dept = role['department']
        role_skills = {s['skill'] for s in role.get('skills',[])}
        role_title = role.get('job_title','')
        candidates = []
        for s in active:
            if s['id'] == role['id']: continue
            s_band = band_order.get(s.get('band','A'), 1)
            # Successor must be 1-2 bands below (not same or higher)
            if s_band >= role_band or s_band < role_band - 2: continue
            # Same department strongly preferred (cross-dept only if band D→E)
            same_dept = s['department'] == role_dept
            if not same_dept and role_band < 5: continue  # Cross-dept only for E roles
            # Performance gate
            if s.get('performance_score', 0) < 3.5: continue
            # Skill match
            s_skills = {sk['skill'] for sk in s.get('skills',[])}
            overlap = len(role_skills & s_skills)
            skill_pct = overlap / max(1, len(role_skills))
            # Readiness: 50% skills + 30% performance + 20% department fit
            dept_bonus = 20 if same_dept else 5
            readiness = min(100, int(skill_pct * 50 + (s.get('performance_score',3)/5) * 30 + dept_bonus))
            if readiness >= 40:
                candidates.append({
                    "name": s['name'], "band": s['band'],
                    "department": shorten_dept(s['department']),
                    "job_title": s.get('job_title',''),
                    "performance": s.get('performance_score',0),
                    "readiness": readiness, "skill_match": overlap,
                    "same_dept": same_dept
                })
        # Sort: same dept first, then by readiness
        candidates = sorted(candidates, key=lambda x: (-x['same_dept'], -x['readiness']))[:3]
        unique_skills = len([s for s in role.get('skills',[]) if s['proficiency'] >= 4])
        seniority = role.get('seniority_years',0)
        knowledge_risk = min(100, int(unique_skills * 10 + seniority * 4 + (3 - len(candidates)) * 15))
        risk_level = "Kritik" if knowledge_risk >= 75 else "Yüksek" if knowledge_risk >= 55 else "Orta" if knowledge_risk >= 35 else "Düşük"
        results.append({
            "name": role['name'], "department": shorten_dept(role['department']),
            "job_title": role['job_title'], "band": role['band'],
            "seniority": seniority, "performance": role.get('performance_score',0),
            "knowledge_risk": knowledge_risk, "risk_level": risk_level,
            "successors": candidates, "successor_count": len(candidates)
        })
    results = sorted(results, key=lambda x: -x['knowledge_risk'])
    no_successor = len([r for r in results if r['successor_count']==0])
    high_risk = len([r for r in results if r['risk_level'] in ['Kritik','Yüksek']])
    return {"kpis": {"critical_roles": len(critical_roles), "no_successor": no_successor, "high_knowledge_risk": high_risk, "avg_readiness": round(sum(c['readiness'] for r in results for c in r['successors'])/(sum(r['successor_count'] for r in results) or 1),1)},
            "succession_map": results[:20], "risk_summary": [{"level": lv, "count": len([r for r in results if r['risk_level']==lv])} for lv in ["Kritik","Yüksek","Orta","Düşük"]]}

# ---- Burnout Early Warning ----
@api_router.get("/dashboard/burnout")
async def get_burnout(year: int = 2025, tenant: str = None):
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    beq = {"tenant_id": tenant} if tenant else {}
    all_eng = await db.engagement.find(beq, {"_id": 0}).to_list(10000)
    eng_map = {e['employee_id']: e for e in all_eng}
    risk_list = []
    for emp in active:
        eng = eng_map.get(emp['id'], {})
        engagement = eng.get('engagement_score', 7)
        absent = eng.get('absenteeism_days', 5)
        wlb = eng.get('work_life_balance', 3.5)
        perf = emp.get('performance_score', 3.5)
        seniority = emp.get('seniority_years', 2)
        eng_factor = max(0, (7 - engagement) / 7 * 30)
        absent_factor = min(25, absent * 1.7)
        wlb_factor = max(0, (3.5 - wlb) / 3.5 * 20)
        perf_factor = max(0, (3.5 - perf) / 3.5 * 15)
        tenure_factor = 10 if seniority < 1 else 5 if seniority > 8 else 0
        risk_score = min(100, int(eng_factor + absent_factor + wlb_factor + perf_factor + tenure_factor))
        risk_level = "Kritik" if risk_score >= 70 else "Yüksek" if risk_score >= 50 else "Orta" if risk_score >= 30 else "Düşük"
        risk_list.append({"name": emp['name'], "department": emp['department'], "job_title": emp['job_title'], "band": emp['band'],
                          "risk_score": risk_score, "risk_level": risk_level, "engagement": engagement, "absenteeism": absent,
                          "work_life_balance": wlb, "performance": perf, "seniority": seniority})
    risk_list = sorted(risk_list, key=lambda x: -x['risk_score'])
    dept_risk = []
    for dept in DEPARTMENTS:
        de = [r for r in risk_list if r['department']==dept]
        short = dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        if de:
            dept_risk.append({"department": short, "avg_risk": round(sum(r['risk_score'] for r in de)/len(de),1), "critical": len([r for r in de if r['risk_level']=='Kritik']), "high": len([r for r in de if r['risk_level']=='Yüksek']), "count": len(de)})
    dist = [{"level": lv, "count": len([r for r in risk_list if r['risk_level']==lv])} for lv in ["Kritik","Yüksek","Orta","Düşük"]]
    return {"kpis": {"total_at_risk": len([r for r in risk_list if r['risk_level'] in ['Kritik','Yüksek']]),
                     "critical_count": len([r for r in risk_list if r['risk_level']=='Kritik']),
                     "avg_risk_score": round(sum(r['risk_score'] for r in risk_list)/len(risk_list),1) if risk_list else 0,
                     "avg_engagement": round(sum(r['engagement'] for r in risk_list)/len(risk_list),1) if risk_list else 0},
            "top_risk": risk_list[:15], "department_risk": sorted(dept_risk, key=lambda x: -x['avg_risk']), "risk_distribution": dist}

# ---- Target Headcount Planning ----
TARGET_HEADCOUNT = {
    "Kredi ve Risk": {"target": 75, "critical_roles": ["Kıdemli Kredi Analisti", "Risk Yöneticisi", "Kredi Müdürü"]},
    "Hazine": {"target": 40, "critical_roles": ["Hazine Yöneticisi", "ALM Uzmanı"]},
    "Bireysel Bankacılık": {"target": 70, "critical_roles": ["Portföy Yöneticisi", "Bireysel Bankacılık Müdürü"]},
    "Kurumsal Bankacılık": {"target": 50, "critical_roles": ["Kurumsal İlişki Yöneticisi", "Dış Ticaret Uzmanı"]},
    "Şube Operasyonları": {"target": 80, "critical_roles": ["Şube Müdürü", "Operasyon Sorumlusu", "Satış Koordinatörü"]},
    "Dijital Bankacılık": {"target": 45, "critical_roles": ["Ürün Müdürü (Mobil)", "Open Banking Uzmanı"]},
    "Uyum ve Mevzuat": {"target": 30, "critical_roles": ["Uyum Müdürü", "MASAK Uzmanı"]},
    "Veri ve Analitik": {"target": 40, "critical_roles": ["Veri Bilimci", "BI Analisti"]},
    "İnsan Kaynakları": {"target": 30, "critical_roles": ["Yetenek Yönetimi Uzmanı", "İK Analitiği Sorumlusu"]},
    "Operasyon ve Süreç": {"target": 40, "critical_roles": ["Süreç İyileştirme Uzmanı", "Takas ve Mutabakat Sorumlusu"]},
}

@api_router.get("/dashboard/headcount-plan")
async def get_headcount_plan(year: int = 2025, country: str = None, tenant: str = None):
    _, active, hired, left = await get_filtered(year, country, tenant=tenant)
    hc = len(active)
    total_target = sum(t["target"] for t in TARGET_HEADCOUNT.values())
    total_gap = total_target - hc
    dept_plan = []
    critical_gaps = []
    for dept_name in DEPARTMENTS:
        short = shorten_dept(dept_name)
        dept_emps = [e for e in active if e['department'] == dept_name]
        target_info = TARGET_HEADCOUNT.get(dept_name, {"target": len(dept_emps), "critical_roles": []})
        current = len(dept_emps)
        target = target_info["target"]
        gap = target - current
        fill_rate = round(current / target * 100, 1) if target else 100
        dept_plan.append({
            "department": short, "current": current, "target": target,
            "gap": gap, "fill_rate": fill_rate,
            "critical_roles": target_info["critical_roles"],
            "status": "Fazla" if gap < 0 else "Yolunda" if gap == 0 else "Eksik" if gap <= 5 else "Kritik Açık"
        })
        if gap > 3:
            for role in target_info["critical_roles"]:
                critical_gaps.append({"department": short, "role": role, "urgency": "Yüksek" if gap > 8 else "Orta"})
    monthly_plan = []
    remaining = total_gap
    for mi, mn in enumerate(MONTHS):
        planned_hires = max(0, int(remaining * 0.12)) if remaining > 0 else 0
        remaining -= planned_hires
        monthly_plan.append({"month": mn, "planned_hires": planned_hires, "cumulative_gap": max(0, remaining)})
    return {
        "kpis": {"total_headcount": hc, "target_headcount": total_target, "total_gap": total_gap,
                 "fill_rate": round(hc / total_target * 100, 1) if total_target else 100,
                 "critical_gaps_count": len(critical_gaps), "depts_under": len([d for d in dept_plan if d["status"] in ["Eksik", "Kritik Açık"]])},
        "department_plan": sorted(dept_plan, key=lambda x: x["gap"], reverse=True),
        "critical_gaps": critical_gaps[:15],
        "monthly_hiring_plan": monthly_plan
    }

# ---- Workforce Alignment (Strategy → Roles/Skills → Fulfillment) ----
STRATEGIC_OBJECTIVES = [
    {
        "id": "dijital_donusum", "name": "Dijital Bankacılık Dönüşümü",
        "description": "Dijital kanalların güçlendirilmesi, mobil bankacılık ve open banking altyapısı",
        "priority": "Kritik",
        "required_skills": ["Mobil Bankacılık Ürün Yönetimi", "Open Banking ve API Ekosistemi", "Dijital Ödeme Sistemleri ve QR", "Dijital Müşteri Yolculuğu", "RPA ve Süreç Otomasyonu", "Makine Öğrenmesi ve Modelleme", "BI Dashboard ve Veri Görselleştirme", "Derin Öğrenme ve Sinir Ağları", "Veri Mühendisliği ve ETL"],
        "required_headcount": 120, "target_departments": ["Dijital Bankacılık", "Veri ve Analitik"],
        "timeline": "Q1-Q4 2025"
    },
    {
        "id": "risk_yonetimi", "name": "Gelişmiş Risk ve Uyum Yönetimi",
        "description": "Basel IV uyumluluğu, stres testi altyapısı ve BDDK mevzuat adaptasyonu",
        "priority": "Kritik",
        "required_skills": ["Basel III/IV Uygulamaları", "Stres Testi ve Senaryo Analizi", "Risk Modeli Validasyonu", "BDDK Mevzuatı ve Bankacılık Düzenlemeleri", "MASAK ve Suç Gelirleri Aklanması ile Mücadele", "Sermaye Yeterliliği ve RWA Hesaplama", "Erken Uyarı Sistemleri (EWS)", "GES/RES ve Enerji Projeleri Kredilendirme"],
        "required_headcount": 100, "target_departments": ["Kredi ve Risk", "Uyum ve Mevzuat"],
        "timeline": "Q1-Q3 2025"
    },
    {
        "id": "musteri_deneyimi", "name": "Müşteri Deneyimi İyileştirme",
        "description": "NPS artışı, müşteri segmentasyonu ve CRM modernizasyonu",
        "priority": "Yüksek",
        "required_skills": ["Müşteri Segmentasyonu", "NPS, CES ve Deneyim Ölçümü", "Kampanya Yönetimi ve Next-Best-Action", "Müşteri Yolculuğu Haritalama", "Şikayet Yönetimi ve Closed-Loop Feedback", "Çağrı Merkezi Operasyonları", "Müşteri Odaklılık"],
        "required_headcount": 65, "target_departments": ["Dijital Bankacılık", "Bireysel Bankacılık"],
        "timeline": "Q2-Q4 2025"
    },
    {
        "id": "liderlik_gelistirme", "name": "Liderlik ve Yetenek Geliştirme",
        "description": "Yeni nesil yöneticilerin yetiştirilmesi ve yetenek havuzu oluşturma",
        "priority": "Orta",
        "required_skills": ["Ekip Yönetimi ve İnsan Kaynakları", "Stratejik Düşünme ve Karar Verme", "Değişim Yönetimi", "Koçluk ve Mentorluk", "Performans Yönetimi ve Geri Bildirim", "Kriz Yönetimi", "Çapraz Fonksiyonel Liderlik", "Bütçe ve P&L Yönetimi"],
        "required_headcount": 90, "target_departments": ["İnsan Kaynakları"],
        "timeline": "Q1-Q4 2025"
    },
    {
        "id": "sube_verimlilik", "name": "Şube Ağı Optimizasyonu",
        "description": "Şube verimliliğini artırma, satış hedeflerini güçlendirme ve operasyonel iyileştirme",
        "priority": "Yüksek",
        "required_skills": ["Şube Satış ve Hedef Yönetimi", "Şube Yönetimi", "Gişe ve Nakit Yönetimi", "Müşteri Kazanımı ve Onboarding", "Süreç Tasarımı ve İyileştirme", "Bireysel Kredi Ürünleri (İhtiyaç, Konut, Taşıt)", "Şube Müşteri İlişkileri"],
        "required_headcount": 90, "target_departments": ["Şube Operasyonları", "Bireysel Bankacılık"],
        "timeline": "Q1-Q4 2025"
    },
    {
        "id": "veri_analitigi", "name": "Veri Odaklı Karar Alma Altyapısı",
        "description": "Gelişmiş analitik, yapay zeka modelleri ve iş zekası kapasitesi oluşturma",
        "priority": "Kritik",
        "required_skills": ["SQL ve Veri Sorgulama", "İstatistik ve Risk Modellemesi", "Makine Öğrenmesi ve Modelleme", "Derin Öğrenme ve Sinir Ağları", "Veri Mühendisliği ve ETL", "BI Dashboard ve Veri Görselleştirme"],
        "required_headcount": 85, "target_departments": ["Veri ve Analitik", "Dijital Bankacılık"],
        "timeline": "Q1-Q4 2025"
    },
    {
        "id": "uyum_guclen", "name": "Regülasyon Uyum Güçlendirme",
        "description": "KVKK, MASAK ve uluslararası yaptırım uyumu güçlendirme",
        "priority": "Yüksek",
        "required_skills": ["KVKK ve Kişisel Veri Yönetimi", "Yaptırım Listeleri ve Sanksiyon Takibi", "İç Kontrol ve İç Denetim", "BDDK Mevzuatı ve Bankacılık Düzenlemeleri", "MASAK ve Suç Gelirleri Aklanması ile Mücadele"],
        "required_headcount": 45, "target_departments": ["Uyum ve Mevzuat"],
        "timeline": "Q2-Q4 2025"
    }
]

@api_router.get("/dashboard/workforce-alignment")
async def get_workforce_alignment(year: int = 2025, tenant: str = None):
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    objectives = []
    for obj in STRATEGIC_OBJECTIVES:
        target_emps = [e for e in active if e['department'] in obj["target_departments"]]
        skill_coverage = {}
        for skill in obj["required_skills"]:
            holders = []
            for emp in target_emps:
                for s in emp.get('skills', []):
                    if s['skill'] == skill:
                        holders.append({"name": emp['name'], "proficiency": s['proficiency'], "department": shorten_dept(emp['department'])})
            avg_prof = round(sum(h['proficiency'] for h in holders) / len(holders), 1) if holders else 0
            experts = len([h for h in holders if h['proficiency'] >= 4])
            skill_coverage[skill] = {
                "skill": skill, "holders": len(holders), "avg_proficiency": avg_prof,
                "experts": experts, "status": "Strong" if avg_prof >= 3.5 and len(holders) >= 5 else "Adequate" if avg_prof >= 2.5 and len(holders) >= 3 else "Gap"
            }
        current_hc = len(target_emps)
        gap_skills = [s for s in skill_coverage.values() if s["status"] == "Gap"]
        strong_skills = [s for s in skill_coverage.values() if s["status"] == "Strong"]
        fulfillment = round((len(obj["required_skills"]) - len(gap_skills)) / len(obj["required_skills"]) * 100, 1) if obj["required_skills"] else 100
        hc_fulfillment = min(100, round(current_hc / obj["required_headcount"] * 100, 1)) if obj["required_headcount"] else 100
        overall = round((fulfillment * 0.6 + hc_fulfillment * 0.4), 1)
        objectives.append({
            "id": obj["id"], "name": obj["name"], "description": obj["description"],
            "priority": obj["priority"], "timeline": obj["timeline"],
            "required_headcount": obj["required_headcount"], "current_headcount": current_hc,
            "hc_fulfillment": hc_fulfillment,
            "skill_fulfillment": fulfillment, "overall_readiness": overall,
            "skill_coverage": list(skill_coverage.values()),
            "gap_count": len(gap_skills), "strong_count": len(strong_skills),
            "status": "Yolunda" if overall >= 75 else "Risk Altında" if overall >= 50 else "Kritik"
        })
    overall_readiness = round(sum(o["overall_readiness"] for o in objectives) / len(objectives), 1) if objectives else 0
    at_risk = len([o for o in objectives if o["status"] in ["Kritik", "Risk Altında"]])
    return {
        "kpis": {"total_objectives": len(objectives), "overall_readiness": overall_readiness,
                 "at_risk_count": at_risk, "on_track": len([o for o in objectives if o["status"] == "Yolunda"]),
                 "total_skill_gaps": sum(o["gap_count"] for o in objectives)},
        "objectives": objectives
    }

# ---- Org Health (Structure Analysis) ----
@api_router.get("/dashboard/org-health")
async def get_org_health(year: int = 2025, country: str = None, tenant: str = None):
    _, active, _, _ = await get_filtered(year, country, tenant=tenant)
    hc = len(active)
    total_managers = len([e for e in active if e.get('is_manager')])
    total_ic = hc - total_managers
    overall_span = round(total_ic / total_managers, 1) if total_managers else 0
    overall_mgr_ratio = round(total_managers / hc * 100, 1) if hc else 0
    band_counts = {b: len([e for e in active if e['band'] == b]) for b in BANDS}
    hierarchy_depth = len([b for b in BANDS if band_counts[b] > 0])
    dept_health = []
    for dept_name in DEPARTMENTS:
        short = shorten_dept(dept_name)
        dept_emps = [e for e in active if e['department'] == dept_name]
        managers = [e for e in dept_emps if e.get('is_manager')]
        ics = [e for e in dept_emps if not e.get('is_manager')]
        span = round(len(ics) / len(managers), 1) if managers else 0
        mgr_ratio = round(len(managers) / len(dept_emps) * 100, 1) if dept_emps else 0
        avg_perf = safe_avg(dept_emps, 'performance_score')
        avg_sen = safe_avg(dept_emps, 'seniority_years')
        band_dist = {b: len([e for e in dept_emps if e['band'] == b]) for b in BANDS}
        health_score = 100
        if span < 3: health_score -= 20  # too narrow span
        elif span > 12: health_score -= 25  # too wide span
        if mgr_ratio > 30: health_score -= 15  # too many managers
        elif mgr_ratio < 8: health_score -= 10  # too few managers
        if avg_perf < 3.0: health_score -= 15
        health_status = "Healthy" if health_score >= 80 else "Attention" if health_score >= 60 else "Restructure"
        dept_health.append({
            "department": short, "headcount": len(dept_emps),
            "managers": len(managers), "individual_contributors": len(ics),
            "span_of_control": span, "manager_ratio": mgr_ratio,
            "avg_performance": avg_perf, "avg_seniority": avg_sen,
            "band_distribution": band_dist,
            "health_score": health_score, "health_status": health_status,
            "issues": [x for x in [
                "Narrow span of control" if span < 3 else ("Wide span of control" if span > 12 else None),
                "High manager ratio" if mgr_ratio > 30 else ("Low manager ratio" if mgr_ratio < 8 else None),
                "Low avg performance" if avg_perf < 3.0 else None
            ] if x]
        })
    band_pyramid = [{"band": b, "count": band_counts[b], "pct": round(band_counts[b]/hc*100,1) if hc else 0} for b in BANDS]
    ideal_pyramid = [{"band": "A", "ideal": 20}, {"band": "B", "ideal": 30}, {"band": "C", "ideal": 25}, {"band": "D", "ideal": 15}, {"band": "E", "ideal": 10}]
    for i, bp in enumerate(band_pyramid):
        bp["ideal_pct"] = ideal_pyramid[i]["ideal"]
        bp["deviation"] = round(bp["pct"] - ideal_pyramid[i]["ideal"], 1)
    healthy_count = len([d for d in dept_health if d["health_status"] == "Healthy"])
    attention_count = len([d for d in dept_health if d["health_status"] == "Attention"])
    restructure_count = len([d for d in dept_health if d["health_status"] == "Restructure"])
    return {
        "kpis": {"total_headcount": hc, "overall_span": overall_span, "manager_ratio": overall_mgr_ratio,
                 "hierarchy_depth": hierarchy_depth, "healthy_depts": healthy_count,
                 "attention_depts": attention_count, "restructure_depts": restructure_count},
        "department_health": sorted(dept_health, key=lambda x: x["health_score"]),
        "band_pyramid": band_pyramid,
    }

# ---- Open Positions Generation ----
def generate_open_positions(active_employees):
    random.seed(50)
    positions = []
    for dept_name, target in TARGET_HEADCOUNT.items():
        dept_emps = [e for e in active_employees if e['department'] == dept_name]
        gap = target["target"] - len(dept_emps)
        if gap <= 0:
            continue
        num_open = min(gap, random.randint(2, max(3, gap // 2)))
        for i in range(num_open):
            band = random.choices(BANDS, weights=[15, 30, 30, 15, 10], k=1)[0]
            title = random.choice(target["critical_roles"]) if random.random() < 0.4 else random.choice(POSITIONS_BY_BAND[band])
            city = random.choices(CITIES, weights=CITY_WEIGHTS, k=1)[0]
            focus = DEPT_SKILL_FOCUS.get(dept_name, {"tech": ["Data Analytics"], "soft": ["Communication"], "domain": ["Project Management"]})
            req_skills = random.sample(focus.get("tech", [])[:6], min(3, len(focus.get("tech", [])))) + \
                         random.sample(focus.get("soft", [])[:4], min(1, len(focus.get("soft", [])))) + \
                         random.sample(focus.get("domain", [])[:3], min(1, len(focus.get("domain", []))))
            days_open = random.randint(3, 65)
            pos_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{dept_name}-{i}-{title}-{band}"))
            positions.append({
                "id": pos_id, "title": title, "department": dept_name,
                "location": city, "country": CITY_COUNTRY[city],
                "status": "open", "target_band": band,
                "required_skills": req_skills,
                "opened_date": f"2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                "days_open": days_open
            })
    return positions

# ---- Enhanced Skills Map ----
@api_router.get("/dashboard/skills-map-v2")
async def get_skills_map_v2(year: int = 2025, tenant: str = None):
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    hc = len(active)
    skill_agg = {}
    dept_skills = {}
    for emp in active:
        dept = shorten_dept(emp['department'])
        for s in emp.get('skills', []):
            sn, cat, prof = s['skill'], s.get('category', 'general'), s['proficiency']
            if sn not in skill_agg:
                skill_agg[sn] = {"skill": sn, "category": cat, "count": 0, "total_prof": 0, "experts": 0, "beginners": 0, "proficient": 0}
            skill_agg[sn]["count"] += 1
            skill_agg[sn]["total_prof"] += prof
            if prof >= 4: skill_agg[sn]["experts"] += 1
            if prof == 3: skill_agg[sn]["proficient"] += 1
            if prof <= 2: skill_agg[sn]["beginners"] += 1
            if dept not in dept_skills:
                dept_skills[dept] = {}
            if sn not in dept_skills[dept]:
                dept_skills[dept][sn] = {"count": 0, "total": 0}
            dept_skills[dept][sn]["count"] += 1
            dept_skills[dept][sn]["total"] += prof
    for s in skill_agg.values():
        s["avg_proficiency"] = round(s["total_prof"] / s["count"], 1) if s["count"] else 0
        s["capacity"] = s["proficient"] + s["experts"]
        del s["total_prof"]
    all_skills = sorted(skill_agg.values(), key=lambda x: -x["count"])
    # Derive future demand from strategic objectives
    skill_demand = {}
    for obj in STRATEGIC_OBJECTIVES:
        for sk in obj["required_skills"]:
            if sk not in skill_demand:
                skill_demand[sk] = 0
            skill_demand[sk] += max(3, obj["required_headcount"] // len(obj["required_skills"]))
    # Compute gaps
    gaps = []
    for sk_name, demand in skill_demand.items():
        data = skill_agg.get(sk_name, {"skill": sk_name, "count": 0, "avg_proficiency": 0, "capacity": 0, "experts": 0, "beginners": 0, "category": "Tech"})
        current_cap = data.get("capacity", 0)
        coverage = round(current_cap / demand * 100, 1) if demand else 100
        severity = "critical" if coverage < 50 else "moderate" if coverage < 80 else "healthy"
        if severity == "critical":
            action = "Hedefli işe alım + yoğun eğitim programı"
        elif severity == "moderate":
            action = "İç rotasyon + yetkinlik geliştirme eğitimleri"
        else:
            action = "Mentorluk ile sürdürme"
        gaps.append({
            "skill": sk_name, "category": data.get("category", "Tech"),
            "current_capacity": current_cap, "future_demand": demand,
            "gap": max(0, demand - current_cap), "coverage": coverage,
            "severity": severity, "suggested_action": action,
            "experts": data.get("experts", 0), "avg_proficiency": data.get("avg_proficiency", 0)
        })
    gaps = sorted(gaps, key=lambda x: x["coverage"])
    # Heatmap: category × department
    categories = sorted(set(s["category"] for s in all_skills))
    heatmap = []
    for cat in categories:
        row = {"category": cat}
        cat_skills = [s["skill"] for s in all_skills if s["category"] == cat]
        for dept, skills in dept_skills.items():
            cat_dept_scores = [skills[sk]["total"] / skills[sk]["count"] for sk in cat_skills if sk in skills]
            row[dept] = round(sum(cat_dept_scores) / len(cat_dept_scores), 1) if cat_dept_scores else 0
        heatmap.append(row)
    heatmap_depts = sorted(dept_skills.keys())
    critical_gaps = [g for g in gaps if g["severity"] == "critical"]
    emerging = [s for s in all_skills if s["avg_proficiency"] < 2.5 and s["count"] >= 3]
    capped_coverages = [min(100, g["coverage"]) for g in gaps]
    avg_cov = round(sum(capped_coverages) / len(capped_coverages), 1) if capped_coverages else 0
    # Build cluster breakdown from taxonomy
    cluster_breakdown = []
    for cluster in CLUSTER_TAXONOMY:
        cid = cluster["id"]
        cluster_skills_tax = [s for s in SKILL_TAXONOMY if s["kume_id"] == cid]
        # Aggregate employee data for each skill in this cluster
        cluster_skill_details = []
        total_experts = 0
        total_count = 0
        total_prof_sum = 0
        for sk in cluster_skills_tax:
            agg = skill_agg.get(sk["ad"], None)
            if agg:
                cluster_skill_details.append({
                    "id": sk["id"], "ad": sk["ad"],
                    "aciklama": sk.get("aciklama", "")[:80],
                    "count": agg["count"], "avg_proficiency": agg["avg_proficiency"],
                    "experts": agg["experts"], "beginners": agg["beginners"],
                    "kritiklik": sk.get("kritiklik_seviyesi", "destek"),
                })
                total_experts += agg["experts"]
                total_count += agg["count"]
                total_prof_sum += agg["avg_proficiency"]
            else:
                cluster_skill_details.append({
                    "id": sk["id"], "ad": sk["ad"],
                    "aciklama": sk.get("aciklama", "")[:80],
                    "count": 0, "avg_proficiency": 0,
                    "experts": 0, "beginners": 0,
                    "kritiklik": sk.get("kritiklik_seviyesi", "destek"),
                })
        n_with_data = len([s for s in cluster_skill_details if s["count"] > 0])
        avg_prof = round(total_prof_sum / n_with_data, 1) if n_with_data else 0
        cluster_breakdown.append({
            "id": cid,
            "ad": cluster["ad"],
            "toplam_beceri": len(cluster_skills_tax),
            "aktif_beceri": n_with_data,
            "toplam_uzman": total_experts,
            "ort_yetkinlik": avg_prof,
            "beceriler": sorted(cluster_skill_details, key=lambda x: -x["count"]),
        })

    return {
        "kpis": {"tracked_skills": len(all_skills), "critical_gaps": len(critical_gaps),
                 "avg_coverage": avg_cov,
                 "emerging_skills": len(emerging)},
        "gaps": gaps, "heatmap": heatmap, "heatmap_depts": heatmap_depts,
        "all_skills": all_skills[:30], "demand_supply": sorted(gaps, key=lambda x: -x["gap"])[:15],
        "cluster_breakdown": cluster_breakdown,
    }

# ---- Internal Mobility (Positions + Matching) ----
@api_router.get("/dashboard/positions")
async def get_positions(year: int = 2025, tenant: str = None):
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    positions = generate_open_positions(active)
    filled_count = random.Random(51).randint(8, 18)
    internal_fill = random.Random(51).randint(3, filled_count)
    avg_ttf = round(random.Random(51).uniform(22, 42), 1)
    internal_fit_count = 0
    for pos in positions:
        matches = _compute_matches(pos, active)
        if any(m["fit_score"] >= 70 for m in matches):
            internal_fit_count += 1
    internal_fit_pct = round(internal_fit_count / len(positions) * 100, 1) if positions else 0
    return {
        "kpis": {"open_roles": len(positions), "internal_fit": internal_fit_pct,
                 "avg_time_to_fill": avg_ttf, "filled_internally": internal_fill},
        "positions": positions
    }

def _compute_matches(position, active_employees):
    req_skills = set(position["required_skills"])
    matches = []
    for emp in active_employees:
        if emp.get('status') != 'active': continue
        emp_skills = {s['skill']: s['proficiency'] for s in emp.get('skills', [])}
        matched = []
        missing = []
        skill_score = 0
        for sk in req_skills:
            if sk in emp_skills:
                matched.append({"skill": sk, "proficiency": emp_skills[sk]})
                skill_score += min(1.0, emp_skills[sk] / 4.0)
            else:
                missing.append(sk)
        if len(matched) == 0: continue
        skill_overlap = round(skill_score / len(req_skills) * 100, 1) if req_skills else 0
        perf_norm = min(100, round(emp.get('performance_score', 3) / 5.0 * 100, 1))
        mob_score = 80 if emp.get('mobility_flag') else 30
        fit_score = round(0.55 * skill_overlap + 0.25 * perf_norm + 0.20 * mob_score, 1)
        if fit_score >= 35:
            matches.append({
                "employee_id": emp['id'], "name": emp['name'],
                "department": shorten_dept(emp['department']),
                "job_title": emp['job_title'], "band": emp['band'],
                "performance": emp.get('performance_score', 0),
                "fit_score": fit_score, "skill_overlap": skill_overlap,
                "matched_skills": matched, "missing_skills": missing,
                "mobility_ready": emp.get('mobility_flag', False)
            })
    return sorted(matches, key=lambda x: -x["fit_score"])[:10]

@api_router.get("/dashboard/positions/{position_id}/matches")
async def get_position_matches(position_id: str, year: int = 2025):
    _, active, _, _ = await get_filtered(year, tenant=tenant)
    positions = generate_open_positions(active)
    pos = next((p for p in positions if p["id"] == position_id), None)
    if not pos:
        raise HTTPException(404, "Position not found")
    matches = _compute_matches(pos, active)
    return {"position": pos, "matches": matches}

# ---- Action Center (Alert Engine) ----
@api_router.get("/dashboard/alerts")
async def get_alerts(year: int = 2025, tenant: str = None):
    all_emp, active, hired, left = await get_filtered(year, tenant=tenant)
    hc = len(active)
    alerts = []
    alert_id = 0
    # Rule 1: Department turnover > 10%
    for dept_name in DEPARTMENTS:
        short = shorten_dept(dept_name)
        dept_active = [e for e in active if e['department'] == dept_name]
        dept_left = [e for e in left if e['department'] == dept_name]
        rate = round(len(dept_left) / len(dept_active) * 100, 1) if dept_active else 0
        if rate > 10:
            alert_id += 1
            alerts.append({"id": str(alert_id), "source": "Devir", "severity": "high" if rate > 18 else "med",
                "title": f"{short} departmanında yüksek devir oranı (%{rate})",
                "detail": f"{short} departmanında {len(dept_left)} ayrılma (%{rate} oran). Sektör ortalaması %10-12.",
                "suggested_action": f"{short} departmanında bağlılık görüşmeleri yap, ücret bantlarını gözden geçir, risk altındaki çalışanlar için mentorluk programı başlat.",
                "entity_ref": short, "status": "active"})
    # Rule 2: Succession — roles without high-readiness successors
    _, s_active, _, _ = await get_filtered(year, tenant=tenant)
    critical_roles_s = [e for e in s_active if e.get('band') == 'E' or (e.get('band') == 'D' and e.get('is_talent') and e.get('performance_score', 0) >= 4.0)]
    succ_pool = [e for e in s_active if e.get('band') in ['C','D'] and e.get('performance_score',0) >= 3.5]
    weak_succ_roles = []
    for role in critical_roles_s:
        role_skills = {s['skill'] for s in role.get('skills',[])}
        best_readiness = 0
        for s in succ_pool:
            if s['id'] == role['id']: continue
            s_skills = {sk['skill'] for sk in s.get('skills',[])}
            overlap = len(role_skills & s_skills)
            readiness = min(100, int((overlap / max(1,len(role_skills))) * 60 + (s.get('performance_score',3)/5)*40))
            best_readiness = max(best_readiness, readiness)
        if best_readiness < 80:
            weak_succ_roles.append((role, best_readiness))
    succession_actions = [
        "Departman içi yüksek potansiyelli çalışanları tespit et ve hızlandırılmış liderlik programına dahil et.",
        "Komşu departmanlardan yatay geçiş adaylarını değerlendir. Rotasyon programı ile deneyim kazandır.",
        "Pozisyon için kritik yetkinlikleri belirle ve mevcut C/D band çalışanlara hedefli mentorluk programı başlat.",
        "Acil yedekleme planı oluştur: 6 ay içinde en az 2 aday hazır olacak şekilde gelişim planı kur.",
        "Dış kaynak taraması başlat. Sektör deneyimli üst düzey aday havuzu oluştur. İç ve dış adayları paralel değerlendir.",
    ]
    for i, (role, best_r) in enumerate(weak_succ_roles[:5]):
        alert_id += 1
        sev = "high" if best_r < 65 else "med"
        title = f"{role['job_title']} ({shorten_dept(role['department'])}) için nitelikli halef yok" if best_r < 65 else f"{role['job_title']} ({shorten_dept(role['department'])}) için zayıf halef hattı"
        alerts.append({"id": str(alert_id), "source": "Yedekleme", "severity": sev,
            "title": title,
            "detail": f"{role['name']} (Band {role['band']}, {role.get('seniority_years',0)} yıl). En iyi halef hazırlığı: %{best_r}.",
            "suggested_action": succession_actions[i % len(succession_actions)],
            "entity_ref": role['name'], "status": "active"})
    # Rule 3: Skills gap — critical coverage
    skill_demand = {}
    for obj in STRATEGIC_OBJECTIVES:
        for sk in obj["required_skills"]:
            if sk not in skill_demand: skill_demand[sk] = 0
            skill_demand[sk] += max(3, obj["required_headcount"] // len(obj["required_skills"]))
    skill_supply = {}
    for emp in active:
        for s in emp.get('skills', []):
            if s['skill'] not in skill_supply: skill_supply[s['skill']] = 0
            if s['proficiency'] >= 3: skill_supply[s['skill']] += 1
    for sk, demand in skill_demand.items():
        supply = skill_supply.get(sk, 0)
        cov = round(supply / demand * 100) if demand else 100
        if cov < 50:
            alert_id += 1
            alerts.append({"id": str(alert_id), "source": "Yetkinlik", "severity": "high" if cov < 30 else "med",
                "title": f"Kritik yetkinlik açığı: {sk} (%{cov} karşılanma)",
                "detail": f"Yalnızca {supply} yetkin çalışan, {demand} talep var. Karşılanma %{cov}.",
                "suggested_action": f"Hedefli {sk} eğitim programı başlat (8 haftalık yoğun). İşe alımda {sk} yetkinliğini zorunlu kriter yap.",
                "entity_ref": sk, "status": "active"})
    # Rule 4: Org Health — narrow span or high manager ratio
    for dept_name in DEPARTMENTS:
        short = shorten_dept(dept_name)
        dept_emps = [e for e in active if e['department'] == dept_name]
        managers = [e for e in dept_emps if e.get('is_manager')]
        ics = [e for e in dept_emps if not e.get('is_manager')]
        span = round(len(ics) / len(managers), 1) if managers else 0
        mgr_ratio = round(len(managers) / len(dept_emps) * 100, 1) if dept_emps else 0
        if span < 4 and len(dept_emps) > 10:
            alert_id += 1
            alerts.append({"id": str(alert_id), "source": "Org. Sağlığı", "severity": "med",
                "title": f"{short} departmanında dar kontrol alanı (1:{span})",
                "detail": f"{short}: {len(managers)} yönetici, {len(ics)} uzman. Kontrol alanı {span}, optimal aralık 5-10.",
                "suggested_action": f"{short} departmanında takım birleştirmesini değerlendir. Alt takımları birleştirmeyi veya yöneticilik rollerini kıdemli uzman rolüne dönüştürmeyi planla.",
                "entity_ref": short, "status": "active"})
        if mgr_ratio > 30:
            alert_id += 1
            alerts.append({"id": str(alert_id), "source": "Org. Sağlığı", "severity": "med",
                "title": f"{short} departmanında yüksek yönetici oranı (%{mgr_ratio})",
                "detail": f"{len(dept_emps)} çalışanın {len(managers)} tanesi (%{mgr_ratio}) yöneticilik rolünde. Benchmark %15-20.",
                "suggested_action": f"{short} organizasyon tasarımını gözden geçir. Bazı yöneticilik rollerini teknik liderlik veya kıdemli uzmanlık rolüne dönüştür.",
                "entity_ref": short, "status": "active"})
    # Rule 5: Headcount gap — departments below target
    kadro_actions = [
        "{dept} için işe alım sürecini hızlandır. 2-3 ek kaynak kanalı devreye al.",
        "{dept} departmanında iç terfi ve rotasyon fırsatlarını değerlendir. Açık pozisyonları önceliklendir.",
        "{dept} için üniversite işbirliği ve stajyer programını genişlet. Yetenek havuzunu büyüt.",
        "{dept} kadro açığını kapatmak için danışman/geçici kadro desteği planla. Paralelde kalıcı işe alım yürüt.",
    ]
    for dept_name, target in TARGET_HEADCOUNT.items():
        short = shorten_dept(dept_name)
        current = len([e for e in active if e['department'] == dept_name])
        fill_rate = round(current / target["target"] * 100, 1) if target["target"] else 100
        gap = target["target"] - current
        if fill_rate < 90 and gap > 2:
            alert_id += 1
            sev = "high" if fill_rate < 70 else "med"
            action = kadro_actions[alert_id % len(kadro_actions)].format(dept=short)
            alerts.append({"id": str(alert_id), "source": "Kadro", "severity": sev,
                "title": f"{short} kadro açığı ({gap} pozisyon, %{fill_rate} doluluk)",
                "detail": f"Mevcut: {current}, Hedef: {target['target']}. {gap} pozisyon açığı var. Kritik roller: {', '.join(target['critical_roles'][:2])}.",
                "suggested_action": action,
                "entity_ref": short, "status": "active"})
    # Rule 6: Branch performance — below target
    try:
        branches = await db.branches.find({}, {"_id": 0}).to_list(100)
        b_sales = await db.sales_performance.find({}, {"_id": 0}).to_list(50000)
        for b in branches:
            bid = b["id"]
            bs = [s for s in b_sales if s["branch_id"] == bid and s["period"].startswith(str(year))]
            t_t = sum(s["target"] for s in bs)
            t_a = sum(s["actual"] for s in bs)
            ach = round(t_a / t_t * 100, 1) if t_t else 0
            b_active = len([e for e in active if e.get("branch_id") == bid])
            b_left_count = len([e for e in left if e.get("branch_id") == bid])
            b_turn = round(b_left_count / max(1, b_active) * 100, 1)
            bname = b["name"].replace(" Şubesi","")
            if ach < 85:
                alert_id += 1
                alerts.append({"id": str(alert_id), "source": "Şube Satış", "severity": "high" if ach < 75 else "med",
                    "title": f"{bname} hedefin altında (%{ach})",
                    "detail": f"{bname} şubesinin gerçekleşme oranı %{ach}. Hedef: {round(t_t/1000)}K, Gerçekleşen: {round(t_a/1000)}K.",
                    "suggested_action": f"{bname} için satış koçluğu programı başlat. Bölge müdürü ile haftalık takip toplantısı kur. Kampanya desteği sağla.",
                    "entity_ref": bname, "status": "active"})
            if b_turn > 15 and b_active > 5:
                alert_id += 1
                alerts.append({"id": str(alert_id), "source": "Şube Sirkülasyon", "severity": "high" if b_turn > 25 else "med",
                    "title": f"{bname} yüksek sirkülasyon (%{b_turn})",
                    "detail": f"{bname} şubesinde {b_left_count} ayrılma ({b_active} aktif kadro). Sirkülasyon %{b_turn}.",
                    "suggested_action": f"{bname} çalışanlarıyla bağlılık görüşmesi yap. Ücret benchmarkı kontrol et. Kariyer gelişim planları oluştur.",
                    "entity_ref": bname, "status": "active"})
            gap = b.get("target_headcount", b_active) - b_active
            if gap > 3 and ach > 85:
                alert_id += 1
                alerts.append({"id": str(alert_id), "source": "Şube Kadro", "severity": "high" if gap > 5 else "med",
                    "title": f"{bname} acil personel ihtiyacı ({gap} açık)",
                    "detail": f"{bname}: Mevcut {b_active}, Hedef {b.get('target_headcount', b_active)}. Satış performansı %{ach} ama {gap} kadro açığı var.",
                    "suggested_action": f"{bname} için işe alım sürecini hızlandır. İç mobilite havuzundan aday değerlendir. Geçici kadro desteği planla.",
                    "entity_ref": bname, "status": "active"})
    except Exception as e:
        logger.error(f"Branch alert error: {e}")
    # Sort by severity
    sev_order = {"high": 0, "med": 1, "low": 2}
    alerts = sorted(alerts, key=lambda x: sev_order.get(x["severity"], 2))
    high_count = len([a for a in alerts if a["severity"] == "high"])
    return {
        "kpis": {"active_alerts": len(alerts), "high_priority": high_count,
                 "resolved_this_month": random.Random(52).randint(5, 15), "sources": len(set(a["source"] for a in alerts))},
        "alerts": alerts
    }

class AlertResolveRequest(BaseModel):
    alert_id: str

@api_router.post("/dashboard/alerts/resolve")
async def resolve_alert(body: AlertResolveRequest):
    return {"message": f"Alert {body.alert_id} resolved", "status": "resolved"}

# ---- AI-Powered Alert Analysis ----
class AIAlertScanRequest(BaseModel):
    year: int = 2025

@api_router.post("/dashboard/alerts/ai-scan")
async def ai_alert_scan(body: AIAlertScanRequest):
    """Generate AI-powered executive brief from all active alerts + HR context."""
    year = body.year
    all_emp, active, hired, left = await get_filtered(year, tenant=tenant)
    hc = len(active)
    # Gather HR context
    turnover_rate = round(len(left) / hc * 100, 1) if hc else 0
    avg_perf = safe_avg(active, 'performance_score')
    feq = {"tenant_id": tenant} if tenant else {}
    avg_eng_data = await db.engagement.find(feq, {"_id": 0, "engagement_score": 1}).to_list(10000)
    avg_eng = round(sum(e['engagement_score'] for e in avg_eng_data) / len(avg_eng_data), 1) if avg_eng_data else 0
    country_dist = {}
    for e in active:
        c = e.get('country', 'Turkey')
        country_dist[c] = country_dist.get(c, 0) + 1
    # Get alerts
    alerts_resp = await get_alerts(year)
    alerts = alerts_resp["alerts"]
    high_alerts = [a for a in alerts if a["severity"] == "high"]
    med_alerts = [a for a in alerts if a["severity"] == "med"]
    # Build prompt
    alert_summary = "\n".join([f"- [{a['severity'].upper()}] {a['source']}: {a['title']}" for a in alerts[:15]])
    context = {
        "headcount": hc, "turnover_rate": turnover_rate, "avg_performance": avg_perf,
        "avg_engagement": avg_eng, "hires_ytd": len(hired), "leaves_ytd": len(left),
        "country_dist": country_dist, "high_alerts": len(high_alerts), "med_alerts": len(med_alerts),
        "total_alerts": len(alerts)
    }
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        prompt = f"""Organizasyonel sağlık sinyallerini analiz et ve yönetim için özet brief hazırla. Türkçe yaz, markdown veya yıldız kullanma, düz metin olsun.

KURUM BİLGİLERİ ({year})
Kadro: {hc} ({country_dist})
Devir Oranı: %{turnover_rate}
Ort. Performans: {avg_perf}/5.0
Ort. Bağlılık: {avg_eng}/10
Yılbaşından Bu Yana: {len(hired)} alım, {len(left)} ayrılma

AKTİF UYARILAR ({len(alerts)} toplam, {len(high_alerts)} yüksek öncelik)
{alert_summary}

Aşağıdaki başlıklarda profesyonel İK diliyle analiz yap:

YÖNETİCİ ÖZETİ
Organizasyonun genel sağlık durumu ve en kritik 2-3 risk hakkında kısa değerlendirme.

ÖNCELİKLİ 3 AKSİYON
Her biri için: ne yapılacak, beklenen etki, zaman çerçevesi ve sorumlu birim.

RİSK GÖRÜNÜMÜ
90 gün içinde aksiyon alınmazsa ne olur, kısa değerlendirme.

HIZLI KAZANIMLAR
Bu hafta düşük maliyetle uygulanabilecek 2-3 aksiyon.

Her bölüm 2-4 cümle olsun. Uyarılardaki verileri referans al. Somut öneriler ver."""

        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()),
                       system_message="Deneyimli İK analitik danışmanısın. Veri odaklı, somut, uygulanabilir öneriler ver. Markdown formatı kullanma, düz metin yaz. Her zaman verideki sayıları ve departmanları referans al.")
        chat.with_model("openai", "gpt-5.2")
        response = await chat.send_message(UserMessage(text=prompt))
        return {"ai_brief": response, "context": context, "status": "success"}
    except Exception as e:
        logger.error(f"AI alert scan error: {e}")
        return {"ai_brief": "AI analizi geçici olarak kullanılamıyor. Lütfen aşağıdaki bireysel uyarı önerilerini inceleyin.", "context": context, "status": "error"}

# ---- Branch Performance ----
@api_router.get("/branches/list")
async def get_branches():
    branches = await db.branches.find({}, {"_id": 0}).to_list(100)
    return {"branches": branches, "regions": sorted(set(b["region"] for b in branches))}

@api_router.get("/branches/performance")
async def get_branch_performance(period: str = "2025", region: str = "", tenant: str = None):
    bq = {"tenant_id": tenant} if tenant else {}
    sq = {"tenant_id": tenant} if tenant else {}
    branches = await db.branches.find(bq, {"_id": 0}).to_list(100)
    sales = await db.sales_performance.find(sq, {"_id": 0}).to_list(50000)
    if region:
        branches = [b for b in branches if b["region"] == region]
        branch_ids = {b["id"] for b in branches}
        sales = [s for s in sales if s["branch_id"] in branch_ids]
    period_sales = [s for s in sales if s["period"].startswith(period[:4])]
    # Branch-level aggregation
    branch_perf = {}
    for s in period_sales:
        bid = s["branch_id"]
        if bid not in branch_perf:
            branch_perf[bid] = {"target": 0, "actual": 0, "commission": 0, "reps": set()}
        branch_perf[bid]["target"] += s["target"]
        branch_perf[bid]["actual"] += s["actual"]
        branch_perf[bid]["commission"] += s["commission"]
        branch_perf[bid]["reps"].add(s["employee_id"])
    leaderboard = []
    for b in branches:
        bp = branch_perf.get(b["id"], {"target": 0, "actual": 0, "commission": 0, "reps": set()})
        ach = round(bp["actual"] / bp["target"] * 100, 1) if bp["target"] else 0
        status = "Hedef Üstü" if ach >= 100 else "Hedefe Yakın" if ach >= 85 else "Hedef Altı"
        leaderboard.append({
            "branch_id": b["id"], "name": b["name"], "region": b["region"],
            "city": b["city"], "segment": b["segment"],
            "headcount": b.get("headcount", 0), "reps": len(bp["reps"]),
            "target": round(bp["target"]), "actual": round(bp["actual"]),
            "achievement_pct": ach, "commission": round(bp["commission"]),
            "status": status
        })
    leaderboard = sorted(leaderboard, key=lambda x: -x["achievement_pct"])
    above = len([l for l in leaderboard if l["achievement_pct"] >= 100])
    below = len([l for l in leaderboard if l["achievement_pct"] < 85])
    avg_ach = round(sum(l["achievement_pct"] for l in leaderboard) / len(leaderboard), 1) if leaderboard else 0
    total_comm = sum(l["commission"] for l in leaderboard)
    best = leaderboard[0]["name"] if leaderboard else "-"
    # Region comparison
    region_perf = {}
    for l in leaderboard:
        r = l["region"]
        if r not in region_perf:
            region_perf[r] = {"total_ach": 0, "count": 0}
        region_perf[r]["total_ach"] += l["achievement_pct"]
        region_perf[r]["count"] += 1
    regions = [{"region": r, "avg_achievement": round(v["total_ach"]/v["count"],1), "branches": v["count"]} for r,v in region_perf.items()]
    regions = sorted(regions, key=lambda x: -x["avg_achievement"])
    # Segment comparison
    seg_perf = {}
    for l in leaderboard:
        sg = l["segment"]
        if sg not in seg_perf:
            seg_perf[sg] = {"total_ach": 0, "count": 0}
        seg_perf[sg]["total_ach"] += l["achievement_pct"]
        seg_perf[sg]["count"] += 1
    segments = [{"segment": s, "avg_achievement": round(v["total_ach"]/v["count"],1)} for s,v in seg_perf.items()]
    return {
        "kpis": {"total_branches": len(leaderboard), "avg_achievement": avg_ach,
                 "above_target": above, "below_target": below,
                 "total_commission": round(total_comm), "best_branch": best},
        "leaderboard": leaderboard, "regions": regions, "segments": segments
    }

@api_router.get("/branches/{branch_id}/trend")
async def get_branch_trend(branch_id: str):
    sales = await db.sales_performance.find({"branch_id": branch_id}, {"_id": 0}).to_list(10000)
    monthly = {}
    for s in sales:
        p = s["period"]
        if p not in monthly:
            monthly[p] = {"target": 0, "actual": 0}
        monthly[p]["target"] += s["target"]
        monthly[p]["actual"] += s["actual"]
    trend = [{"period": p, "target": round(v["target"]), "actual": round(v["actual"]),
              "achievement": round(v["actual"]/v["target"]*100,1) if v["target"] else 0}
             for p,v in sorted(monthly.items())]
    return {"trend": trend}

# ---- Commission & Targets ----
@api_router.get("/sales/reps")
async def get_sales_reps(period: str = "2025", branch: str = "", region: str = "", tenant: str = None):
    sq = {"tenant_id": tenant} if tenant else {}
    sales = await db.sales_performance.find(sq, {"_id": 0}).to_list(50000)
    period_sales = [s for s in sales if s["period"].startswith(period[:4])]
    if branch:
        period_sales = [s for s in period_sales if s["branch_id"] == branch]
    if region:
        period_sales = [s for s in period_sales if s["region"] == region]
    # Aggregate by employee
    rep_agg = {}
    for s in period_sales:
        eid = s["employee_id"]
        if eid not in rep_agg:
            rep_agg[eid] = {"name": s["employee_name"], "branch": s["branch_name"],
                            "region": s["region"], "segment": s["segment"],
                            "target": 0, "actual": 0, "commission": 0, "portfolio": 0, "months": 0}
        rep_agg[eid]["target"] += s["target"]
        rep_agg[eid]["actual"] += s["actual"]
        rep_agg[eid]["commission"] += s["commission"]
        rep_agg[eid]["portfolio"] = max(rep_agg[eid]["portfolio"], s["portfolio_size"])
        rep_agg[eid]["months"] += 1
    reps = []
    for eid, r in rep_agg.items():
        ach = round(r["actual"] / r["target"] * 100, 1) if r["target"] else 0
        reps.append({
            "employee_id": eid, "name": r["name"], "branch": r["branch"],
            "region": r["region"], "segment": r["segment"],
            "target": round(r["target"]), "actual": round(r["actual"]),
            "achievement_pct": ach, "commission": round(r["commission"]),
            "portfolio_size": r["portfolio"],
            "status": "Hedef Üstü" if ach >= 100 else "Hedefe Yakın" if ach >= 85 else "Hedef Altı"
        })
    reps = sorted(reps, key=lambda x: -x["achievement_pct"])
    avg_ach = round(sum(r["achievement_pct"] for r in reps)/len(reps),1) if reps else 0
    earners = len([r for r in reps if r["commission"] > 0])
    total_comm = sum(r["commission"] for r in reps)
    below = len([r for r in reps if r["achievement_pct"] < 85])
    best = reps[0]["name"] if reps else "-"
    # Achievement band distribution
    bands = [
        {"band": "<%85", "count": len([r for r in reps if r["achievement_pct"] < 85])},
        {"band": "%85-100", "count": len([r for r in reps if 85 <= r["achievement_pct"] < 100])},
        {"band": "%100-120", "count": len([r for r in reps if 100 <= r["achievement_pct"] < 120])},
        {"band": "%120+", "count": len([r for r in reps if r["achievement_pct"] >= 120])}
    ]
    return {
        "kpis": {"avg_achievement": avg_ach, "commission_earners": earners,
                 "total_commission": round(total_comm), "best_rep": best, "below_target": below},
        "reps": reps, "achievement_bands": bands,
        "prim_tiers": PRIM_TIERS
    }

# ---- Branch Staffing & Turnover ----
@api_router.get("/branches/staffing")
async def get_branch_staffing(year: int = 2025, region: str = "", tenant: str = None):
    bq = {"tenant_id": tenant} if tenant else {}
    sq = {"tenant_id": tenant} if tenant else {}
    branches = await db.branches.find(bq, {"_id": 0}).to_list(100)
    all_emp, active, hired, left = await get_filtered(year, tenant=tenant)
    sales = await db.sales_performance.find(sq, {"_id": 0}).to_list(50000)
    if region:
        branches = [b for b in branches if b["region"] == region]
    branch_ids = {b["id"] for b in branches}
    staffing = []
    for b in branches:
        bid = b["id"]
        b_active = [e for e in active if e.get("branch_id") == bid]
        b_left = [e for e in left if e.get("branch_id") == bid]
        b_hired = [e for e in hired if e.get("branch_id") == bid]
        current = len(b_active)
        target = b.get("target_headcount", current)
        gap = target - current
        turnover = round(len(b_left) / max(1, current) * 100, 1)
        # Sales achievement for this branch
        b_sales = [s for s in sales if s["branch_id"] == bid and s["period"].startswith(str(year))]
        total_target = sum(s["target"] for s in b_sales)
        total_actual = sum(s["actual"] for s in b_sales)
        ach = round(total_actual / total_target * 100, 1) if total_target else 0
        # Staffing pressure
        pressure = round(gap * 0.4 + (turnover / 100 * current * 0.4) + (max(0, ach - 100) / 100 * current * 0.2), 1)
        monthly_plan = max(0, int(gap * 0.15) + int(turnover / 100 * current * 0.08))
        urgency = "Acil" if gap > 3 and ach > 90 else "Yüksek" if gap > 2 or turnover > 15 else "Normal" if gap > 0 else "Yeterli"
        staffing.append({
            "branch_id": bid, "name": b["name"], "region": b["region"], "city": b["city"],
            "segment": b["segment"], "current": current, "target": target, "gap": gap,
            "turnover_pct": turnover, "achievement_pct": ach,
            "hires_ytd": len(b_hired), "leaves_ytd": len(b_left),
            "pressure": pressure, "monthly_plan": monthly_plan, "urgency": urgency
        })
    staffing = sorted(staffing, key=lambda x: -x["pressure"])
    total_gap = sum(s["gap"] for s in staffing if s["gap"] > 0)
    critical = len([s for s in staffing if s["urgency"] in ["Acil", "Yüksek"]])
    avg_turnover = round(sum(s["turnover_pct"] for s in staffing) / len(staffing), 1) if staffing else 0
    worst_turnover = max(staffing, key=lambda x: x["turnover_pct"])["name"] if staffing else "-"
    urgent_hire = len([s for s in staffing if s["monthly_plan"] > 0])
    fill_rate = round(sum(s["current"] for s in staffing) / max(1, sum(s["target"] for s in staffing)) * 100, 1)
    # Turnover heatmap: branch × quarter
    heatmap = []
    quarters = {"Q1": ("01","03"), "Q2": ("04","06"), "Q3": ("07","09"), "Q4": ("10","12")}
    for b in branches:
        row = {"name": b["name"], "branch_id": b["id"]}
        for qname, (qstart, qend) in quarters.items():
            q_left = len([e for e in left if e.get("branch_id") == b["id"] and
                         e.get("termination_date","")[:4] == str(year) and
                         qstart <= e.get("termination_date","")[5:7] <= qend])
            row[qname] = q_left
        heatmap.append(row)
    # Quadrant data: x=achievement, y=fill_rate
    quadrant = [{"name": s["name"].replace(" Şubesi",""), "achievement": s["achievement_pct"],
                 "fill_rate": round(s["current"]/max(1,s["target"])*100,1), "gap": s["gap"],
                 "urgency": s["urgency"]} for s in staffing]
    return {
        "kpis": {"total_gap": total_gap, "critical_branches": critical, "avg_turnover": avg_turnover,
                 "worst_turnover": worst_turnover, "urgent_hire": urgent_hire, "fill_rate": fill_rate},
        "staffing": staffing, "heatmap": heatmap, "quadrant": quadrant
    }

# ---- Branch Map ----
@api_router.get("/branches/map")
async def get_branch_map(metric: str = "performance", year: int = 2025, tenant: str = None):
    bq = {"tenant_id": tenant} if tenant else {}
    sq = {"tenant_id": tenant} if tenant else {}
    branches = await db.branches.find(bq, {"_id": 0}).to_list(100)
    _, active, _, left = await get_filtered(year, tenant=tenant)
    sales = await db.sales_performance.find(sq, {"_id": 0}).to_list(50000)
    pins = []
    for b in branches:
        bid = b["id"]
        b_active = [e for e in active if e.get("branch_id") == bid]
        b_left = [e for e in left if e.get("branch_id") == bid]
        current = len(b_active)
        target = b.get("target_headcount", current)
        turnover = round(len(b_left) / max(1, current) * 100, 1)
        b_sales = [s for s in sales if s["branch_id"] == bid and s["period"].startswith(str(year))]
        t_target = sum(s["target"] for s in b_sales)
        t_actual = sum(s["actual"] for s in b_sales)
        ach = round(t_actual / t_target * 100, 1) if t_target else 0
        gap = target - current
        fill = round(current / max(1, target) * 100, 1)
        if metric == "performance":
            value = ach
            color = "teal" if ach >= 100 else "amber" if ach >= 85 else "red"
        elif metric == "staffing":
            value = fill
            color = "teal" if fill >= 90 else "amber" if fill >= 70 else "red"
        else:
            value = turnover
            color = "red" if turnover > 15 else "amber" if turnover > 8 else "teal"
        pins.append({
            "branch_id": bid, "name": b["name"], "region": b["region"],
            "city": b["city"], "segment": b["segment"],
            "lat": b["lat"], "lng": b["lng"],
            "headcount": current, "target": target, "gap": gap,
            "achievement_pct": ach, "turnover_pct": turnover, "fill_rate": fill,
            "metric_value": value, "color": color
        })
    region_summary = {}
    for p in pins:
        r = p["region"]
        if r not in region_summary:
            region_summary[r] = {"branches": 0, "total_ach": 0, "total_hc": 0}
        region_summary[r]["branches"] += 1
        region_summary[r]["total_ach"] += p["achievement_pct"]
        region_summary[r]["total_hc"] += p["headcount"]
    regions = [{"region": r, "branches": v["branches"],
                "avg_achievement": round(v["total_ach"]/v["branches"],1),
                "headcount": v["total_hc"]} for r,v in region_summary.items()]
    regions = sorted(regions, key=lambda x: -x["avg_achievement"])
    attention = len([p for p in pins if p["color"] == "red"])
    return {
        "kpis": {"total_branches": len(pins), "regions": len(regions),
                 "avg_achievement": round(sum(p["achievement_pct"] for p in pins)/len(pins),1) if pins else 0,
                 "attention": attention},
        "pins": pins, "regions": regions,
        "best_5": sorted(pins, key=lambda x: -x["achievement_pct"])[:5],
        "worst_5": sorted(pins, key=lambda x: x["achievement_pct"])[:5]
    }

app.include_router(api_router)

# Auth & Tenant routes
from routes_auth import setup_auth_routes, setup_tenant_routes, auth_router, tenant_router
setup_auth_routes(db)
setup_tenant_routes(db)
app.include_router(auth_router)
app.include_router(tenant_router)

# Serve uploaded files (logos etc.)
from fastapi.staticfiles import StaticFiles
app.mount("/api/uploads", StaticFiles(directory="/app/backend/uploads"), name="uploads")

app.add_middleware(CORSMiddleware, allow_credentials=True,
                   allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
                   allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
