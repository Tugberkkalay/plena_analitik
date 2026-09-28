"""Integrity checks for the TUSAŞ security and talent POC seed."""

import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from seed_tusas_focus import EXPECTED_FUNNEL, EXPECTED_PROGRAMS, load_bundle, summarize_bundle


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
