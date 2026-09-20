"""
Tests for the new segment filter feature on Perakende (retail) tenant.

Validates:
  * GET /api/dashboard/segments returns 3 segments for Perakende, empty for Banking.
  * GET /api/dashboard/overview filters department distribution per segment.
  * Other dashboard endpoints accept the `segment` query parameter without
    errors and either reduce or keep the data within the segment's scope.
  * Banking tenant (yapikredi) keeps working unchanged.
"""
import os
import urllib.parse
import pytest
import requests

BASE_URL = os.environ.get("VITE_BACKEND_URL", "http://localhost:8000").rstrip("/")
if not BASE_URL:
    # Read directly from frontend/.env if env var not propagated
    with open("/app/frontend/.env") as fh:
        for line in fh:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASS = os.environ["ADMIN_PASSWORD"]
RETAIL_TENANT = "parakende"
BANKING_TENANT = "yapikredi"

SEG_RETAIL = "Mağaza / Perakende"
SEG_PROD = "Üretim"
SEG_HQ = "Merkez Ofis"

RETAIL_DEPTS_BY_SEG = {
    SEG_RETAIL: {"Mağaza Satış", "Görsel Düzenleme", "Perakende Operasyon"},
    SEG_PROD: {"Üretim", "Kalite Kontrol", "Bakım ve Teknik"},
    SEG_HQ: {"Tasarım ve Ar-Ge", "Kategori Yönetimi", "İK ve Destek", "Dijital ve E-ticaret"},
}


# ─────────────── Fixtures ───────────────
@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
               timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return s


def _seg_param(seg):
    return urllib.parse.quote(seg, safe="")


# ─────────────── /dashboard/segments ───────────────
class TestSegmentsEndpoint:
    def test_perakende_returns_three_segments(self, client):
        r = client.get(f"{BASE_URL}/api/dashboard/segments",
                       params={"tenant": RETAIL_TENANT}, timeout=15)
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert data.get("sector") == "Perakende"
        assert set(data.get("segments", [])) == {SEG_RETAIL, SEG_PROD, SEG_HQ}

    def test_banking_returns_no_segments(self, client):
        r = client.get(f"{BASE_URL}/api/dashboard/segments",
                       params={"tenant": BANKING_TENANT}, timeout=15)
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        assert data.get("sector") == "Bankacılık"
        assert data.get("segments") == []


# ─────────────── Dashboard overview department filtering ───────────────
class TestOverviewSegmentFilter:
    @pytest.fixture(scope="class")
    def baseline(self, client):
        r = client.get(f"{BASE_URL}/api/dashboard/overview",
                       params={"tenant": RETAIL_TENANT, "year": 2025}, timeout=20)
        assert r.status_code == 200, r.text[:200]
        return r.json()

    def test_baseline_has_all_retail_depts(self, baseline):
        depts = {d["name"] for d in baseline.get("department_distribution", [])}
        # All 3 segments' departments should be present in unfiltered view.
        for seg_depts in RETAIL_DEPTS_BY_SEG.values():
            # at least one dept from each segment present
            assert seg_depts & depts, f"Missing depts for segment: {seg_depts}"
        assert baseline["kpis"]["headcount"] > 0

    @pytest.mark.parametrize("segment", [SEG_RETAIL, SEG_PROD, SEG_HQ])
    def test_segment_filters_departments(self, client, baseline, segment):
        r = client.get(
            f"{BASE_URL}/api/dashboard/overview?tenant={RETAIL_TENANT}"
            f"&year=2025&segment={_seg_param(segment)}",
            timeout=20,
        )
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        expected = RETAIL_DEPTS_BY_SEG[segment]
        depts = {d["name"] for d in data.get("department_distribution", [])}
        # Every dept in the filtered response must be within the segment's allowed set
        leaked = depts - expected
        assert not leaked, f"Segment {segment} leaked depts: {leaked}"
        # Headcount must be lower than baseline (segment is a subset of all)
        assert 0 < data["kpis"]["headcount"] < baseline["kpis"]["headcount"]


# ─────────────── Multiple endpoints accept segment param ───────────────
SEGMENTED_ENDPOINTS = [
    "/api/dashboard/overview",
    "/api/dashboard/headcount",
    "/api/dashboard/turnover",
    "/api/dashboard/movement",
    "/api/dashboard/performance",
    "/api/dashboard/learning",
    "/api/dashboard/compensation",
    "/api/dashboard/engagement",
    "/api/dashboard/career",
    "/api/dashboard/hr-operations",
    "/api/dashboard/internal-mobility",
]


class TestEndpointsAcceptSegment:
    @pytest.mark.parametrize("endpoint", SEGMENTED_ENDPOINTS)
    def test_endpoint_accepts_segment(self, client, endpoint):
        url = (f"{BASE_URL}{endpoint}?tenant={RETAIL_TENANT}"
               f"&year=2025&segment={_seg_param(SEG_PROD)}")
        r = client.get(url, timeout=25)
        assert r.status_code == 200, f"{endpoint} -> {r.status_code} {r.text[:200]}"
        # Make sure body parses
        assert isinstance(r.json(), (dict, list))


# ─────────────── skills-map-v2 segment behaviour ───────────────
class TestSkillsMapSegment:
    def test_skills_map_v2_uretim_segment_smaller(self, client):
        r_all = client.get(
            f"{BASE_URL}/api/dashboard/skills-map-v2?tenant={RETAIL_TENANT}",
            timeout=25,
        )
        r_seg = client.get(
            f"{BASE_URL}/api/dashboard/skills-map-v2?tenant={RETAIL_TENANT}"
            f"&segment={_seg_param(SEG_PROD)}",
            timeout=25,
        )
        assert r_all.status_code == 200 and r_seg.status_code == 200, \
            f"{r_all.status_code}/{r_seg.status_code} - {r_all.text[:150]} | {r_seg.text[:150]}"
        all_data = r_all.json()
        seg_data = r_seg.json()
        # Heuristic: number of tracked skills/employees for a single segment
        # should not exceed the all-segments view.
        def _size(d):
            for key in ("skills", "skill_distribution", "tracked_skills",
                        "department_skills", "skills_by_dept"):
                v = d.get(key) if isinstance(d, dict) else None
                if isinstance(v, list):
                    return len(v)
            return None
        s_all = _size(all_data)
        s_seg = _size(seg_data)
        if s_all is not None and s_seg is not None:
            assert s_seg <= s_all, f"Segment view ({s_seg}) larger than all-view ({s_all})"


# ─────────────── Banking regression ───────────────
class TestBankingRegression:
    def test_banking_overview_works_without_segment(self, client):
        r = client.get(
            f"{BASE_URL}/api/dashboard/overview?tenant={BANKING_TENANT}&year=2025",
            timeout=20,
        )
        assert r.status_code == 200, r.text[:200]
        data = r.json()
        depts = {d["name"] for d in data.get("department_distribution", [])}
        # No retail dept must appear
        all_retail = set().union(*RETAIL_DEPTS_BY_SEG.values())
        assert not (depts & all_retail), f"Retail depts leaked into banking: {depts & all_retail}"
        assert data["kpis"]["headcount"] > 0

    def test_banking_with_ignored_segment_param(self, client):
        # Banking has no segments -> passing one should either be ignored
        # (return same data) or return an empty result, but never crash.
        r = client.get(
            f"{BASE_URL}/api/dashboard/overview?tenant={BANKING_TENANT}"
            f"&year=2025&segment={_seg_param(SEG_RETAIL)}",
            timeout=20,
        )
        assert r.status_code == 200, r.text[:200]
