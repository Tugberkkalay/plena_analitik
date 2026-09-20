"""Auth and Tenant API routes for Plenalitik."""
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional
from pathlib import Path
import base64, binascii, logging, os, re, uuid, zipfile
from auth import (hash_password, verify_password, create_access_token,
                  create_refresh_token, get_current_user, require_admin)
from taxonomy_loader import SUPPORTED_SECTORS

auth_router = APIRouter(prefix="/api/auth")
tenant_router = APIRouter(prefix="/api/tenants")
UPLOAD_DIR = Path(__file__).parent / "uploads"
MAX_EXCEL_BYTES = 10 * 1024 * 1024
MAX_EXCEL_UNCOMPRESSED_BYTES = 50 * 1024 * 1024
MAX_LOGO_BYTES = 2 * 1024 * 1024
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")
SAFE_LOGO_URL_PATTERN = re.compile(r"^/api/uploads/[a-z0-9_-]+_logo\.(png|jpe?g|webp)$")
logger = logging.getLogger(__name__)
ALLOWED_EXCEL_TYPES = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
}
LOGO_FORMATS = {
    "image/png": ("png", b"\x89PNG\r\n\x1a\n"),
    "image/jpeg": ("jpg", b"\xff\xd8\xff"),
    "image/webp": ("webp", b"RIFF"),
}


def _validate_sector(sector: str) -> None:
    if sector not in SUPPORTED_SECTORS:
        raise HTTPException(
            400,
            f"Desteklenmeyen sektör. Geçerli değerler: {', '.join(SUPPORTED_SECTORS)}",
        )


async def _read_limited(file: UploadFile, maximum: int) -> bytes:
    chunks = []
    total = 0
    while chunk := await file.read(1024 * 1024):
        total += len(chunk)
        if total > maximum:
            raise HTTPException(413, "Dosya boyutu sınırı aşıldı")
        chunks.append(chunk)
    return b"".join(chunks)


def _validate_xlsx(content: bytes, content_type: str = "") -> None:
    if content_type and content_type not in ALLOWED_EXCEL_TYPES:
        raise HTTPException(415, "Yalnızca XLSX dosyaları kabul edilir")
    if not content.startswith(b"PK"):
        raise HTTPException(415, "Geçersiz XLSX içeriği")
    try:
        from io import BytesIO
        with zipfile.ZipFile(BytesIO(content)) as archive:
            infos = archive.infolist()
            if len(infos) > 2000:
                raise HTTPException(413, "Excel arşivinde çok fazla dosya var")
            total_size = sum(info.file_size for info in infos)
            if total_size > MAX_EXCEL_UNCOMPRESSED_BYTES:
                raise HTTPException(413, "Excel açılmış boyut sınırını aşıyor")
            if any(info.filename.startswith(("/", "\\")) or ".." in Path(info.filename).parts for info in infos):
                raise HTTPException(400, "Geçersiz Excel arşiv yolu")
    except zipfile.BadZipFile:
        raise HTTPException(415, "Bozuk XLSX dosyası")


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
        role = user.get("role", "viewer")
        access_token = create_access_token(user_id, email, role, user.get("tenant_id"))
        refresh_token = create_refresh_token(user_id)
        response = JSONResponse(content={
            "id": user_id, "email": user["email"],
            "name": user.get("name", ""), "role": role, "tenant_id": user.get("tenant_id")
        })
        cookie_secure = os.environ.get("COOKIE_SECURE", "true").lower() == "true"
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=cookie_secure, samesite="lax", max_age=3600, path="/")
        response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=cookie_secure, samesite="strict", max_age=604800, path="/api/auth")
        return response

    @auth_router.get("/me")
    async def get_me(request: Request):
        user = await get_current_user(request, db)
        return user

    @auth_router.post("/logout")
    async def logout():
        response = JSONResponse(content={"message": "Çıkış yapıldı"})
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/api/auth")
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

    @tenant_router.get("/excel-template")
    async def download_template(request: Request):
        await require_admin(request, db)
        from excel_handler import generate_template
        content = generate_template()
        return Response(content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=plenalitik_veri_sablonu.xlsx"})

    @tenant_router.get("")
    async def list_tenants(request: Request):
        await require_admin(request, db)
        tenants = await db.tenants.find({}, {"_id": 0}).to_list(100)
        return {"tenants": tenants}

    @tenant_router.post("")
    async def create_tenant(body: TenantCreate, request: Request):
        await require_admin(request, db)
        _validate_sector(body.sector)
        slug = body.slug.strip().lower().replace(" ", "-")
        if not SLUG_PATTERN.fullmatch(slug):
            raise HTTPException(400, "Slug yalnızca küçük harf, rakam ve tek tire grupları içerebilir")
        if not COLOR_PATTERN.fullmatch(body.primary_color or ""):
            raise HTTPException(400, "Geçersiz renk kodu")
        if len(body.access_password) < 12:
            raise HTTPException(400, "Rapor erişim şifresi en az 12 karakter olmalı")
        if body.logo_url and not SAFE_LOGO_URL_PATTERN.fullmatch(body.logo_url):
            raise HTTPException(400, "Logo yalnızca güvenli upload endpoint'i üzerinden yüklenebilir")
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
        await require_admin(request, db)
        tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0, "access_password_hash": 0})
        if not tenant:
            raise HTTPException(404, "Müşteri bulunamadı")
        return tenant

    @tenant_router.put("/{tenant_id}")
    async def update_tenant(tenant_id: str, body: TenantUpdate, request: Request):
        await require_admin(request, db)
        updates = {k: v for k, v in body.dict().items() if v is not None}
        if "sector" in updates:
            _validate_sector(updates["sector"])
        if updates.get("primary_color") and not COLOR_PATTERN.fullmatch(updates["primary_color"]):
            raise HTTPException(400, "Geçersiz renk kodu")
        if updates.get("logo_url") and not SAFE_LOGO_URL_PATTERN.fullmatch(updates["logo_url"]):
            raise HTTPException(400, "Logo yalnızca güvenli upload endpoint'i üzerinden yüklenebilir")
        if "access_password" in updates:
            if len(updates["access_password"]) < 12:
                raise HTTPException(400, "Rapor erişim şifresi en az 12 karakter olmalı")
            updates["access_password_hash"] = hash_password(updates.pop("access_password"))
        if "status" in updates and updates["status"] == "published":
            updates["published_at"] = datetime.now(timezone.utc).isoformat()
        if updates:
            await db.tenants.update_one({"id": tenant_id}, {"$set": updates})
        tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0, "access_password_hash": 0})
        return tenant

    @tenant_router.delete("/{tenant_id}")
    async def delete_tenant(tenant_id: str, request: Request):
        await require_admin(request, db)
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
        await db.ek_kadro_talepleri.delete_many({"tenant_id": slug})
        await db.norm_kadro.delete_many({"tenant_id": slug})
        for collection in ["talent_programs", "exit_surveys", "onboarding_surveys", "pulse_surveys",
                           "report_definitions", "dashboards", "jt_hedefler", "jt_yetkinlikler", "jt_karne"]:
            await db[collection].delete_many({"tenant_id": slug})
        return {"message": f"{tenant['name']} silindi"}

    @tenant_router.post("/{tenant_id}/seed")
    async def seed_tenant_data(tenant_id: str, request: Request):
        """Seed demo data for a tenant using existing generators."""
        await require_admin(request, db)
        tenant = await db.tenants.find_one({"id": tenant_id})
        if not tenant:
            raise HTTPException(404, "Müşteri bulunamadı")
        slug = tenant["slug"]
        sector = tenant.get("sector", "Bankacılık")
        _validate_sector(sector)
        # Import generators from server
        from server import (generate_seed_data, generate_branches,  generate_sales_data,
                           generate_recruitment_data, generate_training_data,
                           generate_engagement_data, generate_employee_skills,
                           generate_ek_kadro_talepleri, generate_norm_kadro_data)
        # Generate employees — use target headcount from sector config
        from taxonomy_loader import get_sector_config as get_cfg
        sector_cfg = get_cfg(sector)
        target_hc = sum(v["target"] for v in sector_cfg.get("TARGET_HEADCOUNT", {}).values()) or 500
        emps = generate_seed_data(target_hc, sector=sector)
        for emp in emps:
            emp["tenant_id"] = slug
        # Bank branches and sales are not valid concepts for defense/aviation tenants.
        branches = generate_branches() if sector == "Bankacılık" else []
        for b in branches:
            b["headcount"] = len([e for e in emps if e["branch_id"] == b["id"] and e["status"] == "active"])
            b["tenant_id"] = slug
        # Sales
        sales = generate_sales_data(emps, branches)
        for s in sales:
            s["tenant_id"] = slug
        # Recruitment
        recruitment = generate_recruitment_data(200, sector=sector)
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
        # Ek Kadro Talepleri
        ek_kadro = generate_ek_kadro_talepleri(sector=sector, count=30)
        for ek in ek_kadro:
            ek["tenant_id"] = slug
        # Norm Kadro
        norm_kadro = generate_norm_kadro_data(emps, sector=sector)
        for nk in norm_kadro:
            nk["tenant_id"] = slug

        # Validate the complete bundle before touching the existing tenant data.
        from seed_validation import validate_seed_bundle
        bundle = {
            "employees": emps, "branches": branches, "sales": sales,
            "recruitment": recruitment, "training": training,
            "engagement": engagement, "ek_kadro": ek_kadro,
            "norm_kadro": norm_kadro,
        }
        manifest = validate_seed_bundle(
            bundle, sector=sector, expected_headcount=target_hc,
            departments=sector_cfg["DEPARTMENTS"],
        )

        collection_names = ["employees", "branches", "sales_performance", "recruitment", "training", "engagement", "ek_kadro_talepleri", "norm_kadro"]
        backup = {
            name: await db[name].find({"tenant_id": slug}).to_list(20000)
            for name in collection_names
        }
        collection_rows = (
            ("employees", emps), ("branches", branches),
            ("sales_performance", sales), ("recruitment", recruitment),
            ("training", training), ("engagement", engagement),
            ("ek_kadro_talepleri", ek_kadro), ("norm_kadro", norm_kadro),
        )
        try:
            for name in collection_names:
                await db[name].delete_many({"tenant_id": slug})
            for name, rows in collection_rows:
                if rows:
                    await db[name].insert_many(rows)
        except Exception:
            # Standalone Mongo deployments may not support transactions. Restore
            # the last valid tenant snapshot if replacement fails mid-flight.
            for name in collection_names:
                await db[name].delete_many({"tenant_id": slug})
                if backup[name]:
                    await db[name].insert_many(backup[name])
            raise
        # Update tenant
        await db.tenants.update_one({"id": tenant_id}, {"$set": {
            "employee_count": len(emps), "seed_manifest": manifest,
        }})
        return {"message": f"{tenant['name']} için {len(emps)} çalışan oluşturuldu", "employees": len(emps), "branches": len(branches), "manifest": manifest}

    @tenant_router.post("/{tenant_id}/import-excel")
    async def import_excel_data(tenant_id: str, request: Request):
        """Import data from a pre-uploaded TUSAŞ Excel file."""
        await require_admin(request, db)
        tenant = await db.tenants.find_one({"id": tenant_id})
        if not tenant:
            raise HTTPException(404, "Müşteri bulunamadı")
        slug = tenant["slug"]
        import os
        filepath = os.path.join(os.path.dirname(__file__), "uploads", f"{slug}_data.xlsx")
        if not os.path.exists(filepath):
            raise HTTPException(404, "Veri dosyası bulunamadı. Önce dosyayı yükleyin.")
        from tusas_importer import import_tusas_calisanlar, import_tusas_recruitment, import_tusas_yetenek
        from server import generate_employee_skills, generate_norm_kadro_data, generate_ek_kadro_talepleri
        # Clear existing tenant data
        for coll in ["employees", "recruitment", "talent_programs", "ek_kadro_talepleri", "norm_kadro"]:
            await db[coll].delete_many({"tenant_id": slug})
        # Import employees
        emps = import_tusas_calisanlar(filepath, slug)
        import hashlib
        import random as rnd
        for emp in emps:
            stable_seed = int.from_bytes(hashlib.sha256(str(emp['id']).encode()).digest()[:8], "big")
            rnd.seed(stable_seed)
            emp['skills'] = generate_employee_skills(emp.get('department',''), emp.get('band','B'), sector=tenant.get('sector','Savunma/Havacılık'))
        if emps:
            await db.employees.insert_many(emps)
        # Import recruitment
        recruitment = import_tusas_recruitment(filepath, slug)
        if recruitment:
            await db.recruitment.insert_many(recruitment)
        # Import talent programs
        talent = import_tusas_yetenek(filepath, slug)
        if talent:
            await db.talent_programs.insert_many(talent)
        # Generate Norm Kadro & Ek Kadro from imported employees
        sector = tenant.get("sector", "Savunma/Havacılık")
        norm_kadro = generate_norm_kadro_data(emps, sector=sector)
        for nk in norm_kadro:
            nk["tenant_id"] = slug
        if norm_kadro:
            await db.norm_kadro.insert_many(norm_kadro)
        ek_kadro = generate_ek_kadro_talepleri(sector=sector, count=40)
        for ek in ek_kadro:
            ek["tenant_id"] = slug
        if ek_kadro:
            await db.ek_kadro_talepleri.insert_many(ek_kadro)
        # Update tenant
        active_count = len([e for e in emps if e["status"] == "active"])
        await db.tenants.update_one({"id": tenant_id}, {"$set": {"employee_count": active_count}})
        return {
            "message": f"{tenant['name']} için veriler yüklendi",
            "employees": len(emps),
            "active": active_count,
            "recruitment": len(recruitment),
            "talent_programs": len(talent),
        }


    @tenant_router.post("/{tenant_id}/publish")
    async def publish_tenant(tenant_id: str, request: Request):
        await require_admin(request, db)
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
        now = datetime.now(timezone.utc)
        token = pyjwt.encode(
            {"slug": slug, "type": "report", "iat": now,
             "jti": str(uuid.uuid4()), "exp": now + timedelta(hours=1)},
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
        tenant = await db.tenants.find_one({"slug": slug, "status": "published"}, {"_id": 0, "name": 1, "slug": 1, "logo_url": 1, "primary_color": 1, "report_title": 1, "sector": 1})
        if not tenant:
            raise HTTPException(404, "Rapor bulunamadı")
        return {"name": tenant["name"], "slug": tenant["slug"], "logo_url": tenant.get("logo_url", ""),
                "primary_color": tenant.get("primary_color", "#0D9488"), "report_title": tenant.get("report_title", ""),
                "sector": tenant.get("sector", "Bankacılık")}

    @tenant_router.post("/{tenant_id}/upload-logo")
    async def upload_logo(tenant_id: str, request: Request):
        """Upload tenant logo via base64 data URL."""
        await require_admin(request, db)
        tenant = await db.tenants.find_one({"id": tenant_id})
        if not tenant:
            raise HTTPException(404, "Müşteri bulunamadı")
        body = await request.json()
        logo_data = body.get("logo_url", "")
        if not logo_data:
            raise HTTPException(400, "Logo verisi gerekli")
        # If it's a base64 data URL, save to file
        if not logo_data.startswith("data:") or "," not in logo_data:
            raise HTTPException(400, "Logo, PNG/JPEG/WEBP data URL olarak gönderilmeli")
        header, b64data = logo_data.split(",", 1)
        media_type = header[5:].split(";", 1)[0].lower()
        if media_type not in LOGO_FORMATS or ";base64" not in header.lower():
            raise HTTPException(415, "Yalnızca PNG, JPEG ve WEBP kabul edilir; SVG yasaktır")
        try:
            decoded = base64.b64decode(b64data, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(400, "Geçersiz base64 logo")
        if len(decoded) > MAX_LOGO_BYTES:
            raise HTTPException(413, "Logo 2 MB sınırını aşıyor")
        ext, magic = LOGO_FORMATS[media_type]
        if not decoded.startswith(magic) or (media_type == "image/webp" and decoded[8:12] != b"WEBP"):
            raise HTTPException(415, "Logo içeriği belirtilen formatla eşleşmiyor")
        filename = f"{tenant['slug']}_logo.{ext}"
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        filepath = UPLOAD_DIR / filename
        filepath.write_bytes(decoded)
        logo_url = f"/api/uploads/{filename}"
        await db.tenants.update_one({"id": tenant_id}, {"$set": {"logo_url": logo_url}})
        return {"logo_url": logo_url}

    @tenant_router.post("/{tenant_id}/upload-excel")
    async def upload_excel(tenant_id: str, request: Request, file: UploadFile = File(...)):
        await require_admin(request, db)
        tenant = await db.tenants.find_one({"id": tenant_id})
        if not tenant:
            raise HTTPException(404, "Müşteri bulunamadı")
        slug = tenant["slug"]
        if not file.filename or not file.filename.lower().endswith(".xlsx"):
            raise HTTPException(415, "Yalnızca .xlsx dosyaları kabul edilir")
        content = await _read_limited(file, MAX_EXCEL_BYTES)
        _validate_xlsx(content, file.content_type or "")
        from excel_handler import parse_excel
        try:
            data = parse_excel(content, slug)
        except Exception as e:
            logger.warning("Tenant XLSX parsing failed", exc_info=e)
            raise HTTPException(400, "Excel dosyası işlenemedi")
        if sum(len(rows) for rows in data.values() if isinstance(rows, list)) > 100_000:
            raise HTTPException(413, "Excel satır sayısı sınırı aşıldı")
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
