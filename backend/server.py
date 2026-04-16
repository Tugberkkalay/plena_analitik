from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query
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
APP_NAME = "hrlytic"
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
MALE_NAMES = ["Ahmet","Mehmet","Mustafa","Ali","Hasan","Ibrahim","Yusuf","Omer","Murat","Emre","Burak","Can","Serkan","Onur","Tolga","Kerem","Baris","Cem","Deniz","Oguz","Kaan","Arda","Berk","Efe","Furkan","Gokhan","Hakan","Tarik","Volkan","Selim"]
FEMALE_NAMES = ["Ayse","Fatma","Zeynep","Elif","Merve","Selin","Esra","Busra","Derya","Gizem","Ebru","Pinar","Basak","Irem","Dilan","Ceren","Gamze","Hande","Nur","Sevgi","Asli","Defne","Eda","Hazal","Melis","Naz","Ozge","Tugce","Yagmur","Buse"]
LAST_NAMES = ["Yilmaz","Kaya","Demir","Celik","Sahin","Yildiz","Aydin","Ozdemir","Arslan","Dogan","Kilic","Aslan","Koc","Polat","Kurt","Ozturk","Eren","Acar","Cetin","Aksoy","Aktas","Basaran","Cengiz","Duran","Gunes","Karaca","Sari","Tunc","Unal","Tekin"]
DEPARTMENTS = ["Information Technology","Human Resources","Finance","Marketing","Operations","Sales","Legal","Research & Development","Administration","Supply Chain"]
DEPT_WEIGHTS = [15,8,10,10,14,13,5,12,6,7]
POSITIONS_BY_BAND = {
    "A": ["Junior Analyst","Assistant","Trainee","Junior Specialist","Associate"],
    "B": ["Specialist","Coordinator","Analyst","Developer","Consultant"],
    "C": ["Senior Specialist","Senior Analyst","Senior Developer","Lead Consultant","Engineer"],
    "D": ["Manager","Team Lead","Department Head","Project Director"],
    "E": ["Director","Vice President","SVP","Chief Officer","General Manager"]
}
BANDS = ["A","B","C","D","E"]
BAND_WEIGHTS = [20,30,25,15,10]
CITIES = ["Istanbul","Ankara","Izmir","Bursa","Antalya"]
CITY_WEIGHTS = [45,20,15,10,10]
EDUCATION_LEVELS = ["High School","Bachelor","Master","PhD"]
EDUCATION_WEIGHTS = [10,50,30,10]
UNIVERSITIES = ["Bogazici University","Istanbul Technical University","METU","Bilkent University","Koc University","Sabanci University","Istanbul University","Galatasaray University","Hacettepe University","Yildiz Technical University","Marmara University","Ege University","Dokuz Eylul University","Gazi University","Anadolu University"]
MARITAL_STATUS = ["Single","Married","Divorced"]
MARITAL_WEIGHTS = [35,55,10]
LEAVING_REASONS_VOL = ["Resignation","Better Opportunity","Relocation","Personal Reasons","Career Change","Retirement"]
LEAVING_REASONS_INVOL = ["Performance Issues","Restructuring","End of Contract"]
SALARY_BY_BAND = {"A":(15000,30000),"B":(30000,50000),"C":(50000,80000),"D":(80000,130000),"E":(130000,250000)}

def generate_seed_data(count=500):
    random.seed(42)
    employees = []
    for i in range(count):
        gender = random.choice(["Male","Female"])
        first = random.choice(MALE_NAMES if gender == "Male" else FEMALE_NAMES)
        last = random.choice(LAST_NAMES)
        band = random.choices(BANDS, weights=BAND_WEIGHTS, k=1)[0]
        age_min = {"A":22,"B":25,"C":28,"D":32,"E":38}[band]
        age_max = {"A":35,"B":42,"C":50,"D":55,"E":62}[band]
        age = random.randint(age_min, age_max)
        hy = random.randint(2018, 2025)
        hm = random.randint(1, 12)
        hd = random.randint(1, 28)
        hire_date = f"{hy}-{hm:02d}-{hd:02d}"
        seniority = max(0, round(2025 - hy + random.uniform(-0.5, 0.5), 1))
        dept = random.choices(DEPARTMENTS, weights=DEPT_WEIGHTS, k=1)[0]
        pos = random.choice(POSITIONS_BY_BAND[band])
        city = random.choices(CITIES, weights=CITY_WEIGHTS, k=1)[0]
        edu = random.choices(EDUCATION_LEVELS, weights=EDUCATION_WEIGHTS, k=1)[0]
        uni = random.choice(UNIVERSITIES) if edu != "High School" else None
        marital = random.choices(MARITAL_STATUS, weights=MARITAL_WEIGHTS, k=1)[0]
        sal_range = SALARY_BY_BAND[band]
        salary = round(random.uniform(sal_range[0], sal_range[1]), -2)
        perf = max(1.0, min(5.0, round(random.gauss(3.5, 0.7), 1)))
        is_talent = random.random() < 0.12
        is_manager = band in ["D","E"]
        is_disabled = random.random() < 0.03
        is_full_time = random.random() < 0.95
        status = "active"
        termination_date = None
        leaving_reason = None
        termination_type = None
        if random.random() < 0.2:
            min_ty = max(hy + 1, 2020)
            if min_ty <= 2025:
                ty = random.randint(min_ty, 2025)
                tm = random.randint(1, 12)
                td = random.randint(1, 28)
                termination_date = f"{ty}-{tm:02d}-{td:02d}"
                if random.random() < 0.65:
                    termination_type = "voluntary"
                    leaving_reason = random.choice(LEAVING_REASONS_VOL)
                else:
                    termination_type = "involuntary"
                    leaving_reason = random.choice(LEAVING_REASONS_INVOL)
                status = "terminated"
        emp = {
            "id": str(uuid.uuid4()), "name": f"{first} {last}", "gender": gender, "age": age,
            "hire_date": hire_date, "termination_date": termination_date, "department": dept,
            "job_title": pos, "band": band, "salary": salary, "city": city,
            "education_level": edu, "university": uni, "marital_status": marital,
            "is_talent": is_talent, "is_manager": is_manager, "is_disabled": is_disabled,
            "is_full_time": is_full_time, "performance_score": perf, "seniority_years": seniority,
            "status": status, "leaving_reason": leaving_reason, "termination_type": termination_type,
            "data_source": "seed", "created_at": datetime.now(timezone.utc).isoformat()
        }
        employees.append(emp)
    return employees

# ---- New Module Constants ----
RECRUITMENT_SOURCES = ["LinkedIn","Referral","Career Site","Agency","Job Board","University","Social Media"]
COURSE_NAMES = ["Leadership Fundamentals","Advanced Project Management","Data Analytics","Cybersecurity Basics","Effective Communication","Python Programming","Cloud Architecture","Financial Modeling","Design Thinking","Agile Methodology","Machine Learning","Compliance Training","Time Management","Presentation Skills","Strategic Planning","Team Building"]
COURSE_CATEGORIES = ["Technical","Leadership","Compliance","Soft Skills","Language"]

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
    c = {}
    for i in items:
        v = i.get(key, "Unknown")
        if v is None: v = "Unknown"
        c[v] = c.get(v, 0) + 1
    return [{"name": k, "value": v} for k, v in sorted(c.items())]

def count_by_range(items, key, fn, ranges):
    c = {r: 0 for r in ranges}
    for i in items:
        r = fn(i.get(key, 0))
        if r in c: c[r] += 1
    return [{"range": r, "count": c[r]} for r in ranges]

def count_by_gender_range(items, key, fn, ranges):
    m = {r: 0 for r in ranges}
    f = {r: 0 for r in ranges}
    for i in items:
        r = fn(i.get(key, 0))
        if r in m:
            if i.get("gender") == "Male": m[r] += 1
            else: f[r] += 1
    return [{"range": r, "male": m[r], "female": f[r]} for r in ranges]

async def get_filtered(year):
    all_emp = await db.employees.find({}, {"_id": 0}).to_list(10000)
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
            logger.info("Seeding demo data...")
            emps = generate_seed_data(500)
            await db.employees.insert_many(emps)
            logger.info(f"Seeded {len(emps)} employees")
        if await db.recruitment.count_documents({}) == 0:
            cands = generate_recruitment_data(200)
            await db.recruitment.insert_many(cands)
            logger.info(f"Seeded {len(cands)} candidates")
        if await db.training.count_documents({}) == 0:
            emps = await db.employees.find({}, {"_id": 0}).to_list(10000)
            trn = generate_training_data(emps, 300)
            await db.training.insert_many(trn)
            logger.info(f"Seeded {len(trn)} training records")
        if await db.engagement.count_documents({}) == 0:
            emps = await db.employees.find({}, {"_id": 0}).to_list(10000)
            eng = generate_engagement_data(emps)
            await db.engagement.insert_many(eng)
            logger.info(f"Seeded {len(eng)} engagement surveys")
    except Exception as e:
        logger.error(f"Startup seed error: {e}")
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.warning(f"Storage init: {e}")

@api_router.get("/")
async def root():
    return {"message": "HRlytic API v1.0"}

@api_router.post("/seed")
async def seed_data():
    await db.employees.delete_many({})
    emps = generate_seed_data(500)
    await db.employees.insert_many(emps)
    return {"message": f"Seeded {len(emps)} employees", "count": len(emps)}

@api_router.get("/dashboard/years")
async def get_years():
    emps = await db.employees.find({}, {"_id": 0, "hire_date": 1}).to_list(10000)
    years = sorted(set(int(e['hire_date'][:4]) for e in emps), reverse=True)
    return {"years": years}

# ---- Overview ----
@api_router.get("/dashboard/overview")
async def get_overview(year: int = 2025):
    all_emp, active, hired, left = await get_filtered(year)
    hc = len(active)
    disabled = len([e for e in active if e.get('is_disabled')])
    managers = len([e for e in active if e.get('is_manager')])
    hc_by_month = []
    for mi, mn in enumerate(MONTHS):
        ms = f"{year}-{mi+1:02d}"
        c = len([e for e in all_emp if e['hire_date'][:7] <= ms and (not e.get('termination_date') or e['termination_date'][:7] > ms)])
        hc_by_month.append({"month": mn, "count": c})
    return {
        "kpis": {"headcount": hc, "hires": len(hired), "leaves": len(left),
                 "turnover_rate": round(len(left)/hc*100,1) if hc else 0,
                 "disabled_pct": round(disabled/hc*100,1) if hc else 0},
        "gender_distribution": count_by(active, 'gender'),
        "age_distribution": count_by_range(active, 'age', get_age_range, AGE_RANGES),
        "seniority_distribution": count_by_range(active, 'seniority_years', get_seniority_range, SENIORITY_RANGES),
        "band_distribution": count_by(active, 'band'),
        "department_distribution": count_by(active, 'department'),
        "headcount_by_month": hc_by_month,
        "manager_distribution": [{"name": "Manager", "value": managers}, {"name": "Non-Manager", "value": hc - managers}]
    }

# ---- Headcount ----
@api_router.get("/dashboard/headcount")
async def get_headcount(year: int = 2025):
    _, active, _, _ = await get_filtered(year)
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
async def get_hires(year: int = 2025):
    _, active, hired, _ = await get_filtered(year)
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
async def get_leaves(year: int = 2025):
    _, active, _, left = await get_filtered(year)
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
@api_router.get("/dashboard/turnover")
async def get_turnover(year: int = 2025):
    all_emp, active, hired, left = await get_filtered(year)
    hc = len(active)
    vol = [e for e in left if e.get('termination_type')=='voluntary']
    invol = [e for e in left if e.get('termination_type')=='involuntary']
    talent_left = [e for e in left if e.get('is_talent')]
    new_hire_left = [e for e in left if e['hire_date'][:4]==str(year)]
    turnover_month = []
    cum = 0
    for mi, mn in enumerate(MONTHS):
        ms = f"{year}-{mi+1:02d}"
        ml = len([e for e in left if e.get('termination_date','')[:7]==ms])
        rate = round(ml/hc*100,1) if hc else 0
        cum += rate
        turnover_month.append({"month": mn, "rate": rate, "cumulative": round(cum,1)})
    reasons = {}
    for e in left:
        r = e.get('leaving_reason','Unknown')
        reasons[r] = reasons.get(r, 0) + 1
    dept_turnover = []
    for dept in DEPARTMENTS:
        da = [e for e in active if e['department']==dept]
        dl = [e for e in left if e['department']==dept]
        rate = round(len(dl)/len(da)*100,1) if da else 0
        dept_turnover.append({"department": dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D"), "rate": rate})
    age_turnover = []
    for ar in AGE_RANGES:
        aa = [e for e in active if get_age_range(e['age'])==ar]
        al = [e for e in left if get_age_range(e['age'])==ar]
        rate = round(len(al)/len(aa)*100,1) if aa else 0
        age_turnover.append({"range": ar, "rate": rate})
    gender_turnover = []
    for g in ["Male","Female"]:
        ga = [e for e in active if e['gender']==g]
        gl = [e for e in left if e['gender']==g]
        rate = round(len(gl)/len(ga)*100,1) if ga else 0
        gender_turnover.append({"gender": g, "rate": rate})
    yearly = []
    for y in range(2020, year+1):
        _, ya, _, yl = await get_filtered(y)
        rate = round(len(yl)/len(ya)*100,1) if ya else 0
        yearly.append({"year": y, "rate": rate})
    return {
        "kpis": {"turnover_rate": round(len(left)/hc*100,1) if hc else 0,
                 "voluntary_rate": round(len(vol)/hc*100,1) if hc else 0,
                 "involuntary_rate": round(len(invol)/hc*100,1) if hc else 0,
                 "talent_turnover": round(len(talent_left)/hc*100,1) if hc else 0,
                 "new_hire_turnover": round(len(new_hire_left)/hc*100,1) if hc else 0},
        "turnover_by_month": turnover_month,
        "leaving_reasons": [{"reason": k, "count": v} for k, v in sorted(reasons.items(), key=lambda x:-x[1])],
        "turnover_by_department": dept_turnover,
        "turnover_by_age": age_turnover,
        "turnover_by_gender": gender_turnover,
        "turnover_by_year": yearly
    }

# ---- Movement ----
@api_router.get("/dashboard/movement")
async def get_movement(year: int = 2025):
    all_emp, active, hired, left = await get_filtered(year)
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
        _, ya, _, yl = await get_filtered(y)
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

@api_router.post("/ai/forecast")
async def ai_forecast(body: ForecastRequest):
    year = body.year
    all_emp, active, hired, left = await get_filtered(year)
    hc = len(active)
    turnover_rate = len(left)/hc if hc else 0
    avg_monthly_hires = len(hired)/12
    avg_monthly_leaves = len(left)/12
    net = avg_monthly_hires - avg_monthly_leaves
    forecast_months = ["Jul","Aug","Sep","Oct","Nov","Dec"]
    hc_forecast = []
    cur = hc
    for m in forecast_months:
        cur = int(cur + net + random.uniform(-2,2))
        hc_forecast.append({"month": f"{m} {year}", "predicted": cur, "lower": int(cur*0.95), "upper": int(cur*1.05)})
    dept_risks = []
    for dept in DEPARTMENTS:
        da = [e for e in active if e['department']==dept]
        dl = [e for e in left if e['department']==dept]
        risk = round(len(dl)/len(da)*100,1) if da else 0
        short = dept.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D")
        dept_risks.append({"department": short, "risk": risk, "headcount": len(da)})
    dept_risks.sort(key=lambda x: -x['risk'])
    attrition_level = "Low" if turnover_rate < 0.1 else "Medium" if turnover_rate < 0.2 else "High"
    avg_perf = safe_avg(active, 'performance_score')
    burnout = max(0, min(1, (5-avg_perf)/5*0.6))
    burnout_level = "Low" if burnout < 0.3 else "Medium" if burnout < 0.6 else "High"
    at_risk = sorted([e for e in active if e.get('performance_score',3) < 2.5], key=lambda x: x.get('performance_score',3))[:10]
    at_risk_list = [{"name":e['name'],"department":e['department'],"performance":e.get('performance_score',0),"seniority":e.get('seniority_years',0),"risk_level":"High" if e.get('performance_score',3)<2 else "Medium"} for e in at_risk]
    result = {
        "attrition_risk": {"score": round(turnover_rate,2), "level": attrition_level},
        "headcount_forecast": hc_forecast,
        "burnout_risk": {"score": round(burnout,2), "level": burnout_level},
        "department_risks": dept_risks[:6],
        "at_risk_employees": at_risk_list,
        "recommendations": [
            "Focus retention on high-turnover departments",
            "Implement mentoring for new hires to reduce 180-day failure rate",
            "Review compensation for talent retention",
            "Develop career pathways for high performers",
            "Enhance onboarding process"
        ],
        "ai_summary": ""
    }
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        summary_data = {"headcount":hc,"hires":len(hired),"leaves":len(left),"turnover_pct":round(turnover_rate*100,1),
                        "avg_age":safe_avg(active,'age'),"avg_seniority":safe_avg(active,'seniority_years'),
                        "top_risk_depts":[d['department'] for d in dept_risks[:3]]}
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()),
                       system_message="You are an expert HR analytics advisor. Provide concise actionable insights. Respond in 150 words max.")
        chat.with_model("openai", "gpt-5.2")
        msg = UserMessage(text=f"Analyze this HR data for {year} and give key workforce insights and predictions:\n{json.dumps(summary_data)}")
        response = await chat.send_message(msg)
        result["ai_summary"] = response
    except Exception as e:
        logger.error(f"AI error: {e}")
        result["ai_summary"] = "AI analysis unavailable. Showing computed forecasts based on historical patterns."
    return result

# ---- Data Upload ----
@api_router.post("/data/upload")
async def upload_data(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "unknown"
    ext = filename.split('.')[-1].lower()
    if ext not in ['xlsx','xls','csv']:
        raise HTTPException(400, "Unsupported format. Use .xlsx or .csv")
    try:
        if ext in ['xlsx','xls']:
            df = pd.read_excel(BytesIO(content))
        else:
            df = pd.read_csv(BytesIO(content))
        storage_path = None
        try:
            sp = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
            put_object(sp, content, file.content_type or "application/octet-stream")
            storage_path = sp
        except:
            pass
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
        df_renamed = df.rename(columns=col_map)
        records = df_renamed.to_dict('records')
        employees = []
        for rec in records:
            emp = {
                "id": str(uuid.uuid4()),
                "name": str(rec.get('name', 'Unknown')),
                "gender": str(rec.get('gender', random.choice(['Male','Female']))),
                "age": int(rec.get('age', random.randint(25,45))),
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
                "performance_score": round(random.uniform(2.5,4.5),1),
                "seniority_years": round(random.uniform(0,5),1),
                "status": "active", "leaving_reason": None, "termination_type": None,
                "data_source": "upload", "created_at": datetime.now(timezone.utc).isoformat()
            }
            employees.append(emp)
        if employees:
            await db.employees.insert_many(employees)
        file_rec = {"id": str(uuid.uuid4()), "filename": filename, "storage_path": storage_path,
                    "row_count": len(records), "columns": list(df.columns),
                    "uploaded_at": datetime.now(timezone.utc).isoformat()}
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
    emps = generate_seed_data(500)
    await db.employees.insert_many(emps)
    cands = generate_recruitment_data(200)
    await db.recruitment.insert_many(cands)
    trn = generate_training_data(emps, 300)
    await db.training.insert_many(trn)
    eng = generate_engagement_data(emps)
    await db.engagement.insert_many(eng)
    return {"message": "Reset to demo data", "count": len(emps)}

# ---- Recruitment ----
@api_router.get("/dashboard/recruitment")
async def get_recruitment(year: int = 2025):
    all_cands = await db.recruitment.find({}, {"_id": 0}).to_list(10000)
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
async def get_performance(year: int = 2025):
    _, active, _, _ = await get_filtered(year)
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
async def get_learning(year: int = 2025):
    all_trn = await db.training.find({}, {"_id": 0}).to_list(10000)
    trn = [t for t in all_trn if t.get('date','')[:4] == str(year)]
    total = len(trn)
    completed = [t for t in trn if t['status'] == 'Completed']
    in_progress = [t for t in trn if t['status'] == 'In Progress']
    total_hours = round(sum(t.get('hours', 0) for t in trn), 1)
    _, active, _, _ = await get_filtered(year)
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
async def get_compensation(year: int = 2025):
    _, active, _, _ = await get_filtered(year)
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
async def get_engagement(year: int = 2025):
    all_eng = await db.engagement.find({}, {"_id": 0}).to_list(10000)
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
async def get_career(year: int = 2025):
    _, active, hired, left = await get_filtered(year)
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
async def get_hr_operations(year: int = 2025):
    _, active, hired, left = await get_filtered(year)
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

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True,
                   allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
                   allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
