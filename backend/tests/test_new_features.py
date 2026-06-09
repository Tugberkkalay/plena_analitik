"""Backend tests for HRlytic new features: Skills Map V2, Internal Mobility,
Action Center, Italian cities, succession critical roles, WF alignment KPI."""
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


# ---- Italian cities / country field ----
class TestItalianCities:
    def test_headcount_city_distribution_includes_italy(self, client):
        r = client.get(f"{API}/dashboard/headcount?year=2025", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "city_distribution" in data
        cities = [c.get("name") for c in data["city_distribution"]]
        assert "Genova" in cities, f"Genova missing from cities: {cities}"
        assert "Villanova d'Asti" in cities, f"Villanova d'Asti missing: {cities}"
        # Both Italian cities should have employees
        for c in data["city_distribution"]:
            if c["name"] in ("Genova", "Villanova d'Asti"):
                assert c["value"] > 0


# ---- Succession critical roles ~45 ----
class TestSuccession:
    def test_succession_critical_roles_count(self, client):
        r = client.get(f"{API}/dashboard/succession?year=2025", timeout=30)
        assert r.status_code == 200
        data = r.json()
        kpis = data["kpis"]
        assert "critical_roles" in kpis
        cr = kpis["critical_roles"]
        # Expected ~45 (not the old 96). Allow generous range 25-65.
        assert 25 <= cr <= 65, f"Expected ~45 critical roles, got {cr}"
        # no_successor may be 0 if all roles have candidates above readiness threshold (data-dependent)
        assert kpis["no_successor"] >= 0
        # Risk summary has balanced distribution (at least 3 non-zero levels)
        non_zero_risk = [r for r in data["risk_summary"] if r["count"] > 0]
        assert len(non_zero_risk) >= 3, f"Expected 3+ risk levels, got {non_zero_risk}"


# ---- WF Alignment uses at_risk_count ----
class TestWorkforceAlignment:
    def test_kpi_uses_at_risk_count(self, client):
        r = client.get(f"{API}/dashboard/workforce-alignment?year=2025", timeout=30)
        assert r.status_code == 200
        kpis = r.json()["kpis"]
        assert "at_risk_count" in kpis, f"at_risk_count missing, keys: {list(kpis.keys())}"
        assert "critical_count" not in kpis, "critical_count should be replaced by at_risk_count"
        assert isinstance(kpis["at_risk_count"], int)


# ---- Skills Map V2 ----
class TestSkillsMapV2:
    def test_endpoint_returns_valid_structure(self, client):
        r = client.get(f"{API}/dashboard/skills-map-v2?year=2025", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for key in ("kpis", "gaps", "heatmap", "heatmap_depts", "all_skills", "demand_supply"):
            assert key in d, f"missing key {key}"
        kpis = d["kpis"]
        for k in ("tracked_skills", "critical_gaps", "avg_coverage", "emerging_skills"):
            assert k in kpis, f"KPI {k} missing"
        assert kpis["tracked_skills"] > 0
        # gaps should each have action suggestions
        if d["gaps"]:
            g = d["gaps"][0]
            for f in ("skill", "current_capacity", "future_demand", "coverage", "severity", "suggested_action"):
                assert f in g
        # heatmap structure
        assert isinstance(d["heatmap"], list)
        assert isinstance(d["heatmap_depts"], list)


# ---- Internal Mobility ----
class TestInternalMobility:
    def test_positions_endpoint(self, client):
        r = client.get(f"{API}/dashboard/positions?year=2025", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "kpis" in d and "positions" in d
        positions = d["positions"]
        assert len(positions) > 0, "Expected open positions, got 0"
        # Spec says ~58 positions
        assert 40 <= len(positions) <= 80, f"Expected ~58 positions, got {len(positions)}"
        p = positions[0]
        for f in ("id", "required_skills"):
            assert f in p, f"position missing {f}"

    def test_position_matches(self, client):
        r = client.get(f"{API}/dashboard/positions?year=2025", timeout=30)
        positions = r.json()["positions"]
        pid = positions[0]["id"]
        r2 = client.get(f"{API}/dashboard/positions/{pid}/matches?year=2025", timeout=30)
        assert r2.status_code == 200
        d = r2.json()
        assert "position" in d and "matches" in d
        if d["matches"]:
            m = d["matches"][0]
            for f in ("fit_score", "matched_skills", "missing_skills", "name"):
                assert f in m

    def test_position_matches_invalid_id(self, client):
        r = client.get(f"{API}/dashboard/positions/bogus-id-xyz/matches", timeout=30)
        assert r.status_code == 404


# ---- Action Center ----
class TestActionCenter:
    def test_alerts_endpoint(self, client):
        r = client.get(f"{API}/dashboard/alerts?year=2025", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "kpis" in d and "alerts" in d
        alerts = d["alerts"]
        # Expect ~26 alerts from 4 sources
        assert len(alerts) > 0
        sources = set(a["source"] for a in alerts)
        # Should span multiple sources
        assert len(sources) >= 3, f"Expected alerts from 3+ sources, got {sources}"
        # Each alert has required fields
        a0 = alerts[0]
        for f in ("id", "source", "severity", "title", "detail", "suggested_action", "status"):
            assert f in a0, f"alert missing {f}"

    def test_resolve_alert(self, client):
        # Get an alert id
        r = client.get(f"{API}/dashboard/alerts?year=2025", timeout=30)
        alerts = r.json()["alerts"]
        if not alerts:
            pytest.skip("No alerts to resolve")
        aid = alerts[0]["id"]
        r2 = client.post(f"{API}/dashboard/alerts/resolve", json={"alert_id": aid}, timeout=15)
        assert r2.status_code == 200
        d = r2.json()
        assert d.get("status") == "resolved"


# ---- Existing dashboards regression ----
class TestExistingDashboards:
    @pytest.mark.parametrize("path", [
        "/dashboard/overview",
        "/dashboard/headcount",
        "/dashboard/turnover",
        "/dashboard/recruitment",
        "/dashboard/performance",
        "/dashboard/hires",
        "/dashboard/leaves",
        "/dashboard/movement",
        "/dashboard/skills-map",
        "/dashboard/headcount-plan",
        "/dashboard/org-health",
    ])
    def test_existing_endpoints(self, client, path):
        r = client.get(f"{API}{path}?year=2025", timeout=30)
        assert r.status_code == 200, f"{path} returned {r.status_code}"
        assert r.json() is not None
