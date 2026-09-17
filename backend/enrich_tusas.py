"""
TUSAŞ Data Enrichment — populates skills, engagement, training collections
and enriches employee records for all analytics modules.
"""
import asyncio
import random
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv()

TENANT = "tusas"
SECTOR = "Savunma/Havacılık"

async def enrich():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ.get("DB_NAME", "plenalitik")]

    # Import config
    import sys
    sys.path.insert(0, os.path.dirname(__file__))
    from taxonomy_loader import get_sector_config
    from server import generate_employee_skills

    cfg = get_sector_config(SECTOR)
    DEPARTMENTS = cfg["DEPARTMENTS"]
    HRBP_MAP = cfg.get("HRBP_MAP", {})

    # 1. Enrich employees with skills
    print("1. Generating skills for employees...")
    emps = await db.employees.find({"tenant_id": TENANT}, {"_id": 1, "id": 1, "department": 1, "band": 1, "name": 1, "status": 1}).to_list(5000)
    bulk_ops = []
    for emp in emps:
        skills = generate_employee_skills(emp.get("department", ""), emp.get("band", "B"), sector=SECTOR)
        bulk_ops.append({
            "filter": {"_id": emp["_id"]},
            "update": {"$set": {"skills": skills}}
        })
    # Execute in batches
    for i in range(0, len(bulk_ops), 500):
        batch = bulk_ops[i:i+500]
        if batch:
            from pymongo import UpdateOne
            ops = [UpdateOne(b["filter"], b["update"]) for b in batch]
            await db.employees.bulk_write(ops)
    print(f"   Skills added to {len(emps)} employees")

    # 2. Generate engagement surveys
    print("2. Generating engagement surveys...")
    await db.engagement.delete_many({"tenant_id": TENANT})
    active_emps = [e for e in emps if e.get("status") == "active"]
    surveys = []
    for emp in active_emps:
        eng = round(random.uniform(4, 9.5), 1)
        surveys.append({
            "id": str(uuid.uuid4()),
            "employee_id": emp["id"],
            "employee_name": emp.get("name", ""),
            "department": emp.get("department", ""),
            "engagement_score": eng,
            "enps_score": random.randint(-10, 80),
            "satisfaction": round(max(1, min(5, random.gauss(3.5, 0.8))), 1),
            "work_life_balance": round(max(1, min(5, random.gauss(3.2, 0.9))), 1),
            "career_growth": round(max(1, min(5, random.gauss(3.3, 1.0))), 1),
            "manager_rating": round(max(1, min(5, random.gauss(3.6, 0.7))), 1),
            "recognition": round(max(1, min(5, random.gauss(3.4, 0.8))), 1),
            "culture_alignment": round(max(1, min(5, random.gauss(3.5, 0.7))), 1),
            "survey_date": f"2025-{random.randint(1,6):02d}-01",
            "absenteeism_days": random.randint(0, 12),
            "tenant_id": TENANT,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    if surveys:
        await db.engagement.insert_many(surveys)
    print(f"   {len(surveys)} engagement surveys created")

    # 3. Generate training data
    print("3. Generating training data...")
    await db.training.delete_many({"tenant_id": TENANT})
    TRAINING_PROGRAMS = [
        ("Havacılık Güvenlik Standartları (AS9100)", "Kalite", 24), ("FOD Farkındalık", "Kalite", 8),
        ("NDT Muayene Teknikleri", "Kalite", 40), ("CATIA V5/V6 İleri Seviye", "Teknik", 32),
        ("Yapısal Analiz (FEA)", "Teknik", 40), ("DO-178C Yazılım Sertifikasyonu", "Teknik", 48),
        ("Aviyonik Entegrasyon", "Teknik", 36), ("CNC Programlama İleri", "Teknik", 24),
        ("Kompozit Onarım Teknikleri", "Teknik", 16), ("İş Güvenliği (İSG)", "Zorunlu", 8),
        ("ITAR/Gizlilik Eğitimi", "Zorunlu", 4), ("Liderlik Gelişim Programı", "Soft Skill", 32),
        ("Proje Yönetimi (PMP)", "Yönetim", 40), ("Sistem Mühendisliği (MBSE)", "Teknik", 32),
        ("Uçuş Test Mühendisliği", "Teknik", 48), ("Python & Veri Analitiği", "Teknik", 24),
        ("Takım Çalışması ve İletişim", "Soft Skill", 16), ("EVM Kazanılmış Değer", "Yönetim", 16),
        ("Kalite Kontrol İstatistik", "Kalite", 16), ("Siber Güvenlik Farkındalık", "Zorunlu", 8),
    ]
    training_records = []
    for emp in random.sample(active_emps, min(len(active_emps), int(len(active_emps) * 0.7))):
        n_courses = random.randint(1, 4)
        for prog, cat, hours in random.sample(TRAINING_PROGRAMS, min(n_courses, len(TRAINING_PROGRAMS))):
            completed = random.random() < 0.82
            training_records.append({
                "id": str(uuid.uuid4()),
                "employee_id": emp["id"],
                "employee_name": emp.get("name", ""),
                "department": emp.get("department", ""),
                "program_name": prog,
                "category": cat,
                "hours": hours,
                "status": "completed" if completed else random.choice(["in_progress", "enrolled"]),
                "score": round(random.uniform(60, 100), 1) if completed else None,
                "start_date": f"2025-{random.randint(1,9):02d}-{random.randint(1,28):02d}",
                "completion_date": f"2025-{random.randint(3,12):02d}-{random.randint(1,28):02d}" if completed else None,
                "mandatory": cat == "Zorunlu",
                "tenant_id": TENANT,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    if training_records:
        await db.training.insert_many(training_records)
    print(f"   {len(training_records)} training records created")

    # 4. Generate mentors data (via employee field enrichment)
    print("4. Enriching mentor/mentee assignments...")
    mentors = random.sample([e for e in active_emps], min(80, len(active_emps)))
    mentor_ids = [m["id"] for m in mentors[:40]]
    mentee_ids = [m["id"] for m in mentors[40:80]]
    mentor_ops = []
    for i, mid in enumerate(mentee_ids):
        mentor_ops.append(UpdateOne(
            {"id": mid, "tenant_id": TENANT},
            {"$set": {"mentor_id": mentor_ids[i % len(mentor_ids)], "mentor_name": mentors[i % len(mentor_ids)].get("name", "")}}
        ))
    if mentor_ops:
        await db.employees.bulk_write(mentor_ops)
    print(f"   {len(mentor_ops)} mentor-mentee pairs created")

    print("\nEnrichment complete!")

if __name__ == "__main__":
    from pymongo import UpdateOne
    asyncio.run(enrich())
