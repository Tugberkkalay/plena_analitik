"""Auth and Tenant API routes for Plenalitik."""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid, secrets
from auth import (hash_password, verify_password, create_access_token,
                  create_refresh_token, get_current_user)

auth_router = APIRouter(prefix="/api/auth")
tenant_router = APIRouter(prefix="/api/tenants")


# ---- Auth Models ----
class LoginRequest(BaseModel):
    email: str
    password: str

# ---- Auth Endpoints ----
def setup_auth_routes(db):

    @auth_router.post("/login")
    async def login(body: LoginRequest):
        email = body.email.strip().lower()
        user = await db.users.find_one({"email": email})
        if not user or not verify_password(body.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, email)
        refresh_token = create_refresh_token(user_id)
        response = JSONResponse(content={
            "id": user_id, "email": user["email"],
            "name": user.get("name", ""), "role": user.get("role", "admin")
        })
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
        response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
        return response

    @auth_router.get("/me")
    async def get_me(request: Request):
        user = await get_current_user(request, db)
        return user

    @auth_router.post("/logout")
    async def logout():
        response = JSONResponse(content={"message": "Çıkış yapıldı"})
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        return response

    return auth_router


# ---- Tenant Models ----
class TenantCreate(BaseModel):
    name: str
    slug: str
    sector: str = "Bankacılık"
    logo_url: Optional[str] = None
    primary_color: str = "#0D9488"
    report_title: Optional[str] = None
    access_password: str

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    report_title: Optional[str] = None
    access_password: Optional[str] = None
    status: Optional[str] = None

class TenantAccessRequest(BaseModel):
    password: str

# ---- Tenant Endpoints ----
def setup_tenant_routes(db):

    async def require_admin(request: Request):
        return await get_current_user(request, db)

    @tenant_router.get("/excel-template")
    async def download_template(request: Request):
        await require_admin(request)
        from excel_handler import generate_template
        content = generate_template()
        return Response(content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plenalitik_veri_sablonu.xlsx"})

    @tenant_router.get("")
    async def list_tenants(request: Request):
        await require_admin(request)
        tenants = await db.tenants.find({}, {"_id": 0}).to_list(100)
        return {"tenants": tenants}

    @tenant_router.post("")
    async def create_tenant(body: TenantCreate, request: Request):
        await require_admin(request)
        slug = body.slug.strip().lower().replace(" ", "-")
        existing = await db.tenants.find_one({"slug": slug})
        if existing:
            raise HTTPException(400, "Bu slug zaten kullanılıyor")
        tenant = {
            "id": str(uuid.uuid4()),
            "name": body.name,
            "slug": slug,
            "sector": body.sector,
            "logo_url": body.logo_url or "",
            "primary_color": body.primary_color or "#0D9488",
            "report_title": body.report_title or f"{body.name} İK Analitik Raporu",
            "access_password_hash": hash_password(body.access_password),
            "status": "draft",
            "employee_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "published_at": None,
        }
        await db.tenants.insert_one({**tenant, "_id": tenant["id"]})
        del tenant["access_password_hash"]
        return tenant

    @tenant_router.get("/{tenant_id}")
    async def get_tenant(tenant_id: str, request: Request):
        await require_admin(request)
        tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0, "access_password_hash": 0})
        if not tenant:
            raise HTTPException(404, "Müşteri bulunamadı")
        return tenant

    @tenant_router.put("/{tenant_id}")
    async def update_tenant(tenant_id: str, body: TenantUpdate, request: Request):
        await require_admin(request)
        updates = {k: v for k, v in body.dict().items() if v is not None}
        if "access_password" in updates:
            updates["access_password_hash"] = hash_password(updates.pop("access_password"))
        if "status" in updates and updates["status"] == "published":
            updates["published_at"] = datetime.now(timezone.utc).isoformat()
        if updates:
            await db.tenants.update_one({"id": tenant_id}, {"$set": updates})
        tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0, "access_password_hash": 0})
        return tenant

    @tenant_router.delete("/{tenant_id}")
    async def delete_tenant(tenant_id: str, request: Request):
        await require_admin(request)
        tenant = await db.tenants.find_one({"id": tenant_id})
        if not tenant:
            raise HTTPException(404, "Müşteri bulunamadı")
        # Delete tenant and all associated data
        slug = tenant["slug"]
        await db.tenants.delete_one({"id": tenant_id})
        await db.employees.delete_many({"tenant_id": slug})
        await db.branches.delete_many({"tenant_id": slug})
        await db.sales_performance.delete_many({"tenant_id": slug})
        await db.recruitment.delete_many({"tenant_id": slug})
        await db.training.delete_many({"tenant_id": slug})
        await db.engagement.delete_many({"tenant_id": slug})
        return {"message": f"{tenant['name']} silindi"}

    @tenant_router.post("/{tenant_id}/seed")
    async def seed_tenant_data(tenant_id: str, request: Request):
        """Seed demo data for a tenant using existing generators."""
        await require_admin(request)
        tenant = await db.tenants.find_one({"id": tenant_id})
        if not tenant:
            raise HTTPException(404, "Müşteri bulunamadı")
        slug = tenant["slug"]
        # Import generators from server
        from server import (generate_seed_data, generate_branches,  generate_sales_data,
                           generate_recruitment_data, generate_training_data,
                           generate_engagement_data, generate_employee_skills)
        import random
        # Clear existing tenant data
        for coll in ["employees", "branches", "sales_performance", "recruitment", "training", "engagement"]:
            await db[coll].delete_many({"tenant_id": slug})
        # Generate employees (includes branch assignment internally)
        emps = generate_seed_data(500)
        for emp in emps:
            random.seed(hash(emp['id']) % 2**32)
            emp['skills'] = generate_employee_skills(emp.get('department',''), emp.get('band','B'))
            emp["tenant_id"] = slug
        # Generate branches
        branches = generate_branches()
        for b in branches:
            b["headcount"] = len([e for e in emps if e["branch_id"] == b["id"] and e["status"] == "active"])
            b["tenant_id"] = slug
        # Sales
        sales = generate_sales_data(emps, branches)
        for s in sales:
            s["tenant_id"] = slug
        # Recruitment
        recruitment = generate_recruitment_data(200)
        for r in recruitment:
            r["tenant_id"] = slug
        # Training
        training = generate_training_data(emps, 300)
        for t in training:
            t["tenant_id"] = slug
        # Engagement
        engagement = generate_engagement_data(emps)
        for e in engagement:
            e["tenant_id"] = slug
        # Insert all
        if emps:
            await db.employees.insert_many(emps)
        if branches:
            await db.branches.insert_many(branches)
        if sales:
            await db.sales_performance.insert_many(sales)
        if recruitment:
            await db.recruitment.insert_many(recruitment)
        if training:
            await db.training.insert_many(training)
        if engagement:
            await db.engagement.insert_many(engagement)
        # Update tenant
        await db.tenants.update_one({"id": tenant_id}, {"$set": {"employee_count": len(emps)}})
        return {"message": f"{tenant['name']} için {len(emps)} çalışan oluşturuldu", "employees": len(emps), "branches": len(branches)}

    @tenant_router.post("/{tenant_id}/publish")
    async def publish_tenant(tenant_id: str, request: Request):
        await require_admin(request)
        await db.tenants.update_one({"id": tenant_id}, {"$set": {"status": "published", "published_at": datetime.now(timezone.utc).isoformat()}})
        tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0, "access_password_hash": 0})
        return tenant

    # ---- Public Report Access ----
    @tenant_router.post("/public/{slug}/verify")
    async def verify_tenant_access(slug: str, body: TenantAccessRequest):
        """Verify tenant access password and return a session token."""
        tenant = await db.tenants.find_one({"slug": slug, "status": "published"})
        if not tenant:
            raise HTTPException(404, "Rapor bulunamadı")
        if not verify_password(body.password, tenant["access_password_hash"]):
            raise HTTPException(401, "Şifre hatalı")
        # Create a short-lived report access token
        import jwt as pyjwt
        from auth import get_jwt_secret
        token = pyjwt.encode(
            {"slug": slug, "type": "report", "exp": datetime.now(timezone.utc) + timedelta(hours=8)},
            get_jwt_secret(), algorithm="HS256"
        )
        return {"token": token, "tenant": {
            "name": tenant["name"], "slug": tenant["slug"], "sector": tenant["sector"],
            "logo_url": tenant.get("logo_url", ""), "primary_color": tenant.get("primary_color", "#0D9488"),
            "report_title": tenant.get("report_title", ""),
        }}

    @tenant_router.get("/public/{slug}/check")
    async def check_tenant_exists(slug: str):
        """Check if a published tenant exists (no auth needed)."""
        tenant = await db.tenants.find_one({"slug": slug, "status": "published"}, {"_id": 0, "name": 1, "slug": 1, "logo_url": 1, "primary_color": 1, "report_title": 1})
        if not tenant:
            raise HTTPException(404, "Rapor bulunamadı")
        return {"name": tenant["name"], "slug": tenant["slug"], "logo_url": tenant.get("logo_url", ""),
                "primary_color": tenant.get("primary_color", "#0D9488"), "report_title": tenant.get("report_title", "")}

    @tenant_router.post("/{tenant_id}/upload-logo")
    async def upload_logo(tenant_id: str, request: Request):
        """Upload tenant logo via base64 data URL."""
        await require_admin(request)
        tenant = await db.tenants.find_one({"id": tenant_id})
        if not tenant:
            raise HTTPException(404, "Müşteri bulunamadı")
        body = await request.json()
        logo_data = body.get("logo_url", "")
        if not logo_data:
            raise HTTPException(400, "Logo verisi gerekli")
        # If it's a base64 data URL, save to file
        if logo_data.startswith("data:image"):
            import base64, os
            header, b64data = logo_data.split(",", 1)
            if "svg" in header:
                ext = "svg"
            elif "png" in header:
                ext = "png"
            elif "jpg" in header or "jpeg" in header:
                ext = "jpg"
            elif "webp" in header:
                ext = "webp"
            else:
                ext = "png"
            filename = f"{tenant['slug']}_logo.{ext}"
            filepath = os.path.join("/app/backend/uploads", filename)
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(b64data))
            logo_url = f"/api/uploads/{filename}"
        else:
            logo_url = logo_data
        await db.tenants.update_one({"id": tenant_id}, {"$set": {"logo_url": logo_url}})
        return {"logo_url": logo_url}

    @tenant_router.post("/{tenant_id}/upload-excel")
    async def upload_excel(tenant_id: str, request: Request):
        await require_admin(request)
        tenant = await db.tenants.find_one({"id": tenant_id})
        if not tenant:
            raise HTTPException(404, "Müşteri bulunamadı")
        slug = tenant["slug"]
        form = await request.form()
        file = form.get("file")
        if not file:
            raise HTTPException(400, "Excel dosyası gerekli")
        content = await file.read()
        from excel_handler import parse_excel
        try:
            data = parse_excel(content, slug)
        except Exception as e:
            raise HTTPException(400, f"Excel parse hatası: {str(e)}")
        # Clear existing tenant data
        for coll in ["employees", "branches", "sales_performance", "recruitment", "training", "engagement"]:
            await db[coll].delete_many({"tenant_id": slug})
        # Insert
        counts = {}
        if data["employees"]:
            await db.employees.insert_many(data["employees"])
            counts["employees"] = len(data["employees"])
        if data["branches"]:
            await db.branches.insert_many(data["branches"])
            counts["branches"] = len(data["branches"])
        if data["sales"]:
            await db.sales_performance.insert_many(data["sales"])
            counts["sales"] = len(data["sales"])
        if data["recruitment"]:
            await db.recruitment.insert_many(data["recruitment"])
            counts["recruitment"] = len(data["recruitment"])
        if data["training"]:
            await db.training.insert_many(data["training"])
            counts["training"] = len(data["training"])
        if data["engagement"]:
            await db.engagement.insert_many(data["engagement"])
            counts["engagement"] = len(data["engagement"])
        # Update tenant
        emp_count = len([e for e in data["employees"] if e.get("status") == "active"])
        await db.tenants.update_one({"id": tenant_id}, {"$set": {"employee_count": emp_count}})
        return {"message": f"{tenant['name']} verileri yüklendi", "counts": counts}

    return tenant_router
