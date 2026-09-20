"""
Dashboard Manager API — Create, manage dashboards with widget grid layout.
"""
import uuid
import os
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import hash_password, verify_password

router = APIRouter(prefix="/api/dashboards", tags=["dashboards"])
db = None


def _require_public_sharing_enabled():
    if (os.environ.get("APP_ENV", "production").lower() == "production"
            and os.environ.get("ENABLE_PUBLIC_DASHBOARD_SHARING", "false").lower() != "true"):
        raise HTTPException(404, "Public dashboard paylaşımı etkin değil")

def setup_dashboards(database):
    global db
    db = database


class WidgetConfig(BaseModel):
    report_id: str
    x: int = 0
    y: int = 0
    w: int = 6
    h: int = 4
    title_override: str = ""

class DashboardCreate(BaseModel):
    name: str
    description: str = ""
    widgets: list = []
    shared_filters: list = []

class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    widgets: Optional[list] = None
    shared_filters: Optional[list] = None
    status: Optional[str] = None

class ShareRequest(BaseModel):
    password: Optional[str] = None

class ShareAccessRequest(BaseModel):
    password: Optional[str] = None

def _dashboard_query(dashboard_id: str, tenant: str = None):
    query = {"id": dashboard_id}
    if tenant:
        query["tenant_id"] = tenant
    return query


@router.post("")
async def create_dashboard(body: DashboardCreate, tenant: str = None):
    """Create a new dashboard."""
    dashboard = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "description": body.description,
        "widgets": body.widgets,
        "shared_filters": body.shared_filters,
        "status": "draft",
        "tenant_id": tenant or "default",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.dashboards.insert_one(dashboard)
    dashboard.pop("_id", None)
    return dashboard


@router.get("")
async def list_dashboards(tenant: str = None):
    """List all dashboards for a tenant."""
    query = {"tenant_id": tenant} if tenant else {}
    dashboards = await db.dashboards.find(query, {"_id": 0, "share_password_hash": 0}).sort("created_at", -1).to_list(50)
    return {"dashboards": dashboards}


@router.get("/{dashboard_id}")
async def get_dashboard(dashboard_id: str, tenant: str = None):
    """Get a single dashboard with all widget configs."""
    dashboard = await db.dashboards.find_one(_dashboard_query(dashboard_id, tenant), {"_id": 0, "share_password_hash": 0})
    if not dashboard:
        raise HTTPException(404, "Dashboard bulunamadı")
    return dashboard


@router.put("/{dashboard_id}")
async def update_dashboard(dashboard_id: str, body: DashboardUpdate, tenant: str = None):
    """Update dashboard (name, widgets, layout, filters, status)."""
    update = {k: v for k, v in body.dict().items() if v is not None}
    if not update:
        raise HTTPException(400, "Güncelleme verisi boş")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    query = _dashboard_query(dashboard_id, tenant)
    result = await db.dashboards.update_one(query, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Dashboard bulunamadı")
    return await db.dashboards.find_one(query, {"_id": 0, "share_password_hash": 0})


@router.delete("/{dashboard_id}")
async def delete_dashboard(dashboard_id: str, tenant: str = None):
    """Delete a dashboard."""
    result = await db.dashboards.delete_one(_dashboard_query(dashboard_id, tenant))
    if result.deleted_count == 0:
        raise HTTPException(404, "Dashboard bulunamadı")
    return {"message": "Dashboard silindi"}


@router.post("/{dashboard_id}/duplicate")
async def duplicate_dashboard(dashboard_id: str, tenant: str = None):
    """Duplicate a dashboard."""
    original = await db.dashboards.find_one(_dashboard_query(dashboard_id, tenant), {"_id": 0, "share_password_hash": 0})
    if not original:
        raise HTTPException(404, "Dashboard bulunamadı")
    new_db = {**original, "id": str(uuid.uuid4()), "name": f"{original['name']} (Kopya)",
              "status": "draft", "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.dashboards.insert_one(new_db)
    new_db.pop("_id", None)
    return new_db


@router.put("/{dashboard_id}/widgets")
async def update_widgets(dashboard_id: str, widgets: list, tenant: str = None):
    """Bulk update widget positions/sizes."""
    query = _dashboard_query(dashboard_id, tenant)
    result = await db.dashboards.update_one(query, {"$set": {"widgets": widgets, "updated_at": datetime.now(timezone.utc).isoformat()}})
    if result.matched_count == 0:
        raise HTTPException(404, "Dashboard bulunamadı")
    return await db.dashboards.find_one(query, {"_id": 0, "share_password_hash": 0})


@router.post("/{dashboard_id}/publish")
async def publish_dashboard(dashboard_id: str, tenant: str = None):
    """Publish a dashboard (draft → published)."""
    query = _dashboard_query(dashboard_id, tenant)
    result = await db.dashboards.update_one(query, {"$set": {"status": "published", "updated_at": datetime.now(timezone.utc).isoformat()}})
    if result.matched_count == 0:
        raise HTTPException(404, "Dashboard bulunamadı")
    return await db.dashboards.find_one(query, {"_id": 0, "share_password_hash": 0})


@router.post("/{dashboard_id}/share")
async def generate_share_link(dashboard_id: str, body: ShareRequest, tenant: str = None):
    """Generate a share token for a published dashboard."""
    _require_public_sharing_enabled()
    import secrets
    query = _dashboard_query(dashboard_id, tenant)
    dashboard = await db.dashboards.find_one(query, {"_id": 0})
    if not dashboard:
        raise HTTPException(404, "Dashboard bulunamadı")
    if dashboard.get("status") != "published":
        raise HTTPException(409, "Yalnız yayınlanmış dashboard paylaşılabilir")
    if not body.password or len(body.password) < 12:
        raise HTTPException(400, "Paylaşım şifresi en az 12 karakter olmalı")
    share_token = secrets.token_urlsafe(16)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    update = {
        "share_token": share_token,
        "share_password_hash": hash_password(body.password),
        "share_expires_at": expires_at,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.dashboards.update_one(query, {"$set": update, "$unset": {"share_password": ""}})
    return {"share_token": share_token, "share_url": f"/shared/dashboard/{share_token}"}


@router.post("/shared/{share_token}")
async def get_shared_dashboard(share_token: str, body: ShareAccessRequest):
    """Access a shared dashboard by token."""
    _require_public_sharing_enabled()
    dashboard = await db.dashboards.find_one({"share_token": share_token}, {"_id": 0})
    if not dashboard:
        raise HTTPException(404, "Dashboard bulunamadı veya link geçersiz")
    expires_at = dashboard.get("share_expires_at")
    if isinstance(expires_at, str):
        try:
            expires_at = datetime.fromisoformat(expires_at)
        except ValueError:
            expires_at = None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not expires_at or expires_at <= datetime.now(timezone.utc):
        raise HTTPException(410, "Paylaşım linkinin süresi dolmuş")
    if not body.password or not verify_password(body.password, dashboard.get("share_password_hash", "")):
        raise HTTPException(403, "Şifre gerekli")
    dashboard.pop("share_password_hash", None)
    dashboard.pop("share_password", None)
    # Execute all widgets
    widget_results = {}
    for w in dashboard.get("widgets", []):
        rid = w.get("report_id")
        report = await db.report_definitions.find_one({
            "id": rid, "tenant_id": dashboard.get("tenant_id")
        }, {"_id": 0})
        if report:
            from routes_report_designer import _execute_report_config
            try:
                result = await _execute_report_config(report, dashboard.get("tenant_id"))
                widget_results[rid] = result
            except Exception:
                widget_results[rid] = None
    return {"dashboard": dashboard, "widget_data": widget_results}
