"""
Dashboard Manager API — Create, manage dashboards with widget grid layout.
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/dashboards", tags=["dashboards"])
db = None

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
    dashboards = await db.dashboards.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"dashboards": dashboards}


@router.get("/{dashboard_id}")
async def get_dashboard(dashboard_id: str):
    """Get a single dashboard with all widget configs."""
    dashboard = await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})
    if not dashboard:
        raise HTTPException(404, "Dashboard bulunamadı")
    return dashboard


@router.put("/{dashboard_id}")
async def update_dashboard(dashboard_id: str, body: DashboardUpdate):
    """Update dashboard (name, widgets, layout, filters, status)."""
    update = {k: v for k, v in body.dict().items() if v is not None}
    if not update:
        raise HTTPException(400, "Güncelleme verisi boş")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.dashboards.update_one({"id": dashboard_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Dashboard bulunamadı")
    return await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})


@router.delete("/{dashboard_id}")
async def delete_dashboard(dashboard_id: str):
    """Delete a dashboard."""
    result = await db.dashboards.delete_one({"id": dashboard_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Dashboard bulunamadı")
    return {"message": "Dashboard silindi"}


@router.post("/{dashboard_id}/duplicate")
async def duplicate_dashboard(dashboard_id: str):
    """Duplicate a dashboard."""
    original = await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})
    if not original:
        raise HTTPException(404, "Dashboard bulunamadı")
    new_db = {**original, "id": str(uuid.uuid4()), "name": f"{original['name']} (Kopya)",
              "status": "draft", "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.dashboards.insert_one(new_db)
    new_db.pop("_id", None)
    return new_db


@router.put("/{dashboard_id}/widgets")
async def update_widgets(dashboard_id: str, widgets: list):
    """Bulk update widget positions/sizes."""
    result = await db.dashboards.update_one({"id": dashboard_id}, {"$set": {"widgets": widgets, "updated_at": datetime.now(timezone.utc).isoformat()}})
    if result.matched_count == 0:
        raise HTTPException(404, "Dashboard bulunamadı")
    return await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})


@router.post("/{dashboard_id}/publish")
async def publish_dashboard(dashboard_id: str):
    """Publish a dashboard (draft → published)."""
    result = await db.dashboards.update_one({"id": dashboard_id}, {"$set": {"status": "published", "updated_at": datetime.now(timezone.utc).isoformat()}})
    if result.matched_count == 0:
        raise HTTPException(404, "Dashboard bulunamadı")
    return await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})


@router.post("/{dashboard_id}/share")
async def generate_share_link(dashboard_id: str, password: str = None):
    """Generate a share token for a published dashboard."""
    import hashlib, secrets
    dashboard = await db.dashboards.find_one({"id": dashboard_id}, {"_id": 0})
    if not dashboard:
        raise HTTPException(404, "Dashboard bulunamadı")
    share_token = secrets.token_urlsafe(16)
    update = {"share_token": share_token, "share_password": password, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.dashboards.update_one({"id": dashboard_id}, {"$set": update})
    return {"share_token": share_token, "share_url": f"/shared/dashboard/{share_token}"}


@router.get("/shared/{share_token}")
async def get_shared_dashboard(share_token: str, password: str = None):
    """Access a shared dashboard by token."""
    dashboard = await db.dashboards.find_one({"share_token": share_token}, {"_id": 0})
    if not dashboard:
        raise HTTPException(404, "Dashboard bulunamadı veya link geçersiz")
    if dashboard.get("share_password"):
        if password != dashboard["share_password"]:
            raise HTTPException(403, "Şifre gerekli")
    # Execute all widgets
    widget_results = {}
    for w in dashboard.get("widgets", []):
        rid = w.get("report_id")
        report = await db.report_definitions.find_one({"id": rid}, {"_id": 0})
        if report:
            from routes_report_designer import _execute_report_config
            try:
                result = await _execute_report_config(report, dashboard.get("tenant_id"))
                widget_results[rid] = result
            except Exception:
                widget_results[rid] = None
    return {"dashboard": dashboard, "widget_data": widget_results}
