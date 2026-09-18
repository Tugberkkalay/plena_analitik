"""
Iteration 21 backend tests:
- 21 report templates + create-from-template
- Dashboard share token generation + shared retrieval (with/without password)
- Report save (POST /api/report-designer/reports) round-trip
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://workforce-insights-15.preview.emergentagent.com").rstrip("/")
TENANT = "tusas"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ─── Report Templates ───
def test_report_templates_returns_21(api):
    r = api.get(f"{BASE_URL}/api/report-designer/report-templates")
    assert r.status_code == 200
    data = r.json()
    assert "templates" in data
    templates = data["templates"]
    assert len(templates) == 21, f"Expected 21 templates, got {len(templates)}"
    # verify 9 categories
    cats = {t["category"] for t in templates}
    expected = {"İşgücü", "Ücret", "Çeşitlilik", "Performans", "İşe Alım", "Eğitim", "Bağlılık", "Yetenek", "KPI Dashboard"}
    assert expected.issubset(cats), f"missing categories: {expected - cats}"


def test_create_from_template_index_0(api):
    r = api.post(f"{BASE_URL}/api/report-designer/report-templates/0/create?tenant={TENANT}")
    assert r.status_code == 200, r.text
    rep = r.json()
    assert "id" in rep
    assert rep["name"] == "Departman Bazlı Headcount"
    assert rep["tenant_id"] == TENANT
    assert "_id" not in rep
    # cleanup
    api.delete(f"{BASE_URL}/api/report-designer/reports/{rep['id']}")


def test_create_from_template_invalid_index(api):
    r = api.post(f"{BASE_URL}/api/report-designer/report-templates/999/create?tenant={TENANT}")
    assert r.status_code == 400


# ─── Report save round-trip ───
def test_report_save_and_list(api):
    payload = {
        "name": "TEST_iter21_report",
        "data_source": "employees",
        "chart_type": "bar",
        "dimensions": ["department"],
        "measures": [{"column": "salary", "aggregation": "count", "label": "Kişi"}],
        "filters": [],
        "kpi_ids": [],
    }
    r = api.post(f"{BASE_URL}/api/report-designer/reports?tenant={TENANT}", json=payload)
    assert r.status_code == 200, r.text
    rep = r.json()
    rid = rep["id"]
    assert rep["name"] == payload["name"]

    # verify list contains it
    lr = api.get(f"{BASE_URL}/api/report-designer/reports?tenant={TENANT}")
    assert lr.status_code == 200
    ids = [x["id"] for x in lr.json()["reports"]]
    assert rid in ids

    # cleanup
    api.delete(f"{BASE_URL}/api/report-designer/reports/{rid}")


# ─── Dashboard share flow ───
@pytest.fixture(scope="module")
def prepared_dashboard(api):
    # create a report first
    rp = api.post(f"{BASE_URL}/api/report-designer/report-templates/0/create?tenant={TENANT}").json()
    rid = rp["id"]
    # create dashboard with widget
    dash_payload = {
        "name": "TEST_iter21_dash",
        "description": "share test",
        "widgets": [{"report_id": rid, "x": 0, "y": 0, "w": 6, "h": 4, "title_override": ""}],
        "shared_filters": [],
    }
    dr = api.post(f"{BASE_URL}/api/dashboards?tenant={TENANT}", json=dash_payload)
    assert dr.status_code == 200
    dash = dr.json()
    # publish
    api.post(f"{BASE_URL}/api/dashboards/{dash['id']}/publish")
    yield {"dashboard": dash, "report_id": rid}
    # cleanup
    api.delete(f"{BASE_URL}/api/dashboards/{dash['id']}")
    api.delete(f"{BASE_URL}/api/report-designer/reports/{rid}")


def test_dashboard_share_no_password(api, prepared_dashboard):
    did = prepared_dashboard["dashboard"]["id"]
    r = api.post(f"{BASE_URL}/api/dashboards/{did}/share")
    assert r.status_code == 200, r.text
    data = r.json()
    assert "share_token" in data
    assert len(data["share_token"]) >= 16
    assert data["share_url"].startswith("/shared/dashboard/")

    # fetch shared
    token = data["share_token"]
    sr = api.get(f"{BASE_URL}/api/dashboards/shared/{token}")
    assert sr.status_code == 200, sr.text
    shared = sr.json()
    assert "dashboard" in shared
    assert "widget_data" in shared
    assert shared["dashboard"]["id"] == did
    # widget data should include the report id
    rid = prepared_dashboard["report_id"]
    assert rid in shared["widget_data"]
    assert shared["widget_data"][rid] is not None


def test_dashboard_share_with_password(api, prepared_dashboard):
    did = prepared_dashboard["dashboard"]["id"]
    r = api.post(f"{BASE_URL}/api/dashboards/{did}/share?password=secret123")
    assert r.status_code == 200
    token = r.json()["share_token"]

    # without password => 403
    bad = api.get(f"{BASE_URL}/api/dashboards/shared/{token}")
    assert bad.status_code == 403

    # wrong password => 403
    wrong = api.get(f"{BASE_URL}/api/dashboards/shared/{token}?password=nope")
    assert wrong.status_code == 403

    # correct => 200
    ok = api.get(f"{BASE_URL}/api/dashboards/shared/{token}?password=secret123")
    assert ok.status_code == 200


def test_shared_invalid_token(api):
    r = api.get(f"{BASE_URL}/api/dashboards/shared/nonexistent_token_xyz")
    assert r.status_code == 404
