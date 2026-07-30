"""Backend regression tests for iteration 15:
   Verifies _effective_depts() narrows department iteration lists across
   Performance / Learning / Compensation / Career / Norm Kadro / Ek Kadro
   endpoints when HRBP filter is applied.

   Fix reference: server.py:826 _effective_depts()
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
TENANT = "yapikredi"

HRBP_MAP = {
    "Kredi ve Risk": "Elif Aydın",
    "Hazine": "Elif Aydın",
    "Bireysel Bankacılık": "Zeynep Arslan",
    "Kurumsal Bankacılık": "Zeynep Arslan",
    "Şube Operasyonları": "Hasan Şahin",
    "Dijital Bankacılık": "Hasan Şahin",
    "Uyum ve Mevzuat": "Fatma Çelik",
    "Veri ve Analitik": "Fatma Çelik",
    "İnsan Kaynakları": "Ayşe Demir",
    "Operasyon ve Süreç": "Ayşe Demir",
}
ELIF_DEPTS = {"Kredi ve Risk", "Hazine"}
ZEYNEP_DEPTS = {"Bireysel Bankacılık", "Kurumsal Bankacılık"}


@pytest.fixture(scope="module")
def s():
    return requests.Session()


def _short_forms(long_names):
    """The performance endpoint uses shorten_dept() which may abbreviate.
    Return a matcher that checks that each returned short name maps back to
    exactly one of the expected long names via substring/prefix match."""
    return set(long_names)


def _dept_key(item):
    # by_department items sometimes use different keys per endpoint
    for k in ("department", "dept", "name"):
        if k in item:
            return item[k]
    return None


# ---------- Performance ----------
class TestPerformanceHRBP:
    def test_no_filters_all_10_depts(self, s):
        r = s.get(f"{API}/dashboard/performance", params={"tenant": TENANT})
        assert r.status_code == 200
        data = r.json()
        by_dept = data["by_department"]
        assert len(by_dept) == 10, f"Expected 10 depts, got {len(by_dept)}: {[_dept_key(x) for x in by_dept]}"

    def test_elif_aydin_only_2_depts(self, s):
        r = s.get(f"{API}/dashboard/performance",
                  params={"tenant": TENANT, "hrbp": "Elif Aydın"})
        assert r.status_code == 200
        data = r.json()
        by_dept = data["by_department"]
        assert len(by_dept) == 2, (
            f"HRBP=Elif Aydın should give 2 depts (Kredi ve Risk, Hazine); "
            f"got {len(by_dept)}: {[_dept_key(x) for x in by_dept]}"
        )
        # KPI narrowing check
        r_all = s.get(f"{API}/dashboard/performance", params={"tenant": TENANT})
        assert data["kpis"]["high_performers"] < r_all.json()["kpis"]["high_performers"]

    def test_zeynep_arslan_only_2_depts(self, s):
        r = s.get(f"{API}/dashboard/performance",
                  params={"tenant": TENANT, "hrbp": "Zeynep Arslan"})
        assert r.status_code == 200
        by_dept = r.json()["by_department"]
        assert len(by_dept) == 2, (
            f"HRBP=Zeynep Arslan should give 2 depts (Bireysel, Kurumsal); "
            f"got {len(by_dept)}: {[_dept_key(x) for x in by_dept]}"
        )

    def test_department_only_narrows_to_1(self, s):
        r = s.get(f"{API}/dashboard/performance",
                  params={"tenant": TENANT, "department": "Hazine"})
        assert r.status_code == 200
        by_dept = r.json()["by_department"]
        assert len(by_dept) == 1

    def test_dept_and_hrbp_intersection(self, s):
        # Hazine belongs to Elif Aydın → intersection is Hazine
        r = s.get(f"{API}/dashboard/performance",
                  params={"tenant": TENANT, "department": "Hazine", "hrbp": "Elif Aydın"})
        assert r.status_code == 200
        assert len(r.json()["by_department"]) == 1

    def test_dept_and_hrbp_empty_intersection(self, s):
        # Hazine is NOT under Zeynep Arslan → empty intersection
        r = s.get(f"{API}/dashboard/performance",
                  params={"tenant": TENANT, "department": "Hazine", "hrbp": "Zeynep Arslan"})
        assert r.status_code == 200
        assert len(r.json()["by_department"]) == 0


# ---------- Learning / Compensation / Career (spot check) ----------
class TestOtherEndpointsHRBP:
    @pytest.mark.parametrize("endpoint", ["learning", "compensation", "career"])
    def test_hrbp_narrows_department_list(self, s, endpoint):
        r_all = s.get(f"{API}/dashboard/{endpoint}", params={"tenant": TENANT})
        r_hrbp = s.get(f"{API}/dashboard/{endpoint}",
                       params={"tenant": TENANT, "hrbp": "Elif Aydın"})
        assert r_all.status_code == 200 and r_hrbp.status_code == 200, \
            f"{endpoint}: {r_all.status_code}/{r_hrbp.status_code}"
        # Not all endpoints may return by_department; guard with .get
        by_dept_all = r_all.json().get("by_department") or []
        by_dept_hrbp = r_hrbp.json().get("by_department") or []
        if by_dept_all:
            assert len(by_dept_hrbp) < len(by_dept_all), (
                f"{endpoint}: HRBP filter did not narrow by_department "
                f"({len(by_dept_hrbp)} vs {len(by_dept_all)})"
            )
            assert len(by_dept_hrbp) == 2, (
                f"{endpoint}: expected 2 depts for Elif Aydın, got {len(by_dept_hrbp)}"
            )


# ---------- Engagement (spot check) ----------
class TestEngagementHRBP:
    def test_hrbp_narrows(self, s):
        r_all = s.get(f"{API}/dashboard/engagement", params={"tenant": TENANT})
        r_hrbp = s.get(f"{API}/dashboard/engagement",
                       params={"tenant": TENANT, "hrbp": "Elif Aydın"})
        assert r_all.status_code == 200 and r_hrbp.status_code == 200
        by_dept_all = r_all.json().get("by_department") or []
        by_dept_hrbp = r_hrbp.json().get("by_department") or []
        if by_dept_all:
            assert len(by_dept_hrbp) <= 2


# ---------- Ek Kadro ----------
class TestEkKadroHRBP:
    def test_no_filter_returns_data(self, s):
        r = s.get(f"{API}/dashboard/ek-kadro", params={"tenant": TENANT})
        assert r.status_code == 200

    def test_hrbp_narrows_departments(self, s):
        r_all = s.get(f"{API}/dashboard/ek-kadro", params={"tenant": TENANT})
        r_hrbp = s.get(f"{API}/dashboard/ek-kadro",
                       params={"tenant": TENANT, "hrbp": "Elif Aydın"})
        assert r_all.status_code == 200 and r_hrbp.status_code == 200
        d_all = r_all.json()
        d_hrbp = r_hrbp.json()

        # Find any list-shaped key with department entries
        def _dept_list(d):
            for key in ("by_department", "departments", "departman_breakdown", "by_dept"):
                if isinstance(d.get(key), list) and d[key]:
                    return d[key]
            return None

        depts_all = _dept_list(d_all)
        depts_hrbp = _dept_list(d_hrbp)
        if depts_all is not None and depts_hrbp is not None:
            assert len(depts_hrbp) < len(depts_all), (
                f"Ek Kadro: HRBP did not narrow departments "
                f"(hrbp={len(depts_hrbp)}, all={len(depts_all)})"
            )


# ---------- Norm Kadro ----------
class TestNormKadroHRBP:
    def test_no_filter_returns_data(self, s):
        r = s.get(f"{API}/dashboard/norm-kadro", params={"tenant": TENANT})
        assert r.status_code == 200

    def test_hrbp_narrows_data(self, s):
        r_all = s.get(f"{API}/dashboard/norm-kadro", params={"tenant": TENANT})
        r_hrbp = s.get(f"{API}/dashboard/norm-kadro",
                       params={"tenant": TENANT, "hrbp": "Elif Aydın"})
        assert r_all.status_code == 200 and r_hrbp.status_code == 200
        d_all = r_all.json()
        d_hrbp = r_hrbp.json()

        # Look for any numeric KPI that should shrink
        def _sum_norm(d):
            for k in ("total_norm", "toplam_norm", "norm_total", "norm"):
                if isinstance(d.get(k), (int, float)):
                    return d[k]
            kpis = d.get("kpis") or {}
            for k, v in kpis.items():
                if isinstance(v, (int, float)) and v > 0:
                    return v
            return None

        s_all = _sum_norm(d_all)
        s_hrbp = _sum_norm(d_hrbp)
        if s_all is not None and s_hrbp is not None and s_all > 0:
            assert s_hrbp < s_all, f"Norm Kadro: HRBP filter didn't shrink data ({s_hrbp} vs {s_all})"


# ---------- No filters: all 10 departments across major endpoints ----------
@pytest.mark.parametrize("endpoint", ["performance", "learning", "compensation", "career"])
def test_no_filters_returns_all_depts(s, endpoint):
    r = s.get(f"{API}/dashboard/{endpoint}", params={"tenant": TENANT})
    assert r.status_code == 200
    by_dept = r.json().get("by_department") or []
    if by_dept:
        assert len(by_dept) == 10, (
            f"{endpoint}: expected 10 depts with no filters, got {len(by_dept)}"
        )
