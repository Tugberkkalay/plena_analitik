"""
Iteration 20 — Dashboard Manager CRUD + KPI label verification.
"""
import os
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # Fallback to frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE = line.split("=", 1)[1].strip().rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Dashboard CRUD ----------
class TestDashboardCRUD:
    created_id = None

    def test_create_dashboard(self, api):
        r = api.post(f"{BASE}/api/dashboards?tenant=tusas", json={
            "name": "TEST_Dashboard_Iter20",
            "description": "Testing dashboard manager",
            "widgets": [],
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Dashboard_Iter20"
        assert data["status"] == "draft"
        assert "id" in data
        assert "_id" not in data
        TestDashboardCRUD.created_id = data["id"]

    def test_list_dashboards(self, api):
        r = api.get(f"{BASE}/api/dashboards?tenant=tusas")
        assert r.status_code == 200
        data = r.json()
        assert "dashboards" in data
        ids = [d["id"] for d in data["dashboards"]]
        assert TestDashboardCRUD.created_id in ids

    def test_get_dashboard(self, api):
        r = api.get(f"{BASE}/api/dashboards/{TestDashboardCRUD.created_id}")
        assert r.status_code == 200
        assert r.json()["id"] == TestDashboardCRUD.created_id

    def test_update_dashboard(self, api):
        r = api.put(f"{BASE}/api/dashboards/{TestDashboardCRUD.created_id}", json={
            "name": "TEST_Dashboard_Iter20_Updated",
            "widgets": [{"report_id": "abc", "x": 0, "y": 0, "w": 6, "h": 4, "title_override": ""}],
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Dashboard_Iter20_Updated"
        assert len(data["widgets"]) == 1

    def test_publish_dashboard(self, api):
        r = api.post(f"{BASE}/api/dashboards/{TestDashboardCRUD.created_id}/publish")
        assert r.status_code == 200
        assert r.json()["status"] == "published"

    def test_duplicate_dashboard(self, api):
        r = api.post(f"{BASE}/api/dashboards/{TestDashboardCRUD.created_id}/duplicate")
        assert r.status_code == 200
        dup = r.json()
        assert "(Kopya)" in dup["name"]
        assert dup["id"] != TestDashboardCRUD.created_id
        # cleanup
        api.delete(f"{BASE}/api/dashboards/{dup['id']}")

    def test_delete_dashboard(self, api):
        r = api.delete(f"{BASE}/api/dashboards/{TestDashboardCRUD.created_id}")
        assert r.status_code == 200
        r2 = api.get(f"{BASE}/api/dashboards/{TestDashboardCRUD.created_id}")
        assert r2.status_code == 404


# ---------- KPI data availability ----------
class TestKPIDataAvailable:
    def test_tusas_engagement_kpis(self, api):
        r = api.get(f"{BASE}/api/dashboard/engagement?tenant=tusas")
        assert r.status_code == 200
        data = r.json()
        assert "kpis" in data

    def test_tusas_survey_exit(self, api):
        r = api.get(f"{BASE}/api/dashboard/survey-analytics?survey_type=exit&tenant=tusas")
        assert r.status_code == 200
        data = r.json()
        # tusas exit total_exits should be 335 per credentials memo
        assert data["kpis"]["total_exits"] >= 300

    def test_tusas_overview(self, api):
        r = api.get(f"{BASE}/api/dashboard/overview?tenant=tusas")
        assert r.status_code == 200

    def test_turknet_skills_map(self, api):
        r = api.get(f"{BASE}/api/dashboard/skills-map?tenant=turknet")
        assert r.status_code == 200
        data = r.json()
        assert data.get("total_unique_skills", 0) >= 36


# ---------- Report Designer endpoint (widgets depend on it) ----------
class TestReportDesigner:
    def test_list_reports(self, api):
        r = api.get(f"{BASE}/api/report-designer/reports")
        assert r.status_code == 200
