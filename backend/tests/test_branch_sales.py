"""Backend tests for Branch Performance + Commission Targets features."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://workforce-insights-15.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ----- /api/branches/list -----
class TestBranchesList:
    def test_returns_30_branches_with_7_regions(self, session):
        r = session.get(f"{BASE_URL}/api/branches/list")
        assert r.status_code == 200
        d = r.json()
        assert "branches" in d and "regions" in d
        assert len(d["branches"]) == 30, f"Expected 30 branches, got {len(d['branches'])}"
        assert len(d["regions"]) == 7, f"Expected 7 regions, got {len(d['regions'])}"
        # Required fields
        b = d["branches"][0]
        for k in ("id", "name", "region", "city", "segment"):
            assert k in b
        # No mongodb _id leakage
        assert "_id" not in b


# ----- /api/branches/performance -----
class TestBranchesPerformance:
    def test_performance_kpis_and_leaderboard(self, session):
        r = session.get(f"{BASE_URL}/api/branches/performance?period=2025")
        assert r.status_code == 200
        d = r.json()
        assert set(["kpis", "leaderboard", "regions", "segments"]).issubset(d.keys())

        k = d["kpis"]
        for key in ("total_branches", "avg_achievement", "above_target", "below_target", "total_commission", "best_branch"):
            assert key in k, f"missing kpi {key}"
        assert k["total_branches"] == 30
        assert isinstance(k["avg_achievement"], (int, float))

        lb = d["leaderboard"]
        assert len(lb) == 30
        # Sorted desc by achievement_pct
        ach_vals = [b["achievement_pct"] for b in lb]
        assert ach_vals == sorted(ach_vals, reverse=True), "leaderboard not sorted by achievement desc"

        # Region comparison has 7 entries
        assert len(d["regions"]) == 7
        for r_ in d["regions"]:
            assert "region" in r_ and "avg_achievement" in r_

    def test_filter_by_region(self, session):
        r = session.get(f"{BASE_URL}/api/branches/performance?period=2025&region=Marmara")
        assert r.status_code == 200
        d = r.json()
        for b in d["leaderboard"]:
            assert b["region"] == "Marmara"


# ----- /api/branches/{id}/trend -----
class TestBranchTrend:
    def test_trend_returns_12_months(self, session):
        # get a branch id
        lst = session.get(f"{BASE_URL}/api/branches/list").json()["branches"]
        bid = lst[0]["id"]
        r = session.get(f"{BASE_URL}/api/branches/{bid}/trend")
        assert r.status_code == 200
        d = r.json()
        assert "trend" in d
        assert len(d["trend"]) == 12
        for row in d["trend"]:
            for k in ("period", "target", "actual", "achievement"):
                assert k in row

    def test_invalid_branch_returns_empty_or_404(self, session):
        r = session.get(f"{BASE_URL}/api/branches/nonexistent-id/trend")
        # Either 404 or empty trend is acceptable
        assert r.status_code in (200, 404)
        if r.status_code == 200:
            assert r.json().get("trend") == []


# ----- /api/sales/reps -----
class TestSalesReps:
    def test_returns_126_reps_with_tiers_and_bands(self, session):
        r = session.get(f"{BASE_URL}/api/sales/reps?period=2025")
        assert r.status_code == 200
        d = r.json()
        assert set(["kpis", "reps", "achievement_bands", "prim_tiers"]).issubset(d.keys())

        # 126 sales reps
        assert len(d["reps"]) == 126, f"Expected 126 reps, got {len(d['reps'])}"

        # prim_tiers must have exactly 4 tiers matching spec
        tiers = d["prim_tiers"]
        assert len(tiers) == 4
        labels = [t["label"] for t in tiers]
        assert labels == ["Eşik Altı", "Kısmi", "Tam", "Hızlandırıcı"]
        # Tier boundaries
        assert tiers[0]["min"] == 0 and tiers[0]["max"] == 85 and tiers[0]["rate"] == 0
        assert tiers[1]["min"] == 85 and tiers[1]["max"] == 100
        assert tiers[2]["min"] == 100 and tiers[2]["max"] == 120
        assert tiers[3]["min"] == 120

        # 4 achievement bands
        bands = d["achievement_bands"]
        assert len(bands) == 4
        band_names = [b["band"] for b in bands]
        assert band_names == ["<%85", "%85-100", "%100-120", "%120+"]
        # Counts sum to total reps
        assert sum(b["count"] for b in bands) == len(d["reps"])

        # KPIs
        k = d["kpis"]
        for key in ("avg_achievement", "commission_earners", "total_commission", "best_rep", "below_target"):
            assert key in k

        # Sorted desc by achievement_pct
        ach_vals = [r_["achievement_pct"] for r_ in d["reps"]]
        assert ach_vals == sorted(ach_vals, reverse=True)

        # Rep schema
        rep = d["reps"][0]
        for k in ("employee_id", "name", "branch", "region", "target", "actual", "achievement_pct", "commission", "portfolio_size"):
            assert k in rep


# ----- Regression: existing endpoints still work -----
class TestRegression:
    @pytest.mark.parametrize("ep", ["overview", "headcount", "turnover", "org-health", "hires", "leaves"])
    def test_dashboard_endpoint(self, session, ep):
        r = session.get(f"{BASE_URL}/api/dashboard/{ep}")
        assert r.status_code == 200
