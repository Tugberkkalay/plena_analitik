# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
Multi-tenant HR analytics SaaS for Banking/Finance sector. Admin creates client-specific reports, seeds data per tenant, publishes them. Clients access their reports via unique URL with password protection.

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI, react-simple-maps
- Backend: FastAPI, Python, Motor (MongoDB), JWT auth, bcrypt
- AI: GPT-5.2 via Emergent LLM Key
- Auth: JWT cookies (httponly), single admin account, per-tenant access passwords
- Multi-tenant: All data collections filtered by `tenant_id` query param

## Routing
- `/login` — Admin login page
- `/admin` — Admin dashboard (tenant CRUD, seed, publish)
- `/admin/rapor/:slug/*` — Admin report view (full sidebar dashboard, tenant-filtered)
- `/raporlar/:slug` — Public report access (password gate → full report dashboard)
- `/*` — Redirects to `/login`

## Multi-Tenant System
- `tenants` collection: {id, name, slug, sector, access_password_hash, status, employee_count}
- All data collections have `tenant_id` field matching tenant slug
- Axios interceptor auto-appends `?tenant=<slug>` to all API calls when in tenant context
- Backend `get_filtered()` accepts optional `tenant` param for MongoDB filtering
- 30+ API endpoints support tenant-aware filtering

## API Endpoints
### Auth
- `POST /api/auth/login` — Admin login
- `GET /api/auth/me` — Current user
- `POST /api/auth/logout` — Logout

### Tenant Management (Admin only)
- `GET/POST /api/tenants` — List/Create
- `GET/PUT/DELETE /api/tenants/{id}` — CRUD
- `POST /api/tenants/{id}/seed` — Generate data (500 employees + branches + sales)
- `POST /api/tenants/{id}/publish` — Publish

### Public Access
- `GET /api/tenants/public/{slug}/check` — Check tenant exists
- `POST /api/tenants/public/{slug}/verify` — Verify password, get report token

### Dashboard (all accept `?tenant=<slug>`)
- 30+ endpoints for overview, headcount, turnover, recruitment, performance, etc.

## Completed (Faz 1 + Faz 2)
- ✅ Admin auth (JWT + bcrypt + httponly cookies)
- ✅ Admin dashboard with tenant CRUD
- ✅ Tenant data seeding (500 employees + branches + sales)
- ✅ Publish/Draft flow
- ✅ Public report password gate
- ✅ Public report full dashboard (22 modules, tenant-filtered)
- ✅ Admin report view (full sidebar dashboard, tenant-filtered)
- ✅ Axios interceptor for auto tenant param injection
- ✅ All 30+ backend endpoints support tenant filtering

## Upcoming
- P1: PDF export (per module + full pack)
- P1: server.py modülerleştirme
- P2: Additional sector taxonomies
- P2: Alert Resolution DB persistence
