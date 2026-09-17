"""Iteration 17 — Test TUSAŞ enrichment (skills, engagement, training, mentors)
and expanded Report Designer (5 data sources, 24 KPI templates).
"""
import os
import re
import pytest
import requests
from pathlib import Path

# Load BASE_URL from frontend/.env
def _load_base_url():
    env_url = os.environ.get("REACT_APP_BACKEND_URL")
    if env_url:
        return env_url.rstrip("/")
    env_path = Path("/app/frontend/.env")
    if env_path.exists():
        m = re.search(r"REACT_APP_BACKEND_URL=(.+)", env_path.read_text())
        if m:
            return m.group(1).strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not set")

BASE_URL = _load_base_url()
TENANT = "tusas"
ADMIN_EMAIL = "admin@plenalitik.com"
ADMIN_PASS = "Plena2025!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    # Login
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
               timeout=15)
    if r.status_code == 200:
        data = r.json()
        token = data.get("access_token") or data.get("token")
        if token:
            s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# ---------- Skills-map ----------
def test_skills_map_has_76_unique(session):
    r = session.get(f"{BASE_URL}/api/dashboard/skills-map", params={"tenant": TENANT}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    # find unique skills count in structure
    txt = str(data)
    print("skills-map keys:", list(data.keys()) if isinstance(data, dict) else type(data))
    # look for kpis
    kpis = data.get("kpis") if isinstance(data, dict) else None
    print("skills-map kpis:", kpis)
    # Assert 76 appears somewhere
    unique = None
    if kpis:
        for k, v in kpis.items():
            if "unique" in k.lower() or "benzersiz" in k.lower():
                unique = v
                break
    assert unique == 76 or "76" in txt, f"expected 76 unique skills, got kpis={kpis}"


# ---------- Engagement ----------
def test_engagement_kpis(session):
    r = session.get(f"{BASE_URL}/api/dashboard/engagement", params={"tenant": TENANT}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    print("engagement keys:", list(data.keys()) if isinstance(data, dict) else type(data))
    kpis = data.get("kpis", {}) if isinstance(data, dict) else {}
    print("engagement kpis:", kpis)
    # Expected: avg=6.7, eNPS=20.6, surveys=2065, participation=92.5%
    joined = str(kpis) + str(data)
    assert "2065" in joined, f"expected 2065 surveys in response"
    # avg score around 6.7
    assert any("6.7" in str(v) or (isinstance(v, (int, float)) and 6.0 <= v <= 7.5) for v in kpis.values()) or "6.7" in joined


# ---------- Learning / Training ----------
def test_learning_kpis(session):
    r = session.get(f"{BASE_URL}/api/dashboard/learning", params={"tenant": TENANT}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    print("learning keys:", list(data.keys()) if isinstance(data, dict) else type(data))
    kpis = data.get("kpis", {}) if isinstance(data, dict) else {}
    print("learning kpis:", kpis)
    joined = str(kpis) + str(data)[:2000]
    assert "3595" in joined, "expected 3595 training programs"
    assert "91920" in joined or "91,920" in joined, "expected 91920 hours"


# ---------- Career ----------
def test_career_kpis(session):
    r = session.get(f"{BASE_URL}/api/dashboard/career", params={"tenant": TENANT}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    kpis = data.get("kpis", {}) if isinstance(data, dict) else {}
    print("career kpis:", kpis)
    joined = str(data)[:3000]
    assert "524" in joined, "expected talent_pool=524"


# ---------- Succession ----------
def test_succession_kpis(session):
    r = session.get(f"{BASE_URL}/api/dashboard/succession", params={"tenant": TENANT}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    kpis = data.get("kpis", {}) if isinstance(data, dict) else {}
    print("succession kpis:", kpis)
    joined = str(data)[:3000]
    assert "109" in joined, "expected 109 critical roles"


# ---------- Burnout ----------
def test_burnout_returns_data(session):
    r = session.get(f"{BASE_URL}/api/dashboard/burnout", params={"tenant": TENANT}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    print("burnout keys:", list(data.keys()) if isinstance(data, dict) else type(data))
    kpis = data.get("kpis", {}) if isinstance(data, dict) else {}
    print("burnout kpis:", kpis)
    assert kpis or data.get("departments") or data.get("department_breakdown"), \
        "burnout should return kpis or department data"


# ---------- Report Designer ----------
def test_report_designer_data_sources(session):
    r = session.get(f"{BASE_URL}/api/report-designer/data-sources", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    sources = data.get("data_sources", {}) if isinstance(data, dict) else {}
    if isinstance(sources, dict):
        ids = list(sources.keys())
    else:
        ids = [str(s.get("id") or s.get("key") or s.get("name")) for s in sources]
    print("data sources:", ids)
    assert len(ids) >= 5, f"expected >=5 data sources, got {len(ids)}"
    joined = " ".join(str(x).lower() for x in ids)
    for expected in ["employee", "recruit", "talent", "engagement", "training"]:
        assert expected in joined, f"missing data source containing '{expected}' in {ids}"


def test_report_designer_kpi_templates(session):
    r = session.get(f"{BASE_URL}/api/report-designer/kpi-templates", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    templates = data if isinstance(data, list) else data.get("templates") or data.get("kpi_templates") or []
    print("kpi templates count:", len(templates))
    assert len(templates) >= 24, f"expected >=24 templates, got {len(templates)}"
    categories = {str(t.get("category", "")).lower() for t in templates}
    print("categories:", categories)
    joined = " ".join(categories)
    assert "bağlılık" in joined or "baglilik" in joined or "engagement" in joined, \
        f"missing engagement/bağlılık category. cats={categories}"
    assert "eğitim" in joined or "egitim" in joined or "training" in joined, \
        f"missing training/eğitim category"


def test_execute_preview_engagement(session):
    payload = {
        "name": "TEST_engagement_preview",
        "data_source": "engagement",
        "chart_type": "table",
        "dimensions": [],
        "measures": [],
        "filters": [],
        "kpi_ids": []
    }
    r = session.post(f"{BASE_URL}/api/report-designer/execute-preview",
                     params={"tenant": TENANT}, json=payload, timeout=30)
    print("engagement preview status:", r.status_code)
    print("engagement preview body:", r.text[:800])
    assert r.status_code == 200, r.text


def test_execute_preview_training(session):
    payload = {
        "name": "TEST_training_preview",
        "data_source": "training",
        "chart_type": "table",
        "dimensions": [],
        "measures": [],
        "filters": [],
        "kpi_ids": []
    }
    r = session.post(f"{BASE_URL}/api/report-designer/execute-preview",
                     params={"tenant": TENANT}, json=payload, timeout=30)
    print("training preview status:", r.status_code)
    print("training preview body:", r.text[:800])
    assert r.status_code == 200, r.text
