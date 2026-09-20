"""Central authentication, tenant isolation, rate limiting, audit, and headers."""
from collections import defaultdict, deque
from datetime import datetime, timezone
from time import monotonic
from urllib.parse import parse_qsl, urlencode
import os, re

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from auth import authenticate_request


PUBLIC_EXACT = {
    "/api/",
    "/api/health",
    "/api/auth/login",
    "/api/auth/logout",
}
PUBLIC_PATTERNS = (
    re.compile(r"^/api/tenants/public/[^/]+/(check|verify)$"),
    re.compile(r"^/api/dashboards/shared/[^/]+$"),
    re.compile(r"^/api/uploads/[a-z0-9_-]+_logo\.(png|jpe?g|webp)$"),
)
REPORT_GET_PATHS = {
    # Password-protected report surface. Endpoints with person-level sections
    # redact those sections when the authenticated principal is a report token.
    "/api/dashboard/segments", "/api/dashboard/years", "/api/dashboard/overview",
    "/api/dashboard/hiring-plan", "/api/dashboard/offer-analysis",
    "/api/dashboard/norm-kadro", "/api/dashboard/teklif-analizi",
    "/api/dashboard/kaynak-analizi", "/api/dashboard/universite-analizi",
    "/api/dashboard/ise-alim-maliyet", "/api/dashboard/aday-hunisi",
    "/api/dashboard/turnover", "/api/dashboard/movement",
    "/api/dashboard/recruitment", "/api/dashboard/learning",
    "/api/dashboard/compensation", "/api/dashboard/engagement",
    "/api/dashboard/career", "/api/dashboard/hr-operations",
    "/api/dashboard/skills-map", "/api/dashboard/internal-mobility",
    "/api/dashboard/capability-forecast", "/api/dashboard/headcount-plan",
    "/api/dashboard/workforce-alignment", "/api/dashboard/org-health",
    "/api/dashboard/skills-map-v2", "/api/dashboard/positions",
    "/api/dashboard/alerts", "/api/dashboard/yetenek-programlari",
    "/api/dashboard/headcount", "/api/dashboard/hires", "/api/dashboard/leaves",
    "/api/dashboard/compensation-benchmark", "/api/dashboard/ek-kadro",
    "/api/dashboard/ucret-benchmark", "/api/dashboard/performance",
    "/api/dashboard/burnout", "/api/dashboard/guvenlik-sorusturmasi",
    "/api/dashboard/survey-analytics",
    "/api/career-paths",
}
REPORT_GET_PATTERNS = (
    re.compile(r"^/api/career-paths/[a-z0-9-]+$"),
)
REPORT_POST_PATHS = set()
MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def _is_public(path: str) -> bool:
    return path in PUBLIC_EXACT or any(pattern.match(path) for pattern in PUBLIC_PATTERNS)


def _report_route_allowed(method: str, path: str) -> bool:
    if method == "GET":
        return path in REPORT_GET_PATHS or any(pattern.fullmatch(path) for pattern in REPORT_GET_PATTERNS)
    return method == "POST" and path in REPORT_POST_PATHS


def _bind_tenant(request: Request, tenant_id: str) -> None:
    pairs = parse_qsl(request.scope.get("query_string", b"").decode(), keep_blank_values=True)
    requested = [value for key, value in pairs if key == "tenant" and value]
    if requested and any(value != tenant_id for value in requested):
        raise HTTPException(status_code=403, detail="Başka bir tenant verisine erişilemez")
    pairs = [(key, value) for key, value in pairs if key != "tenant"]
    pairs.append(("tenant", tenant_id))
    request.scope["query_string"] = urlencode(pairs, doseq=True).encode()
    request.__dict__.pop("_query_params", None)


class SlidingWindowLimiter:
    def __init__(self):
        self.events = defaultdict(deque)

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        now = monotonic()
        bucket = self.events[key]
        while bucket and bucket[0] <= now - window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True


class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, db):
        super().__init__(app)
        self.db = db
        self.limiter = SlidingWindowLimiter()

    async def _audit(self, request, principal, status_code, client_ip, event="mutation", reason=None):
        try:
            record = {
                "timestamp": datetime.now(timezone.utc),
                "event": event,
                "actor_type": principal.get("type") if principal else "anonymous",
                "actor_id": (principal or {}).get("user_id"),
                "actor_email": (principal or {}).get("email"),
                "tenant_id": (principal or {}).get("tenant_id"),
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "client_ip": client_ip,
            }
            if reason:
                record["reason"] = str(reason)[:200]
            await self.db.audit_logs.insert_one(record)
        except Exception:
            pass

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"

        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > 12 * 1024 * 1024:
                    return JSONResponse(status_code=413, content={"detail": "İstek gövdesi boyut sınırını aşıyor"})
            except ValueError:
                return JSONResponse(status_code=400, content={"detail": "Geçersiz Content-Length"})

        if request.method == "OPTIONS":
            return await call_next(request)

        rate_rule = None
        rate_name = None
        if path == "/api/auth/login":
            rate_rule = (10, 300)
            rate_name = "login"
        elif re.match(r"^/api/tenants/public/[^/]+/verify$", path):
            rate_rule = (10, 600)
            rate_name = "report_verify"
        elif re.match(r"^/api/dashboards/shared/[^/]+$", path):
            rate_rule = (20, 600)
            rate_name = "shared_dashboard"
        if rate_rule and not self.limiter.allow(f"{client_ip}:{rate_name}", *rate_rule):
            await self._audit(request, None, 429, client_ip, event="rate_limit")
            return JSONResponse(
                status_code=429,
                content={"detail": "Çok fazla deneme. Lütfen daha sonra tekrar deneyin."},
                headers={"Retry-After": str(rate_rule[1])},
            )

        principal = None
        if path.startswith("/api") and not _is_public(path):
            try:
                principal = await authenticate_request(request, self.db)
                request.state.principal = principal
                if principal["type"] == "report":
                    if not _report_route_allowed(request.method, path):
                        raise HTTPException(status_code=403, detail="Rapor tokenı bu işlem için yetkili değil")
                    _bind_tenant(request, principal["tenant_id"])
                elif principal.get("role") != "admin":
                    if not principal.get("tenant_id"):
                        raise HTTPException(status_code=403, detail="Kullanıcıya tenant atanmamış")
                    _bind_tenant(request, principal["tenant_id"])
                request.state.tenant_id = principal.get("tenant_id")
            except HTTPException as exc:
                await self._audit(
                    request, principal, exc.status_code, client_ip,
                    event="authorization_denied", reason=exc.detail,
                )
                return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if path.startswith("/api"):
            response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        else:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; "
                "object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
            )
        if os.environ.get("APP_ENV", "production").lower() == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        if request.method in MUTATING_METHODS and path.startswith("/api"):
            await self._audit(request, principal, response.status_code, client_ip)
        elif principal and request.method == "GET" and path.startswith("/api"):
            await self._audit(request, principal, response.status_code, client_ip, event="data_access")
        return response
