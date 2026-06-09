"""Backend tests for HRlytic - planning modules and seed data realism."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://workforce-insights-15.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Sanity / regression ----
class TestExistingEndpoints:
    @pytest.mark.parametrize("path", [
        "/dashboard/overview",
        "/dashboard/headcount",
        "/dashboard/turnover",
        "/dashboard/recruitment",
        "/dashboard/performance",
        "/dashboard/hires",
        "/dashboard/leaves",
        "/dashboard/movement",
    ])
    def test_existing_dashboards(self, client, path):
        r = client.get(f"{API}{path}?year=2025", timeout=30)
        assert r.status_code == 200, f"{path} returned {r.status_code}: {r.text[:200]}"
        data = r.json()
        assert isinstance(data, dict)


# ---- Seed data realism ----
class TestSeedDataRealism:
    def test_turnover_rate_realistic(self, client):
        r = client.get(f"{API}/dashboard/turnover?year=2025", timeout=30)
        assert r.status_code == 200
        data = r.json()
        # Get the headline turnover rate from kpis (try common key names)
        kpis = data.get("kpis", {})
        rate = kpis.get("turnover_rate") or kpis.get("annual_turnover") or kpis.get("turnover")
        if rate is None:
            # fallback: dig elsewhere
            rate = data.get("turnover_rate")
        assert rate is not None, f"No turnover_rate key found in: {list(kpis.keys())}"
        # Should NOT be 0% or 100%
        assert 0 < float(rate) < 100, f"Turnover rate unrealistic: {rate}"

    def test_leaving_reasons_varied(self, client):
        r = client.get(f"{API}/dashboard/turnover?year=2025", timeout=30)
        assert r.status_code == 200
        data = r.json()
        # find leaving reasons distribution
        reasons = data.get("leaving_reasons") or data.get("reasons") or data.get("exit_reasons")
        if reasons is None:
            # search nested
            for v in data.values():
                if isinstance(v, list) and v and isinstance(v[0], dict) and ("reason" in v[0] or "name" in v[0]):
                    reasons = v
                    break
        assert reasons, "No leaving reasons data found"
        # must have at least 3 distinct reasons with > 0 count
        non_zero = [r for r in reasons if (r.get("count", r.get("value", 0)) or 0) > 0]
        assert len(non_zero) >= 3, f"Reasons not varied: {reasons}"


# ---- New: Headcount Plan ----
class TestHeadcountPlan:
    def test_returns_200(self, client):
        r = client.get(f"{API}/dashboard/headcount-plan?year=2025", timeout=30)
        assert r.status_code == 200, r.text[:300]

    def test_kpi_structure(self, client):
        data = client.get(f"{API}/dashboard/headcount-plan?year=2025", timeout=30).json()
        kpis = data["kpis"]
        for key in ["total_headcount", "target_headcount", "total_gap", "fill_rate"]:
            assert key in kpis, f"Missing KPI: {key}"
        assert isinstance(kpis["total_headcount"], int)
        assert kpis["target_headcount"] > 0
        assert 0 <= kpis["fill_rate"] <= 200

    def test_department_plan_and_critical_gaps(self, client):
        data = client.get(f"{API}/dashboard/headcount-plan?year=2025", timeout=30).json()
        assert isinstance(data["department_plan"], list) and len(data["department_plan"]) >= 5
        sample = data["department_plan"][0]
        for k in ["department", "current", "target", "gap", "fill_rate", "status"]:
            assert k in sample
        assert isinstance(data["critical_gaps"], list)
        assert isinstance(data["monthly_hiring_plan"], list)
        assert len(data["monthly_hiring_plan"]) == 12


# ---- New: Workforce Alignment ----
class TestWorkforceAlignment:
    def test_returns_200_and_objectives(self, client):
        r = client.get(f"{API}/dashboard/workforce-alignment?year=2025", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert "kpis" in data
        assert len(data["objectives"]) == 5

    def test_kpis_and_objective_shape(self, client):
        data = client.get(f"{API}/dashboard/workforce-alignment?year=2025", timeout=30).json()
        for k in ["total_objectives", "overall_readiness", "critical_count", "on_track", "total_skill_gaps"]:
            assert k in data["kpis"], f"Missing KPI: {k}"
        obj = data["objectives"][0]
        for k in ["id", "name", "description", "priority", "skill_coverage",
                  "hc_fulfillment", "skill_fulfillment", "overall_readiness", "status"]:
            assert k in obj, f"Missing objective field: {k}"
        assert isinstance(obj["skill_coverage"], list)
        if obj["skill_coverage"]:
            sc = obj["skill_coverage"][0]
            for k in ["skill", "holders", "avg_proficiency", "experts", "status"]:
                assert k in sc

    def test_status_values_valid(self, client):
        data = client.get(f"{API}/dashboard/workforce-alignment?year=2025", timeout=30).json()
        for o in data["objectives"]:
            assert o["status"] in ["On Track", "At Risk", "Critical"]
            for sc in o["skill_coverage"]:
                assert sc["status"] in ["Strong", "Adequate", "Gap"]


# ---- New: Org Health ----
class TestOrgHealth:
    def test_returns_200(self, client):
        r = client.get(f"{API}/dashboard/org-health?year=2025", timeout=30)
        assert r.status_code == 200, r.text[:300]

    def test_kpi_structure(self, client):
        data = client.get(f"{API}/dashboard/org-health?year=2025", timeout=30).json()
        kpis = data["kpis"]
        for k in ["total_headcount", "overall_span", "manager_ratio", "hierarchy_depth",
                  "healthy_depts", "attention_depts", "restructure_depts"]:
            assert k in kpis, f"Missing KPI: {k}"
        assert kpis["total_headcount"] > 0
        assert kpis["overall_span"] >= 0
        assert 0 <= kpis["manager_ratio"] <= 100

    def test_department_health_and_pyramid(self, client):
        data = client.get(f"{API}/dashboard/org-health?year=2025", timeout=30).json()
        dh = data["department_health"]
        assert isinstance(dh, list) and len(dh) >= 5
        sample = dh[0]
        for k in ["department", "headcount", "managers", "individual_contributors",
                  "span_of_control", "manager_ratio", "health_score", "health_status", "issues"]:
            assert k in sample
        assert sample["health_status"] in ["Healthy", "Attention", "Restructure"]
        bp = data["band_pyramid"]
        assert isinstance(bp, list) and len(bp) >= 3
        assert "band" in bp[0] and "count" in bp[0] and "ideal_pct" in bp[0] and "deviation" in bp[0]
