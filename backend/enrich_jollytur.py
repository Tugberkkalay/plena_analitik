"""
Enrich Jolly Tur tenant with full HR data:
- Employee fields: skills, education, seniority, engagement, turnover_risk, etc.
- Recruitment pipeline records
- Training records
- Exit / Onboarding / Pulse surveys
"""
import asyncio, random, uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

TENANT = "jollytur"

TURIZM_SKILLS = [
    ("Destinasyon Bilgisi", "satis", 3), ("Paket Tur Satışı", "satis", 3),
    ("Otel Rezervasyon Yönetimi", "operasyon", 2), ("Uçak Bileti Satışı", "satis", 2),
    ("Vize ve Pasaport İşlemleri", "operasyon", 2), ("CRM Kullanımı", "dijital", 2),
    ("Müşteri İlişkileri", "davranissal", 3), ("Çapraz Satış Teknikleri", "satis", 2),
    ("Şikayet Yönetimi", "davranissal", 2), ("Dijital Pazarlama", "dijital", 1),
    ("Transfer ve Lojistik", "operasyon", 1), ("Muhasebe ve Fatura", "operasyon", 1),
    ("Ekip Yönetimi", "yonetsel", 2), ("Raporlama ve Analiz", "dijital", 1),
    ("Çağrı Merkezi Protokolü", "operasyon", 2), ("NPS ve Memnuniyet Ölçümü", "dijital", 1),
    ("Seyahat Sigortası", "operasyon", 1), ("Etkinlik Organizasyonu", "operasyon", 1),
]

DEPARTMENTS = ["Kadıköy", "Bakırköy", "Nişantaşı", "Genel Müdürlük", "Çağrı Merkezi",
               "Alsancak", "Kuşadası", "Bodrum", "Antalya Merkez", "Lara",
               "Ankara Kızılay", "Ankara Çankaya"]
HRBP_MAP = {
    "Kadıköy": "Seda Yılmaz", "Bakırköy": "Seda Yılmaz", "Nişantaşı": "Seda Yılmaz",
    "Genel Müdürlük": "Seda Yılmaz", "Çağrı Merkezi": "Seda Yılmaz",
    "Alsancak": "Mert Kara", "Kuşadası": "Mert Kara", "Bodrum": "Mert Kara",
    "Antalya Merkez": "Ayşe Demir", "Lara": "Ayşe Demir",
    "Ankara Kızılay": "Kerem Öz", "Ankara Çankaya": "Kerem Öz",
}
UNIVERSITIES = ["İstanbul Üniversitesi", "Boğaziçi Üniversitesi", "Ankara Üniversitesi",
                "Ege Üniversitesi", "Akdeniz Üniversitesi", "Gazi Üniversitesi",
                "Marmara Üniversitesi", "Dokuz Eylül Üniversitesi", "Hacettepe Üniversitesi",
                "Anadolu Üniversitesi", "İstanbul Bilgi Üniversitesi", "Bahçeşehir Üniversitesi"]
EDUCATION_LEVELS = ["Lisans", "Lisans", "Lisans", "Ön Lisans", "Yüksek Lisans"]
LEAVING_REASONS = ["Kariyer Gelişimi", "Ücret", "Yönetici", "İş-Yaşam Dengesi", "Taşınma", "Emeklilik"]
SOURCES = ["Kariyer.net", "LinkedIn", "Referans", "İç Aday", "Indeed", "Şirket Sitesi"]
COURSES = [
    ("Destinasyon Eğitimi", "Teknik", 8), ("Satış Teknikleri", "Satış", 12),
    ("CRM Kullanımı", "Dijital", 6), ("Müşteri Deneyimi", "Davranışsal", 10),
    ("Liderlik Gelişimi", "Yönetim", 16), ("Dijital Pazarlama", "Dijital", 8),
    ("Kriz Yönetimi", "Yönetim", 6), ("İlk Yardım", "Zorunlu", 4),
    ("KVKK Eğitimi", "Zorunlu", 2), ("İngilizce B2", "Dil", 20),
    ("Almanca A2", "Dil", 16), ("Çapraz Satış Workshop", "Satış", 4),
    ("Excel İleri", "Dijital", 8), ("Sunum Teknikleri", "Davranışsal", 4),
]

def _rand_date(start_year=2025, end_year=2026):
    s = datetime(start_year, 1, 1)
    e = datetime(end_year, 6, 30)
    d = s + timedelta(days=random.randint(0, (e - s).days))
    return d.strftime("%Y-%m-%d")


async def enrich():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    employees = await db.employees.find({"tenant_id": TENANT}).to_list(200)
    print(f"Found {len(employees)} employees")

    # 1. Enrich employee fields
    for emp in employees:
        dept = emp.get("department", "")
        skills = random.sample(TURIZM_SKILLS, k=random.randint(5, 10))
        skill_docs = [{"skill": s[0], "skill_id": s[0].lower().replace(" ", "-"),
                       "category": s[1], "proficiency": random.randint(1, s[2]+2)} for s in skills]

        hire_str = emp.get("hire_date", "2023-01-15")
        try:
            hire_dt = datetime.strptime(str(hire_str)[:10], "%Y-%m-%d")
        except Exception:
            hire_dt = datetime(2023, 1, 15)
        seniority = round((datetime.now() - hire_dt).days / 365.25, 1)

        is_left = random.random() < 0.12
        updates = {
            "skills": skill_docs,
            "hrbp": HRBP_MAP.get(dept, "Seda Yılmaz"),
            "education_level": random.choice(EDUCATION_LEVELS),
            "university": random.choice(UNIVERSITIES),
            "seniority_years": seniority,
            "marital_status": random.choice(["Evli", "Bekar", "Evli"]),
            "is_full_time": True,
            "is_disabled": random.random() < 0.03,
            "role_type": "sales" if "Danışman" in emp.get("job_title", "") or "Temsilci" in emp.get("job_title", "") else "management",
            "engagement_score": round(random.uniform(3.0, 4.8), 1),
            "turnover_risk": random.choice(["low", "low", "low", "medium", "medium", "high"]),
            "mobility_flag": random.random() < 0.15,
            "leaving_reason": random.choice(LEAVING_REASONS) if is_left else None,
            "termination_date": _rand_date(2025, 2026) if is_left else None,
            "termination_type": random.choice(["İstifa", "Karşılıklı"]) if is_left else None,
            "status": "left" if is_left else "active",
            "data_source": "excel_import",
        }
        await db.employees.update_one({"_id": emp["_id"]}, {"$set": updates})

    print("Employee fields enriched")

    # 2. Recruitment (150 records)
    await db.recruitment.delete_many({"tenant_id": TENANT})
    rec_docs = []
    positions = ["Satış Danışmanı", "Çağrı Merkezi Temsilcisi", "Şube Müdürü", "Pazarlama Uzmanı",
                 "Dijital Pazarlama Uzmanı", "Operasyon Sorumlusu", "İK Uzmanı", "Finans Uzmanı"]
    stages_all = ["Başvuru", "Ön Eleme", "Mülakatlar", "Teklif", "İşe Alım"]
    for _ in range(150):
        dept = random.choice(DEPARTMENTS)
        src = random.choice(SOURCES)
        stage_idx = random.choices(range(5), weights=[30, 25, 20, 15, 10])[0]
        stage = stages_all[stage_idx]
        funnel = stages_all[:stage_idx + 1]
        applied = _rand_date(2025, 2026)
        rec_docs.append({
            "id": str(uuid.uuid4()), "candidate_name": f"Aday {random.randint(1000,9999)}",
            "position": random.choice(positions), "department": dept, "band": random.choice(["B", "C", "D"]),
            "source": src, "stage": stage, "applied_date": applied,
            "quarter": f"Ç{random.randint(1,4)}", "days_in_pipeline": random.randint(5, 60),
            "cost": random.randint(200, 3000), "channel_cost": random.randint(100, 1500),
            "interview_cost": random.randint(0, 500), "onboarding_cost": random.randint(0, 1000) if stage == "İşe Alım" else 0,
            "experience_years": random.randint(0, 12),
            "education": random.choice(EDUCATION_LEVELS), "university": random.choice(UNIVERSITIES),
            "hiring_reason": random.choice(["Yeni Pozisyon", "Yedekleme", "Büyüme", "Ayrılık Yerine"]),
            "funnel_reached": stage, "funnel_stages": funnel,
            "dropout_reason": random.choice(["Maaş Beklentisi", "Başka Teklif", "Uygun Değil", None]) if stage != "İşe Alım" else None,
            "offer_salary": random.randint(25000, 60000) if stage in ("Teklif", "İşe Alım") else None,
            "offer_vs_benchmark": round(random.uniform(0.85, 1.15), 2) if stage in ("Teklif", "İşe Alım") else None,
            "created_at": datetime.now(timezone.utc).isoformat(), "tenant_id": TENANT,
        })
    await db.recruitment.insert_many(rec_docs)
    print(f"Recruitment: {len(rec_docs)} records")

    # 3. Training (200 records)
    await db.training.delete_many({"tenant_id": TENANT})
    tr_docs = []
    for emp in employees:
        for _ in range(random.randint(2, 5)):
            course = random.choice(COURSES)
            tr_docs.append({
                "id": str(uuid.uuid4()), "employee_id": emp["id"], "employee_name": emp["name"],
                "department": emp.get("department", ""), "course_name": course[0],
                "category": course[1], "hours": course[2] + random.uniform(-2, 4),
                "status": random.choice(["Completed", "Completed", "Completed", "In Progress"]),
                "score": round(random.uniform(55, 98), 1),
                "date": _rand_date(2025, 2026), "cost": random.randint(100, 2000),
                "created_at": datetime.now(timezone.utc).isoformat(), "tenant_id": TENANT,
            })
    await db.training.insert_many(tr_docs)
    print(f"Training: {len(tr_docs)} records")

    # 4. Exit Surveys
    await db.exit_surveys.delete_many({"tenant_id": TENANT})
    left_emps = [e for e in employees if random.random() < 0.15]
    exit_docs = []
    for emp in left_emps:
        dept = emp.get("department", "")
        exit_docs.append({
            "id": str(uuid.uuid4()), "employee_id": emp["id"], "employee_name": emp["name"],
            "department": dept, "hrbp": HRBP_MAP.get(dept, ""),
            "project": "", "segment": emp.get("segment", ""),
            "survey_date": _rand_date(2025, 2026),
            "exit_reason": random.choice(LEAVING_REASONS),
            "exit_recommend": round(random.uniform(1, 5), 1),
            "exit_manager": round(random.uniform(2, 5), 1),
            "exit_growth": round(random.uniform(1.5, 4.5), 1),
            "exit_workload": round(random.uniform(2, 5), 1),
            "exit_culture": round(random.uniform(2, 5), 1),
            "exit_return": round(random.uniform(1, 5), 1),
            "voluntary": random.random() < 0.8,
            "tenure_months": random.randint(6, 60),
            "tenant_id": TENANT,
        })
    await db.exit_surveys.insert_many(exit_docs) if exit_docs else None
    print(f"Exit surveys: {len(exit_docs)} records")

    # 5. Onboarding Surveys
    await db.onboarding_surveys.delete_many({"tenant_id": TENANT})
    new_emps = random.sample(employees, min(20, len(employees)))
    onb_docs = []
    for emp in new_emps:
        dept = emp.get("department", "")
        onb_docs.append({
            "id": str(uuid.uuid4()), "employee_id": emp["id"], "employee_name": emp["name"],
            "department": dept, "hrbp": HRBP_MAP.get(dept, ""),
            "project": "", "segment": emp.get("segment", ""),
            "survey_date": _rand_date(2025, 2026),
            "onb_orientation": round(random.uniform(2.5, 5), 1),
            "onb_buddy": round(random.uniform(2, 5), 1),
            "onb_tools": round(random.uniform(2, 5), 1),
            "onb_team": round(random.uniform(3, 5), 1),
            "onb_expectations": round(random.uniform(2, 5), 1),
            "onb_overall": round(random.uniform(3, 5), 1),
            "tenant_id": TENANT,
        })
    await db.onboarding_surveys.insert_many(onb_docs)
    print(f"Onboarding surveys: {len(onb_docs)} records")

    # 6. Pulse Surveys (monthly)
    await db.pulse_surveys.delete_many({"tenant_id": TENANT})
    pulse_docs = []
    months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
              "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
              "2026-01", "2026-02", "2026-03"]
    for m in months:
        sample = random.sample(employees, min(random.randint(30, 50), len(employees)))
        for emp in sample:
            dept = emp.get("department", "")
            pulse_docs.append({
                "id": str(uuid.uuid4()), "employee_id": emp["id"], "employee_name": emp["name"],
                "department": dept, "hrbp": HRBP_MAP.get(dept, ""),
                "project": "", "segment": emp.get("segment", ""),
                "month": m, "survey_date": f"{m}-15",
                "pulse_morale": round(random.uniform(2.5, 5), 1),
                "pulse_workload": round(random.uniform(2, 4.5), 1),
                "pulse_support": round(random.uniform(2, 5), 1),
                "tenant_id": TENANT,
            })
    await db.pulse_surveys.insert_many(pulse_docs)
    print(f"Pulse surveys: {len(pulse_docs)} records")

    # Summary
    active = await db.employees.count_documents({"tenant_id": TENANT, "status": "active"})
    print(f"\n=== SUMMARY ===")
    print(f"Active employees: {active}")
    for c in ["recruitment", "training", "exit_surveys", "onboarding_surveys", "pulse_surveys"]:
        cnt = await db[c].count_documents({"tenant_id": TENANT})
        print(f"  {c}: {cnt}")
    
    # Check skills
    emp_with_skills = await db.employees.count_documents({"tenant_id": TENANT, "skills.0": {"$exists": True}})
    print(f"  employees with skills: {emp_with_skills}")

    client.close()


if __name__ == "__main__":
    asyncio.run(enrich())
