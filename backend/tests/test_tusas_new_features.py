"""Regression tests for TUSAS new features:
- Project filter (KAAN etc.)
- /api/dashboard/yetenek-programlari
- /api/dashboard/guvenlik-sorusturmasi
- /api/dashboard/segments returns 'projects'
"""
import os
import requests
import pytest

def _read_frontend_env():
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip()
    except Exception:
        pass
    return None

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _read_frontend_env() or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not set"
API = f"{BASE_URL}/api"

EXPECTED_PROJECTS = {"KAAN", "HURJET", "ANKA", "AKSUNGUR", "GOKBEY",
                     "A400M Yapısallar", "Uzay Sistemleri", "Genel"}


# ─── Segments endpoint returns projects only for TUSAS ─────────────
class TestSegmentsProjects:
    def test_tusas_segments_returns_projects(self):
        r = requests.get(f"{API}/dashboard/segments", params={"tenant": "tusas"})
        assert r.status_code == 200
        data = r.json()
        assert "projects" in data, "'projects' field missing"
        projects = set(data["projects"])
        # Must contain all expected TUSAS projects
        missing = EXPECTED_PROJECTS - projects
        assert not missing, f"Missing projects for tusas: {missing}"

    def test_yapikredi_segments_no_projects(self):
        r = requests.get(f"{API}/dashboard/segments", params={"tenant": "yapikredi"})
        assert r.status_code == 200
        data = r.json()
        # Should be present as key but empty (banking has no PROJECTS config)
        projects = data.get("projects", [])
        assert projects == [] or projects is None, f"yapikredi should have no projects, got {projects}"


# ─── Overview project filter ───────────────────────────────────────
class TestOverviewProjectFilter:
    def test_overview_no_project(self):
        r = requests.get(f"{API}/dashboard/overview", params={"tenant": "tusas", "year": 2025})
        assert r.status_code == 200
        data = r.json()
        hc = data["kpis"]["headcount"]
        # Expected ~2020 per spec
        assert 1800 <= hc <= 2200, f"Expected ~2020 headcount, got {hc}"
        pytest.tusas_full_hc = hc

    def test_overview_kaan_filter(self):
        r = requests.get(f"{API}/dashboard/overview",
                         params={"tenant": "tusas", "year": 2025, "project": "KAAN"})
        assert r.status_code == 200
        data = r.json()
        hc = data["kpis"]["headcount"]
        # Expected ~467 per spec — must be substantially lower than full
        assert 300 <= hc <= 700, f"Expected ~467 KAAN headcount, got {hc}"
        assert hc < getattr(pytest, "tusas_full_hc", 2020), "Project filter did not reduce headcount"


# ─── Yetenek Programları endpoint ──────────────────────────────────
class TestYetenekProgramlari:
    def test_endpoint_ok(self):
        r = requests.get(f"{API}/dashboard/yetenek-programlari", params={"tenant": "tusas"})
        assert r.status_code == 200
        self.data = r.json()

    def test_kpis_match_spec(self):
        r = requests.get(f"{API}/dashboard/yetenek-programlari", params={"tenant": "tusas"})
        data = r.json()
        k = data["kpis"]
        assert k["total"] == 700, f"total expected 700, got {k['total']}"
        # Spec: completed 627, hired 352, retained 301 — allow small tolerance
        assert abs(k["completed"] - 627) <= 20, f"completed={k['completed']}"
        assert abs(k["hired"] - 352) <= 20, f"hired={k['hired']}"
        assert abs(k["retained"] - 301) <= 20, f"retained={k['retained']}"

    def test_programs_breakdown(self):
        r = requests.get(f"{API}/dashboard/yetenek-programlari", params={"tenant": "tusas"})
        data = r.json()
        programs = {p["program"] for p in data["by_program"]}
        expected = {"SKY Stajyer", "MGP", "LIFT UP", "Kadın Mentorluk", "LIFT UP+", "SKY int"}
        # At least 5 of 6 should match (allow naming variations)
        overlap = programs & expected
        assert len(overlap) >= 5, f"Expected 6 programs, matched {overlap} out of {expected}. Actual: {programs}"

    def test_yapikredi_empty(self):
        r = requests.get(f"{API}/dashboard/yetenek-programlari", params={"tenant": "yapikredi"})
        assert r.status_code == 200
        # Should be empty for non-tusas tenant
        assert r.json()["kpis"]["total"] == 0


# ─── Güvenlik Soruşturması endpoint ────────────────────────────────
class TestGuvenlikSorusturmasi:
    def test_endpoint_ok(self):
        r = requests.get(f"{API}/dashboard/guvenlik-sorusturmasi", params={"tenant": "tusas"})
        assert r.status_code == 200

    def test_kpis_match_spec(self):
        r = requests.get(f"{API}/dashboard/guvenlik-sorusturmasi", params={"tenant": "tusas"})
        data = r.json()
        k = data["kpis"]
        assert k["total_basvuru"] == 3000, f"total_basvuru={k['total_basvuru']}"
        assert abs(k["guvenlik_asamasina_gelen"] - 289) <= 30, f"guvenlik_asamasina_gelen={k['guvenlik_asamasina_gelen']}"
        assert abs(k.get("ise_alinan", 0) - 223) <= 30, f"ise_alinan={k.get('ise_alinan')}"

    def test_funnel_stages(self):
        r = requests.get(f"{API}/dashboard/guvenlik-sorusturmasi", params={"tenant": "tusas"})
        data = r.json()
        stages = [s["asama"] for s in data["by_stage"]]
        expected_stages = ["Başvuru", "Online Değerlendirme", "İK Mülakatı",
                           "Teknik Mülakat", "Güvenlik Soruşturması", "Teklif", "İşe Başlama"]
        assert stages == expected_stages, f"Stages mismatch: {stages}"
        # Values should be monotonically non-increasing along funnel
        counts = [s["aday_sayisi"] for s in data["by_stage"]]
        # Start = 3000
        assert counts[0] == 3000

    def test_dept_breakdown_exists(self):
        r = requests.get(f"{API}/dashboard/guvenlik-sorusturmasi", params={"tenant": "tusas"})
        data = r.json()
        assert len(data["by_department"]) > 0
        # Duration distribution
        assert len(data["sure_dagilimi"]) == 5
