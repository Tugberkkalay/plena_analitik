"""Negative authorization and tenant-isolation regression tests."""
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import pytest
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Request
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from auth import JWT_ALGORITHM, create_access_token, validate_security_config
from security import SecurityMiddleware
import routes_report_designer
import routes_dashboards


class FakeCollection:
    def __init__(self, documents=None):
        self.documents = documents or []
        self.inserts = []

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return document
        return None

    async def insert_one(self, document):
        self.inserts.append(document)


class FakeDB:
    def __init__(self, user_id):
        self.users = FakeCollection([{
            "_id": user_id,
            "email": "viewer@example.test",
            "name": "Viewer",
            "role": "viewer",
            "tenant_id": "tenant-a",
        }])
        self.tenants = FakeCollection([{
            "_id": "tenant-a",
            "slug": "tenant-a",
            "status": "published",
        }])
        self.audit_logs = FakeCollection()


@pytest.fixture()
def secured_client(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-that-is-at-least-32-characters")
    user_id = ObjectId()
    fake_db = FakeDB(user_id)
    app = FastAPI()

    @app.get("/api/dashboard/overview")
    async def protected(request: Request, tenant: str = None):
        return {"tenant": tenant, "principal_type": request.state.principal["type"]}

    @app.delete("/api/data/reset")
    async def reset():
        return {"unexpected": True}

    @app.get("/api/uploads/{filename}")
    async def upload(filename: str):
        return {"filename": filename}

    @app.get("/api/employees/search")
    async def employee_search():
        return {"unexpected": True}

    @app.post("/api/ai/forecast")
    async def ai_forecast():
        return {"unexpected": True}

    @app.get("/api/dashboard/headcount")
    async def report_safe_headcount(request: Request, tenant: str = None):
        is_report = request.state.principal["type"] == "report"
        return {"tenant": tenant, "employee_list": [] if is_report else [{"name": "Sensitive"}]}

    @app.get("/api/dashboard/positions/{position_id}/matches")
    async def position_matches(position_id: str):
        return {"matches": [{"name": "Sensitive"}]}

    @app.post("/api/report-designer/execute-preview")
    async def report_preview(request: Request, tenant: str = None):
        return {"tenant": tenant, "principal_type": request.state.principal["type"]}

    @app.post("/api/dashboards")
    async def dashboard_create(request: Request, tenant: str = None):
        return {"tenant": tenant, "principal_type": request.state.principal["type"]}

    @app.post("/api/dashboards/{dashboard_id}/publish")
    async def dashboard_publish(dashboard_id: str):
        return {"unexpected": dashboard_id}

    app.add_middleware(SecurityMiddleware, db=fake_db)
    app.state.fake_db = fake_db
    return TestClient(app), user_id


def _report_token(slug="tenant-a"):
    return jwt.encode({
        "slug": slug,
        "type": "report",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def test_protected_route_rejects_anonymous_request(secured_client):
    client, _ = secured_client
    response = client.get("/api/dashboard/overview")
    assert response.status_code == 401
    assert client.app.state.fake_db.audit_logs.inserts[-1]["event"] == "authorization_denied"


def test_user_cannot_override_claim_tenant(secured_client):
    client, user_id = secured_client
    token = create_access_token(str(user_id), "viewer@example.test", "viewer", "tenant-a")
    response = client.get(
        "/api/dashboard/overview?tenant=tenant-b",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_user_tenant_is_injected_from_verified_identity(secured_client):
    client, user_id = secured_client
    token = create_access_token(str(user_id), "viewer@example.test", "viewer", "tenant-a")
    response = client.get("/api/dashboard/overview", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == {"tenant": "tenant-a", "principal_type": "user"}


def test_report_token_cannot_cross_tenant(secured_client):
    client, _ = secured_client
    response = client.get(
        "/api/dashboard/overview?tenant=tenant-b",
        headers={"Authorization": f"Bearer {_report_token()}"},
    )
    assert response.status_code == 403


def test_report_token_cannot_call_admin_mutation(secured_client):
    client, _ = secured_client
    response = client.delete(
        "/api/data/reset",
        headers={"Authorization": f"Bearer {_report_token()}"},
    )
    assert response.status_code == 403


def test_report_token_cannot_mutate_source_data_or_access_person_search(secured_client):
    client, _ = secured_client
    headers = {"Authorization": f"Bearer {_report_token()}"}
    assert client.get("/api/employees/search", headers=headers).status_code == 403
    assert client.post("/api/ai/forecast", headers=headers).status_code == 403


def test_report_token_can_only_write_tenant_bound_report_artifacts(secured_client):
    client, _ = secured_client
    headers = {"Authorization": f"Bearer {_report_token()}"}
    preview = client.post("/api/report-designer/execute-preview", headers=headers)
    dashboard = client.post("/api/dashboards", headers=headers)
    assert preview.json() == {"tenant": "tenant-a", "principal_type": "report"}
    assert dashboard.json() == {"tenant": "tenant-a", "principal_type": "report"}
    assert client.post(
        "/api/report-designer/execute-preview?tenant=tenant-b", headers=headers
    ).status_code == 403
    dashboard_id = "00000000-0000-0000-0000-000000000000"
    assert client.post(f"/api/dashboards/{dashboard_id}/publish", headers=headers).status_code == 403


def test_report_token_gets_tenant_bound_redacted_dashboard_payload(secured_client):
    client, _ = secured_client
    headers = {"Authorization": f"Bearer {_report_token()}"}
    response = client.get("/api/dashboard/headcount", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"tenant": "tenant-a", "employee_list": []}
    assert client.get("/api/dashboard/positions/role-1/matches", headers=headers).status_code == 403


def test_successful_protected_read_is_audited(secured_client):
    client, user_id = secured_client
    token = create_access_token(str(user_id), "viewer@example.test", "viewer", "tenant-a")
    response = client.get("/api/dashboard/overview", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert client.app.state.fake_db.audit_logs.inserts[-1]["event"] == "data_access"


def test_only_safe_raster_logo_names_are_public(secured_client):
    client, _ = secured_client
    assert client.get("/api/uploads/acme_logo.png").status_code == 200
    assert client.get("/api/uploads/acme_logo.svg").status_code == 401
    assert client.get("/api/uploads/acme_data.xlsx").status_code == 401


@pytest.mark.parametrize("malicious_filter", [
    {"column": "tenant_id", "operator": "eq", "value": "tenant-b"},
    {"column": "$where", "operator": "eq", "value": "return true"},
    {"column": "department", "operator": "eq", "value": {"$ne": None}},
])
def test_report_filters_reject_tenant_operators_and_nested_values(malicious_filter):
    config = {
        "data_source": "employees",
        "dimensions": [],
        "measures": [],
        "filters": [malicious_filter],
    }
    with pytest.raises(HTTPException) as exc:
        asyncio.run(routes_report_designer._execute_report_config(config, "tenant-a"))
    assert exc.value.status_code == 400


def test_public_report_designer_rejects_person_level_dimensions():
    with pytest.raises(HTTPException) as exc:
        routes_report_designer._validate_public_report_config({
            "data_source": "employees",
            "chart_type": "table",
            "dimensions": ["name"],
            "measures": [],
            "filters": [],
        })
    assert exc.value.status_code == 403


def test_dashboard_layout_limits_are_enforced():
    with pytest.raises(HTTPException) as exc:
        routes_dashboards._validate_dashboard_payload("POC", [{
            "report_id": "not-a-uuid", "x": 0, "y": 0, "w": 6, "h": 4,
        }])
    assert exc.value.status_code == 400


def test_production_config_fails_closed_without_secrets(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    for key in ("JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"):
        monkeypatch.delenv(key, raising=False)
    with pytest.raises(RuntimeError, match="Missing required security settings"):
        validate_security_config()
