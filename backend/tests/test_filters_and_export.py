"""Backend regression tests for iteration 14:
   - /api/dashboard/segments returns departments + hrbps for yapikredi
   - Department & HRBP filter parameters are respected across dashboard endpoints
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://workforce-insights-15.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

EXPECTED_DEPTS = {
    "Kredi ve Risk", "Hazine", "Bireysel Bankacılık", "Kurumsal Bankacılık",
    "Şube Operasyonları", "Dijital Bankacılık", "Uyum ve Mevzuat",
    "Veri ve Analitik", "İnsan Kaynakları", "Operasyon ve Süreç",
}
EXPECTED_HRBPS = {"Ayşe Demir", "Elif Aydın", "Fatma Çelik", "Hasan Şahin", "Zeynep Arslan"}


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---------- Segments endpoint ----------
def test_segments_endpoint_yapikredi(s):
    r = s.get(f"{API}/dashboard/segments", params={"tenant": "yapikredi"})
    assert r.status_code == 200
    d = r.json()
    assert d["sector"] == "Bankacılık"
    assert set(d["departments"]) == EXPECTED_DEPTS
    assert set(d["hrbps"]) == EXPECTED_HRBPS
    assert d["segments"] == []


def test_segments_endpoint_parakende(s):
    r = s.get(f"{API}/dashboard/segments", params={"tenant": "parakende"})
    assert r.status_code == 200
    d = r.json()
    assert d["sector"] == "Perakende"
    assert len(d["departments"]) > 0
    assert len(d["hrbps"]) > 0


# ---------- Department filter ----------
def test_department_filter_narrows_headcount(s):
    r0 = s.get(f"{API}/dashboard/overview", params={"tenant": "yapikredi"})
    r1 = s.get(f"{API}/dashboard/overview", params={"tenant": "yapikredi", "department": "Hazine"})
    assert r0.status_code == 200 and r1.status_code == 200
    hc0 = r0.json()["kpis"]["headcount"]
    hc1 = r1.json()["kpis"]["headcount"]
    assert hc1 < hc0
    assert hc1 > 0


# ---------- HRBP filter ----------
def test_hrbp_filter_returns_data(s):
    r = s.get(f"{API}/dashboard/overview", params={"tenant": "yapikredi", "hrbp": "Ayşe Demir"})
    assert r.status_code == 200
    hc = r.json()["kpis"]["headcount"]
    assert hc > 0, "HRBP filter returned 0 headcount — employees likely missing 'hrbp' field. Re-seed tenant."


def test_hrbp_filter_narrows_data(s):
    r0 = s.get(f"{API}/dashboard/overview", params={"tenant": "yapikredi"})
    r1 = s.get(f"{API}/dashboard/overview", params={"tenant": "yapikredi", "hrbp": "Elif Aydın"})
    assert r1.json()["kpis"]["headcount"] < r0.json()["kpis"]["headcount"]


# ---------- Combined dept + hrbp on all major endpoints ----------
@pytest.mark.parametrize("endpoint", [
    "overview", "headcount", "hires", "turnover", "movement",
    "recruitment", "performance", "learning", "compensation",
    "norm-kadro", "ek-kadro", "teklif-analizi", "ucret-benchmark",
    "kaynak-analizi", "universite-analizi", "ise-alim-maliyet", "aday-hunisi",
])
def test_endpoint_accepts_dept_and_hrbp(s, endpoint):
    r = s.get(f"{API}/dashboard/{endpoint}", params={
        "tenant": "yapikredi", "department": "Hazine", "hrbp": "Elif Aydın",
    })
    assert r.status_code == 200, f"{endpoint} returned {r.status_code}: {r.text[:200]}"
