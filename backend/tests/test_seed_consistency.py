"""Regression tests for reproducible, internally consistent POC seed data."""
from copy import deepcopy

import pytest

from seed_validation import SeedValidationError, validate_seed_bundle
from server import (
    _normalized_career_paths,
    generate_ek_kadro_talepleri,
    generate_engagement_data,
    generate_norm_kadro_data,
    generate_recruitment_data,
    generate_seed_data,
    generate_training_data,
)
from taxonomy_loader import get_sector_config


SECTOR = "Savunma/Havacılık"
CONFIG = get_sector_config(SECTOR)
EXPECTED_HEADCOUNT = sum(row["target"] for row in CONFIG["TARGET_HEADCOUNT"].values())


@pytest.fixture(scope="module")
def defense_bundle():
    employees = generate_seed_data(EXPECTED_HEADCOUNT, SECTOR)
    return {
        "employees": employees,
        "branches": [],
        "sales": [],
        "recruitment": generate_recruitment_data(200, SECTOR),
        "training": generate_training_data(employees, 300),
        "engagement": generate_engagement_data(employees),
        "ek_kadro": generate_ek_kadro_talepleri(SECTOR, 30),
        "norm_kadro": generate_norm_kadro_data(employees, SECTOR),
    }


def _validate(bundle):
    return validate_seed_bundle(
        bundle,
        sector=SECTOR,
        expected_headcount=EXPECTED_HEADCOUNT,
        departments=CONFIG["DEPARTMENTS"],
    )


def test_defense_seed_passes_integrity_gate(defense_bundle):
    manifest = _validate(defense_bundle)
    assert manifest["counts"]["employees"] == 2400
    assert manifest["counts"]["branches"] == 0
    assert manifest["counts"]["sales"] == 0
    assert len(manifest["checksum"]) == 64


def test_defense_employee_generation_is_reproducible(defense_bundle):
    regenerated = generate_seed_data(EXPECTED_HEADCOUNT, SECTOR)
    assert regenerated == defense_bundle["employees"]


def test_unknown_sector_does_not_fall_back_to_banking():
    with pytest.raises(ValueError, match="Desteklenmeyen sektör"):
        get_sector_config("Üretim")


def test_legacy_defense_alias_resolves_to_defense_taxonomy():
    assert get_sector_config("Savunma") is get_sector_config(SECTOR)


def test_defense_career_paths_are_normalized_for_api():
    paths = _normalized_career_paths(CONFIG)
    assert len(paths) == 8
    assert all(path.get("id") and len(path.get("adimlar", [])) == 2 for path in paths)
    assert paths[0]["adimlar"][1]["tipik_sure_ay"] == 24


def test_integrity_gate_rejects_cross_record_corruption(defense_bundle):
    corrupted = deepcopy(defense_bundle)
    corrupted["training"][0]["employee_id"] = "unknown-employee"
    with pytest.raises(SeedValidationError, match="unknown|non-active"):
        _validate(corrupted)


def test_integrity_gate_rejects_fake_norm_actual(defense_bundle):
    corrupted = deepcopy(defense_bundle)
    department_row = next(row for row in corrupted["norm_kadro"] if not row.get("position"))
    department_row["gerceklesen_kadro"] += 1
    with pytest.raises(SeedValidationError, match="norm headcount mismatch"):
        _validate(corrupted)
