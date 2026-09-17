"""
Universal tenant enrichment — generates skills, survey data for ALL tenants.
"""
import asyncio
import random
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne
import os, sys
from dotenv import load_dotenv
load_dotenv()
sys.path.insert(0, os.path.dirname(__file__))

async def enrich_all():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ.get("DB_NAME", "plenalitik")]

    from server import generate_employee_skills
    from routes_surveys import generate_survey_data, setup_surveys
    setup_surveys(db)

    tenants = await db.tenants.find({}, {"slug": 1, "sector": 1}).to_list(50)
    
    for tenant in tenants:
        slug = tenant["slug"]
        sector = tenant.get("sector", "Bankacılık")
        print(f"\n{'='*50}")
        print(f"Enriching: {slug} (sector: {sector})")
        
        emps = await db.employees.find({"tenant_id": slug}, {"_id": 1, "id": 1, "department": 1, "band": 1, "skills": 1}).to_list(5000)
        
        # 1. Skills — only if empty
        empty_skills = [e for e in emps if not e.get("skills") or len(e.get("skills", [])) == 0]
        if empty_skills:
            print(f"  Skills: {len(empty_skills)} employees need skills...")
            ops = []
            for emp in empty_skills:
                skills = generate_employee_skills(emp.get("department", ""), emp.get("band", "B"), sector=sector)
                ops.append(UpdateOne({"_id": emp["_id"]}, {"$set": {"skills": skills}}))
            for i in range(0, len(ops), 500):
                await db.employees.bulk_write(ops[i:i+500])
            print(f"  Skills: Added to {len(empty_skills)} employees")
        else:
            print(f"  Skills: Already populated ({len(emps)} employees)")

        # 2. Survey data — generate if missing
        exit_count = await db.exit_surveys.count_documents({"tenant_id": slug})
        if exit_count == 0:
            print(f"  Surveys: Generating...")
            result = await generate_survey_data(slug)
            print(f"  Surveys: exit={result['exit']}, onboarding={result['onboarding']}, pulse={result['pulse']}")
        else:
            print(f"  Surveys: Already have {exit_count} exit surveys")
    
    print(f"\n{'='*50}")
    print("All tenants enriched!")

if __name__ == "__main__":
    asyncio.run(enrich_all())
