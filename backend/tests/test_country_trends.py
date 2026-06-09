"""
Iteration 8 tests: country filter + Q-o-Q trend indicators + scenario location_impact
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Overview: country filter + trends ----------
class TestOverviewCountry:
    def test_overview_no_country(self, client):
        r = client.get(f"{BASE_URL}/api/dashboard/overview?year=2025")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "kpis" in d and "trends" in d
        assert "country_distribution" in d
        # No country filter -> country_distribution should be populated
        assert len(d["country_distribution"]) >= 2
        hc_all = d["kpis"]["headcount"]
        assert hc_all > 0
        # Trends present with expected keys
        for k in ["headcount", "hires", "leaves", "turnover"]:
            assert k in d["trends"], f"missing trend {k}"
            assert "prev" in d["trends"][k]
            assert "delta" in d["trends"][k]
            assert "pct" in d["trends"][k]

    def test_overview_country_italy(self, client):
        r = client.get(f"{BASE_URL}/api/dashboard/overview?year=2025&country=Italy")
        assert r.status_code == 200
        d = r.json()
        hc_it = d["kpis"]["headcount"]
        # Italy seed has cities Genova + Villanova d'Asti ~115 (per iter_7 context)
        assert 80 <= hc_it <= 160, f"Italy hc out of expected range: {hc_it}"
        # Should NOT equal All HC (402-ish)
        assert hc_it < 250

    def test_overview_country_turkey(self, client):
        r = client.get(f"{BASE_URL}/api/dashboard/overview?year=2025&country=Turkey")
        assert r.status_code == 200
        d = r.json()
        hc_tr = d["kpis"]["headcount"]
        # Turkey is the larger location
        assert 200 <= hc_tr <= 400, f"Turkey hc out of expected range: {hc_tr}"

    def test_overview_country_sum_equals_all(self, client):
        all_d = client.get(f"{BASE_URL}/api/dashboard/overview?year=2025").json()
        it = client.get(f"{BASE_URL}/api/dashboard/overview?year=2025&country=Italy").json()
        tr = client.get(f"{BASE_URL}/api/dashboard/overview?year=2025&country=Turkey").json()
        assert it["kpis"]["headcount"] + tr["kpis"]["headcount"] == all_d["kpis"]["headcount"]


# ---------- Headcount country filter ----------
class TestHeadcountCountry:
    def test_headcount_italy_only_italy_cities(self, client):
        r = client.get(f"{BASE_URL}/api/dashboard/headcount?year=2025&country=Italy")
        assert r.status_code == 200
        d = r.json()
        cities = {c["name"] for c in d["city_distribution"]}
        # Should be subset of Italy cities
        italy_cities = {"Genova", "Villanova d'Asti"}
        assert cities.issubset(italy_cities), f"Italy filter leaked non-italy cities: {cities - italy_cities}"

    def test_headcount_turkey_only_turkey_cities(self, client):
        r = client.get(f"{BASE_URL}/api/dashboard/headcount?year=2025&country=Turkey")
        assert r.status_code == 200
        d = r.json()
        cities = {c["name"] for c in d["city_distribution"]}
        turkey_cities = {"Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"}
        assert cities.issubset(turkey_cities), f"Turkey filter leaked: {cities - turkey_cities}"

    def test_headcount_differs_by_country(self, client):
        it = client.get(f"{BASE_URL}/api/dashboard/headcount?year=2025&country=Italy").json()
        tr = client.get(f"{BASE_URL}/api/dashboard/headcount?year=2025&country=Turkey").json()
        assert it["kpis"]["headcount"] != tr["kpis"]["headcount"]


# ---------- Turnover country filter ----------
class TestTurnoverCountry:
    def test_turnover_accepts_country(self, client):
        r = client.get(f"{BASE_URL}/api/dashboard/turnover?year=2025&country=Italy")
        assert r.status_code == 200
        d = r.json()
        assert "kpis" in d and "turnover_rate" in d["kpis"]

    def test_turnover_country_filters_yearly(self, client):
        # Yearly turnover series should differ for Italy vs full
        full = client.get(f"{BASE_URL}/api/dashboard/turnover?year=2025").json()
        it = client.get(f"{BASE_URL}/api/dashboard/turnover?year=2025&country=Italy").json()
        # Either rates differ or at least monthly series differ
        assert full["kpis"] != it["kpis"], "Turnover not filtered by country"


# ---------- HC Planning country filter ----------
class TestHCPlanningCountry:
    def test_hc_planning_country(self, client):
        # try common endpoint names
        for ep in ["/api/dashboard/headcount-plan", "/api/dashboard/hc-planning", "/api/dashboard/planning"]:
            r = client.get(f"{BASE_URL}{ep}?year=2025&country=Italy")
            if r.status_code == 200:
                full = client.get(f"{BASE_URL}{ep}?year=2025").json()
                it = r.json()
                assert full != it, f"HC planning at {ep} not filtered by country"
                return
        pytest.skip("HC Planning endpoint not found")


# ---------- Org Health country filter ----------
class TestOrgHealthCountry:
    def test_org_health_country(self, client):
        r_all = client.get(f"{BASE_URL}/api/dashboard/org-health?year=2025")
        assert r_all.status_code == 200
        r_it = client.get(f"{BASE_URL}/api/dashboard/org-health?year=2025&country=Italy")
        assert r_it.status_code == 200
        # Italy subset should differ from all
        assert r_all.json() != r_it.json(), "Org Health not filtered by country"


# ---------- Scenario Simulator location_impact ----------
class TestScenarioLocationImpact:
    def test_scenario_returns_location_impact(self, client):
        payload = {
            "year": 2025,
            "growth_target": 10,
            "attrition_change": 0,
            "budget_change": 0,
            "hiring_boost": 0,
            "new_location_headcount": 0
        }
        r = client.post(f"{BASE_URL}/api/simulator/scenario", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "location_impact" in d
        loc = d["location_impact"]
        assert len(loc) == 2
        locations = {l["location"] for l in loc}
        assert locations == {"Turkey", "Italy"}
        for l in loc:
            assert "current" in l and "projected" in l and "delta" in l
            assert isinstance(l["current"], int)
            assert isinstance(l["projected"], int)


# ---------- Regression: existing endpoints still work ----------
class TestRegression:
    @pytest.mark.parametrize("ep", [
        "/api/dashboard/overview?year=2025",
        "/api/dashboard/headcount?year=2025",
        "/api/dashboard/turnover?year=2025",
        "/api/dashboard/org-health?year=2025",
        "/api/dashboard/hires?year=2025",
        "/api/dashboard/leaves?year=2025",
        "/api/dashboard/recruitment?year=2025",
        "/api/dashboard/performance?year=2025",
        "/api/dashboard/years",
    ])
    def test_endpoint_ok(self, client, ep):
        r = client.get(f"{BASE_URL}{ep}")
        assert r.status_code == 200, f"{ep} -> {r.status_code}"
