"""Authentication utilities for Plenalitik."""
import os
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request
from bson import ObjectId
from typing import Optional

JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def validate_security_config():
    """Fail closed when required authentication settings are missing."""
    required = ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"]
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        raise RuntimeError(f"Missing required security settings: {', '.join(missing)}")

    environment = os.environ.get("APP_ENV", "production").lower()
    if environment == "production":
        if len(os.environ["JWT_SECRET"]) < 32:
            raise RuntimeError("JWT_SECRET must be at least 32 characters in production")
        if len(os.environ["ADMIN_PASSWORD"]) < 12:
            raise RuntimeError("ADMIN_PASSWORD must be at least 12 characters in production")
        if os.environ.get("COOKIE_SECURE", "true").lower() != "true":
            raise RuntimeError("COOKIE_SECURE must be true in production")
    if len(os.environ["ADMIN_PASSWORD"].encode("utf-8")) > 72:
        raise RuntimeError("ADMIN_PASSWORD exceeds bcrypt's 72-byte limit")

def hash_password(password: str) -> str:
    encoded = password.encode("utf-8")
    if len(encoded) > 72:
        raise HTTPException(status_code=400, detail="Şifre 72 bayttan uzun olamaz")
    return bcrypt.hashpw(encoded, bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    encoded = plain.encode("utf-8")
    if len(encoded) > 72:
        return False
    try:
        return bcrypt.checkpw(encoded, hashed.encode("utf-8"))
    except ValueError:
        return False

def create_access_token(user_id: str, email: str, role: str, tenant_id: Optional[str] = None) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "tenant_id": tenant_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def decode_token(token: str, expected_type: Optional[str] = None) -> dict:
    payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    if expected_type and payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Unexpected token type")
    return payload

def get_request_token(request: Request) -> Optional[str]:
    """Prefer an explicit bearer token so public-report sessions can override admin cookies."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return request.cookies.get("access_token")

async def authenticate_request(request: Request, db) -> dict:
    token = get_request_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Giriş yapılmamış")
    try:
        payload = decode_token(token)
        token_type = payload.get("type")
        if token_type == "report":
            slug = payload.get("slug")
            if not slug:
                raise HTTPException(status_code=401, detail="Geçersiz rapor tokenı")
            tenant = await db.tenants.find_one({"slug": slug, "status": "published"}, {"_id": 1})
            if not tenant:
                raise HTTPException(status_code=401, detail="Rapor erişimi artık geçerli değil")
            return {"type": "report", "tenant_id": slug, "role": "report", "claims": payload}
        if token_type != "access":
            raise HTTPException(status_code=401, detail="Geçersiz token")

        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        return {
            "type": "user",
            "user_id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "viewer"),
            "tenant_id": user.get("tenant_id"),
            "claims": payload,
        }
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")

async def get_current_user(request: Request, db) -> dict:
    principal = getattr(request.state, "principal", None)
    if principal is None:
        principal = await authenticate_request(request, db)
    if principal.get("type") != "user":
        raise HTTPException(status_code=403, detail="Kullanıcı oturumu gerekli")
    return {
        "id": principal["user_id"],
        "email": principal["email"],
        "name": principal["name"],
        "role": principal["role"],
        "tenant_id": principal.get("tenant_id"),
    }

async def require_admin(request: Request, db) -> dict:
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    return user

async def seed_admin(db):
    validate_security_config()
    admin_email = os.environ["ADMIN_EMAIL"].strip().lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email, "password_hash": hashed,
            "name": "Admin", "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    await db.users.create_index("email", unique=True)
    await db.audit_logs.create_index([("tenant_id", 1), ("timestamp", -1)])
    await db.audit_logs.create_index("timestamp", expireAfterSeconds=365 * 24 * 60 * 60)
