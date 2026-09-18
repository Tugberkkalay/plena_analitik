"""Iteration 23: Jolly Tur dashboards enrichment + Şube Haritası + Excel export tests."""
import os
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL")
            or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0]).rstrip("/")
TENANT = "jollytur"
YEAR = 2025


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": "admin@plenalitik.com", "password": "Plena2025!"})
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="session")
def headers(session):
    return session


def _get(path, headers, **params):
    params.setdefault("tenant", TENANT)
    return headers.get(f"{BASE_URL}{path}", params=params)


# ---------- Dashboards ----------

def _flatten(d):
    """Return dict of top-level + kpis merged."""
    out = dict(d)
    if isinstance(d.get("kpis"), dict):
        for k, v in d["kpis"].items():
            out.setdefault(k, v)
    return out


def test_overview(headers):
    r = _get("/api/dashboard/overview", headers, year=YEAR)
    assert r.status_code == 200, r.text
    d = _flatten(r.json())
    assert d.get("headcount") == 52, f"expected headcount=52, got {d.get('headcount')}"
    for k in ["hires", "leaves", "turnover_rate"]:
        assert k in d, f"missing key {k}"


def test_headcount(headers):
    r = _get("/api/dashboard/headcount", headers, year=YEAR)
    assert r.status_code == 200, r.text
    d = _flatten(r.json())
    assert d.get("headcount") == 52
    for k in ["female_leaders", "avg_age", "avg_seniority"]:
        assert k in d, f"missing {k}"


def test_recruitment(headers):
    r = _get("/api/dashboard/recruitment", headers, year=YEAR)
    assert r.status_code == 200, r.text
    d = _flatten(r.json())
    # total_applications may be top-level, in kpis, or derived from funnel
    total_apps = d.get("total_applications")
    hired = d.get("hired")
    funnel = d.get("funnel") or []
    if total_apps is None and funnel:
        applied_stage = next((s for s in funnel if str(s.get("stage", "")).lower() in ("applied", "başvuru", "basvuru")), None)
        if applied_stage:
            total_apps = applied_stage.get("count", 0)
    if hired is None and funnel:
        hired_stage = next((s for s in funnel if str(s.get("stage", "")).lower() in ("hired", "işe alınan", "ise alinan")), None)
        if hired_stage:
            hired = hired_stage.get("count", 0)
    assert (total_apps or 0) > 0, f"total_applications not >0; response keys: {list(d.keys())}"
    assert (hired or 0) > 0, f"hired not >0"
    assert "funnel" in d


def test_learning(headers):
    r = _get("/api/dashboard/learning", headers, year=YEAR)
    assert r.status_code == 200, r.text
    d = _flatten(r.json())
    assert d.get("total_hours", 0) > 1000, f"got {d.get('total_hours')}"
    assert "completion_rate" in d


def test_engagement(headers):
    r = _get("/api/dashboard/engagement", headers, year=YEAR)
    assert r.status_code == 200, r.text
    d = _flatten(r.json())
    for k in ["avg_engagement", "enps", "total_surveys"]:
        assert k in d, f"missing {k}"
    assert d.get("total_surveys") == 51, f"got {d.get('total_surveys')}"


def test_skills_map(headers):
    r = _get("/api/dashboard/skills-map", headers, year=YEAR)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("total_unique_skills") == 18, f"got {d.get('total_unique_skills')}"
    assert "skill_gaps" in d
    assert "department_heatmap" in d


def test_internal_mobility(headers):
    r = _get("/api/dashboard/internal-mobility", headers, year=YEAR)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "department_needs" in d


def test_career(headers):
    r = _get("/api/dashboard/career", headers, year=YEAR)
    assert r.status_code == 200, r.text
    d = r.json()
    kpis = d.get("kpis") or d
    for k in ["talent_pool", "manager_count", "succession_coverage"]:
        assert k in kpis, f"missing {k} in kpis: {list(kpis.keys())}"


def test_segments(headers):
    r = _get("/api/dashboard/segments", headers)
    assert r.status_code == 200, r.text
    d = r.json()
    depts = d.get("departments") or []
    hrbps = d.get("hrbps") or []
    dept_names = " ".join([str(x) for x in depts])
    hrbp_names = " ".join([str(x) for x in hrbps])
    assert any(name in dept_names for name in ["Kadıköy", "Alsancak"]), f"depts={depts}"
    assert any(name in hrbp_names for name in ["Seda", "Mert", "Ayşe", "Kerem"]), f"hrbps={hrbps}"


# ---------- Şube Haritası ----------

def test_harita(headers):
    r = headers.get(f"{BASE_URL}/api/jolly/harita", params={"tenant": TENANT})
    assert r.status_code == 200, r.text
    d = r.json()
    bolgeler = d.get("bolgeler") or []
    subeler = d.get("subeler") or []
    assert len(bolgeler) == 5, f"got {len(bolgeler)} bolgeler"
    assert len(subeler) == 12, f"got {len(subeler)} subeler"
    # Each region has iller
    assert all("iller" in b for b in bolgeler)
    # Each branch has lat/lng
    assert all(("lat" in s or "latitude" in s) and ("lng" in s or "lon" in s or "longitude" in s)
               for s in subeler), f"branch sample: {subeler[0]}"
