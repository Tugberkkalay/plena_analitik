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
    emps = generate_seed_data(500)
    await db.employees.insert_many(emps)
    return {"message": "Reset to demo data", "count": len(emps)}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True,
                   allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
                   allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
