"""Integrity checks for the TUSAŞ security and talent POC seed."""

import sys
from datetime import date
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from seed_tusas_focus import (
    EXPECTED_FUNNEL,
    EXPECTED_PROGRAMS,
    LEGACY_FUNNEL_STAGES,
    load_bundle,
    summarize_bundle,
)


def test_focus_seed_matches_target_kpis():
    bundle = load_bundle()
    summary = summarize_bundle(bundle)
    assert summary["recruitment"] == {
        "total": 3000,
        "funnel": EXPECTED_FUNNEL,
        "hired": 223,
    }
    talent = summary["talent_programs"]
    assert {key: talent[key] for key in ("total", "completed", "hired", "retained")} == {
        "total": 700,
        "completed": 627,
        "hired": 352,
        "retained": 301,
    }
    assert set(talent["programs"]) == EXPECTED_PROGRAMS


def test_focus_seed_is_reproducible_and_logically_consistent():
    first = load_bundle()
    second = load_bundle()
    assert summarize_bundle(first)["checksum"] == summarize_bundle(second)["checksum"]
    assert all(row["synthetic"] is True for row in first["recruitment"])
    assert all(not row["ilk_yil_kaldi"] or row["ise_alindi"] for row in first["talent_programs"])
    assert all(not row["ise_alindi"] or row["tamamladi"] for row in first["talent_programs"])

    hired_durations = [row["total_days"] for row in first["recruitment"] if row["hired"]]
    clearance_durations = []
    for row in first["recruitment"]:
        if row.get("technical_interview_date") and row.get("security_clearance_date"):
            clearance_durations.append(
                (date.fromisoformat(row["security_clearance_date"]) - date.fromisoformat(row["technical_interview_date"])).days
            )
    assert sum(hired_durations) / len(hired_durations) > sum(clearance_durations) / len(clearance_durations)


def test_recruitment_seed_populates_customer_dashboard_contract():
    rows = load_bundle()["recruitment"]
    assert [
        sum(stage in row["funnel_stages"] for row in rows)
        for stage in LEGACY_FUNNEL_STAGES
    ] == [3000, 1066, 574, 341, 243, 223]
    assert sum(row["stage"] == "Hired" for row in rows) == 223
    assert sum(row["stage"] in {"Hired", "Offered", "Reddedildi"} for row in rows) == 243
    assert {row["university"] for row in rows}
    assert all(row["cost"] > 0 for row in rows if row["hired"])
    assert all(row["compensation_is_synthetic"] for row in rows if row["offer_salary"])
    assert any(row["applied_date"].startswith("2025-") for row in rows)
