"""Deterministic, reversible seed for TUSAŞ POC focus datasets.

Only the TUSAŞ ``recruitment`` and ``talent_programs`` tenant slices are
replaced. Records are synthetic and contain no real names, employee numbers,
or compensation data. Employee and all other collections remain untouched.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import uuid
from datetime import date, datetime, timedelta, timezone

from pymongo import MongoClient

from tusas_importer import DEPT_SEGMENT_MAP, HRBP_MAP


SEED_VERSION = "tusas-focus-v1"
FIXED_CREATED_AT = "2026-09-28T00:00:00+00:00"
EXPECTED_FUNNEL = [3000, 1066, 574, 341, 289, 243, 223]
EXPECTED_PROGRAMS = {
    "SKY Stajyer", "MGP", "LIFT UP", "Kadın Mentorluk", "LIFT UP+", "SKY int",
}
DATE_FIELDS = [
    "application_date", "online_eval_date", "hr_interview_date",
    "technical_interview_date", "security_clearance_date", "offer_date", "start_date",
]
DEPARTMENTS = list(HRBP_MAP)
PROJECTS = ["KAAN", "HÜRJET", "ANKA", "AKSUNGUR", "GÖKBEY", "A400M Yapısallar", "Uzay Sistemleri", "Genel"]
SOURCES = ["Kariyer Portalı", "Çalışan Referansı", "Üniversite Etkinliği", "LinkedIn", "Yetenek Programı"]
UNIVERSITIES = ["ODTÜ", "İTÜ", "Hacettepe", "Bilkent", "Yıldız Teknik", "Eskişehir Teknik", "Gazi"]
STAGE_NAMES = [
    "Başvuru", "Online Değerlendirme", "İK Mülakatı", "Teknik Mülakat",
    "Güvenlik Soruşturması", "Teklif", "İşe Başlama",
]
PROGRAM_SPECS = [
    ("SKY Stajyer", 236, 212, 97, 76),
    ("MGP", 131, 118, 109, 97),
    ("LIFT UP", 126, 116, 59, 49),
    ("Kadın Mentorluk", 90, 79, 24, 21),
    ("LIFT UP+", 66, 59, 37, 33),
    ("SKY int", 51, 43, 26, 25),
]


class FocusSeedValidationError(ValueError):
    """Raised before any database mutation when the POC bundle is inconsistent."""


def _iso(value: date) -> str:
    return value.isoformat()


def _stage_level(index: int) -> int:
    # The exact cut-offs yield the target monotonically decreasing funnel.
    if index < 223:
        return 6
    if index < 243:
        return 5
    if index < 289:
        return 4
    if index < 341:
        return 3
    if index < 574:
        return 2
    if index < 1066:
        return 1
    return 0


def generate_recruitment(tenant: str) -> list[dict]:
    records = []
    base = date(2025, 1, 1)
    for index in range(3000):
        level = _stage_level(index)
        application = base + timedelta(days=(index * 17) % 610)
        dates = [
            application,
            application + timedelta(days=4 + index % 5),
            application + timedelta(days=11 + index % 7),
            application + timedelta(days=20 + index % 9),
            application + timedelta(days=50 + index % 61),
            application + timedelta(days=57 + index % 61),
            application + timedelta(days=71 + index % 61),
        ]
        department = DEPARTMENTS[index % len(DEPARTMENTS)]
        hired = level == 6
        row = {
            "id": f"POC-BSV-{index + 1:04d}",
            "name": f"Anonim Aday {index + 1:04d}",
            "gender": "Female" if index % 3 == 0 else "Male",
            "department": department,
            "position": f"{department} Uzmanı",
            "band": "B" if index % 4 else "A",
            "source": SOURCES[index % len(SOURCES)],
            "stage": STAGE_NAMES[level],
            "stage_index": level,
            "status": "İşe Başlatıldı" if hired else ("Süreçte" if index % 5 == 0 else "Elendi/Vazgeçti"),
            "hired": hired,
            "university": UNIVERSITIES[index % len(UNIVERSITIES)],
            "education": "Yüksek Lisans" if index % 4 == 0 else "Lisans",
            "rejection_reason": "" if hired else ["Teknik Yeterlilik", "Aday Vazgeçti", "Kontenjan", "Diğer"][index % 4],
            "segment": DEPT_SEGMENT_MAP.get(department, ""),
            "hrbp": HRBP_MAP.get(department, ""),
            "project": PROJECTS[index % len(PROJECTS)],
            "tenant_id": tenant,
            "created_at": FIXED_CREATED_AT,
            "data_source": SEED_VERSION,
            "synthetic": True,
        }
        for field_index, field in enumerate(DATE_FIELDS):
            row[field] = _iso(dates[field_index]) if level >= field_index else None
        row["total_days"] = (dates[level] - dates[0]).days if level else 0
        records.append(row)
    return records


def generate_talent_programs(tenant: str) -> list[dict]:
    records = []
    participant = 1
    periods = [2023, 2024, 2025, 2026]
    for program, total, completed, hired, retained in PROGRAM_SPECS:
        for index in range(total):
            female = program == "Kadın Mentorluk" or (index + participant) % 3 == 0
            records.append({
                "id": f"POC-TAL-{participant:04d}",
                "program": program,
                "donem": periods[(participant - 1) % len(periods)],
                "cinsiyet": "Female" if female else "Male",
                "universite": UNIVERSITIES[(participant - 1) % len(UNIVERSITIES)],
                "tamamladi": index < completed,
                "ise_alindi": index < hired,
                "ilk_yil_kaldi": index < retained,
                "tenant_id": tenant,
                "created_at": FIXED_CREATED_AT,
                "data_source": SEED_VERSION,
                "synthetic": True,
            })
            participant += 1
    return records


def _checksum(bundle: dict) -> str:
    payload = json.dumps(bundle, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _date_order_is_valid(record: dict) -> bool:
    values = [record.get(field) for field in DATE_FIELDS if record.get(field)]
    return values == sorted(values)


def summarize_bundle(bundle: dict) -> dict:
    recruitment = bundle["recruitment"]
    talent = bundle["talent_programs"]
    return {
        "seed_version": SEED_VERSION,
        "checksum": _checksum(bundle),
        "recruitment": {
            "total": len(recruitment),
            "funnel": [sum(bool(row.get(field)) for row in recruitment) for field in DATE_FIELDS],
            "hired": sum(bool(row.get("hired")) for row in recruitment),
        },
        "talent_programs": {
            "total": len(talent),
            "completed": sum(bool(row.get("tamamladi")) for row in talent),
            "hired": sum(bool(row.get("ise_alindi")) for row in talent),
            "retained": sum(bool(row.get("ilk_yil_kaldi")) for row in talent),
            "programs": sorted({row.get("program") for row in talent}),
            "periods": sorted({row.get("donem") for row in talent}),
        },
    }


def validate_bundle(bundle: dict) -> dict:
    recruitment = bundle.get("recruitment") or []
    talent = bundle.get("talent_programs") or []
    summary = summarize_bundle(bundle)

    if summary["recruitment"]["funnel"] != EXPECTED_FUNNEL:
        raise FocusSeedValidationError(f"Recruitment funnel mismatch: {summary['recruitment']['funnel']}")
    if summary["recruitment"]["hired"] != 223:
        raise FocusSeedValidationError("Recruitment hired count must be 223")
    if len({row.get("id") for row in recruitment}) != len(recruitment):
        raise FocusSeedValidationError("Recruitment IDs must be unique")
    if any(not _date_order_is_valid(row) for row in recruitment):
        raise FocusSeedValidationError("Recruitment dates must be chronological")

    talent_stats = summary["talent_programs"]
    expected_talent = {"total": 700, "completed": 627, "hired": 352, "retained": 301}
    if any(talent_stats[key] != value for key, value in expected_talent.items()):
        raise FocusSeedValidationError(f"Talent KPI mismatch: {talent_stats}")
    if set(talent_stats["programs"]) != EXPECTED_PROGRAMS:
        raise FocusSeedValidationError(f"Talent program mismatch: {talent_stats['programs']}")
    if talent_stats["periods"] != [2023, 2024, 2025, 2026]:
        raise FocusSeedValidationError(f"Talent periods mismatch: {talent_stats['periods']}")
    if len({row.get("id") for row in talent}) != len(talent):
        raise FocusSeedValidationError("Talent participant IDs must be unique")
    if any(row.get("ilk_yil_kaldi") and not row.get("ise_alindi") for row in talent):
        raise FocusSeedValidationError("Retained talent participants must be hired")
    if any(row.get("ise_alindi") and not row.get("tamamladi") for row in talent):
        raise FocusSeedValidationError("Hired talent participants must complete the program")
    if any(not row.get("synthetic") or not row.get("data_source") == SEED_VERSION for row in recruitment + talent):
        raise FocusSeedValidationError("Every focus seed record must be explicitly synthetic and versioned")
    return summary


def load_bundle(tenant: str = "tusas") -> dict:
    bundle = {
        "recruitment": generate_recruitment(tenant),
        "talent_programs": generate_talent_programs(tenant),
    }
    validate_bundle(bundle)
    return bundle


def _restore(db, tenant: str, backups: dict) -> None:
    for collection_name, documents in backups.items():
        collection = db[collection_name]
        collection.delete_many({"tenant_id": tenant})
        if documents:
            collection.insert_many(documents)


def apply_bundle(db, bundle: dict, tenant: str = "tusas") -> dict:
    """Replace two tenant slices and automatically roll back on any failure."""
    summary = validate_bundle(bundle)
    run_id = f"{SEED_VERSION}-{uuid.uuid4()}"
    collection_names = ("recruitment", "talent_programs")
    backups = {name: list(db[name].find({"tenant_id": tenant})) for name in collection_names}
    backup_rows = [
        {"run_id": run_id, "tenant_id": tenant, "collection": name, "document": document}
        for name, documents in backups.items()
        for document in documents
    ]
    manifest = {
        "run_id": run_id,
        "seed_version": SEED_VERSION,
        "tenant_id": tenant,
        "status": "started",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "previous_counts": {name: len(rows) for name, rows in backups.items()},
        "summary": summary,
    }
    db.seed_manifests.insert_one(manifest)
    if backup_rows:
        db.seed_backup_documents.insert_many(backup_rows)

    try:
        for name in collection_names:
            db[name].delete_many({"tenant_id": tenant})
            db[name].insert_many(bundle[name])
        stored = {
            name: list(db[name].find({"tenant_id": tenant}, {"_id": 0}))
            for name in collection_names
        }
        stored_summary = validate_bundle(stored)
        db.seed_manifests.update_one(
            {"run_id": run_id},
            {"$set": {"status": "complete", "completed_at": datetime.now(timezone.utc).isoformat(), "stored_summary": stored_summary}},
        )
        return {"run_id": run_id, **stored_summary, "previous_counts": manifest["previous_counts"]}
    except Exception as exc:
        _restore(db, tenant, backups)
        db.seed_manifests.update_one(
            {"run_id": run_id},
            {"$set": {"status": "rolled_back", "failed_at": datetime.now(timezone.utc).isoformat(), "error": str(exc)[:500]}},
        )
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tenant", default="tusas")
    parser.add_argument("--apply", action="store_true", help="Write to MongoDB; default is validation-only")
    args = parser.parse_args()

    bundle = load_bundle(args.tenant)
    if args.apply:
        mongo_url = os.environ.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME")
        if not mongo_url or not db_name:
            raise RuntimeError("MONGO_URL and DB_NAME are required with --apply")
        client = MongoClient(mongo_url)
        result = apply_bundle(client[db_name], bundle, args.tenant)
    else:
        result = {"mode": "validation-only", **summarize_bundle(bundle)}
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
