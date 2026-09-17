"""
Iteration 19 — Verify universal enrichment across turknet, yapikredi, parakende.
Focus:
  - turknet skills-map (36+ unique skills)
  - turknet exit=190, onboarding=206, pulse=2376
  - yapikredi exit=90, pulse=1476
  - parakende exit=93
"""
import os
import pytest
import requests

from pathlib import Path
_env = Path("/app/frontend/.env").read_text()
for _line in _env.splitlines():
    if _line.startswith("REACT_APP_BACKEND_URL="):
        os.environ["REACT_APP_BACKEND_URL"] = _line.split("=", 1)[1].strip()
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

TIMEOUT = 30


# ------------------ Skills Map ------------------
class TestSkillsMap:
    def test_turknet_skills_map_has_skills(self):
        r = requests.get(f"{API}/dashboard/skills-map", params={"tenant": "turknet"}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        print(f"turknet skills-map keys: {list(data.keys())}")
        total_unique = data.get("total_unique_skills", 0)
        all_skills = data.get("all_skills") or []
        heatmap_skills = data.get("heatmap_skills") or []
        dept_heatmap = data.get("department_heatmap") or []
        print(f"total_unique_skills={total_unique}, all_skills={len(all_skills)}, heatmap_skills={len(heatmap_skills)}, dept_heatmap_rows={len(dept_heatmap)}")
        assert total_unique >= 36, f"Expected >=36 unique skills, got {total_unique}"
        assert len(all_skills) > 0, "all_skills should not be empty"
        assert len(dept_heatmap) > 0, "department_heatmap should not be empty"


# ------------------ Survey Analytics ------------------
def _get_survey(tenant, survey_type):
    r = requests.get(
        f"{API}/dashboard/survey-analytics",
        params={"survey_type": survey_type, "tenant": tenant},
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, f"{tenant}/{survey_type}: {r.status_code} {r.text[:300]}"
    return r.json()


class TestTurknetSurveys:
    def test_exit_190(self):
        d = _get_survey("turknet", "exit")
        total = d.get("total_responses") or d.get("total") or d.get("count") or 0
        assert total == 190, f"Expected 190 exit responses, got {total}. Keys: {list(d.keys())}"

    def test_onboarding_206(self):
        d = _get_survey("turknet", "onboarding")
        total = d.get("total_responses") or d.get("total") or d.get("count") or 0
        assert total == 206, f"Expected 206 onboarding responses, got {total}"

    def test_pulse_2376(self):
        d = _get_survey("turknet", "pulse")
        total = d.get("total_responses") or d.get("total") or d.get("count") or 0
        assert total == 2376, f"Expected 2376 pulse responses, got {total}"

    def test_engagement_present(self):
        d = _get_survey("turknet", "engagement")
        total = d.get("total_responses") or d.get("total") or d.get("count") or 0
        assert total > 0, f"engagement total is {total}"


class TestYapikrediSurveys:
    def test_exit_90(self):
        d = _get_survey("yapikredi", "exit")
        total = d.get("total_responses") or d.get("total") or d.get("count") or 0
        assert total == 90, f"Expected 90, got {total}"

    def test_pulse_1476(self):
        d = _get_survey("yapikredi", "pulse")
        total = d.get("total_responses") or d.get("total") or d.get("count") or 0
        assert total == 1476, f"Expected 1476, got {total}"

    def test_onboarding_115(self):
        d = _get_survey("yapikredi", "onboarding")
        total = d.get("total_responses") or d.get("total") or d.get("count") or 0
        assert total == 115, f"Expected 115, got {total}"


class TestParakendeSurveys:
    def test_exit_93(self):
        d = _get_survey("parakende", "exit")
        total = d.get("total_responses") or d.get("total") or d.get("count") or 0
        assert total == 93, f"Expected 93, got {total}"

    def test_pulse_1458(self):
        d = _get_survey("parakende", "pulse")
        total = d.get("total_responses") or d.get("total") or d.get("count") or 0
        assert total == 1458, f"Expected 1458, got {total}"

    def test_onboarding_118(self):
        d = _get_survey("parakende", "onboarding")
        total = d.get("total_responses") or d.get("total") or d.get("count") or 0
        assert total == 118, f"Expected 118, got {total}"


# ------------------ Engagement / Learning / Career for TürkNet ------------------
class TestTurknetOtherDashboards:
    def test_engagement_dashboard(self):
        r = requests.get(f"{API}/dashboard/engagement", params={"tenant": "turknet"}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        print(f"turknet engagement keys: {list(d.keys())}")
        # Should have some non-zero data
        assert len(d) > 0

    def test_learning_dashboard(self):
        r = requests.get(f"{API}/dashboard/learning", params={"tenant": "turknet"}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        print(f"turknet learning keys: {list(d.keys())}")
        assert len(d) > 0

    def test_career_dashboard(self):
        r = requests.get(f"{API}/dashboard/career", params={"tenant": "turknet"}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        print(f"turknet career keys: {list(d.keys())}")
        assert len(d) > 0
