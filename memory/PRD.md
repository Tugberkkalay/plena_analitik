# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
Multi-tenant HR analytics SaaS. Admin creates client reports (seed data per tenant), clients access via unique URL with password.

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI, react-simple-maps
- Backend: FastAPI, Python, Motor (MongoDB), JWT auth, bcrypt
- AI: GPT-5.2 via Emergent LLM Key
- Auth: JWT cookies (httponly), single admin account, per-tenant access passwords

## Routing
- `/login` — Admin login page
- `/admin` — Admin dashboard (tenant CRUD, seed, publish)
- `/admin/rapor/:slug/*` — Admin report view (full dashboard with sidebar)
- `/raporlar/:slug` — Public report access (password gate → iframe report viewer)

## Multi-Tenant Data Model
- `users` collection: admin account (email, password_hash, role)
- `tenants` collection: {id, name, slug, sector, access_password_hash, status, employee_count}
- All data collections (employees, branches, sales_performance, etc.) have `tenant_id` field

## API Endpoints (New)
- `POST /api/auth/login` — Admin login (sets httponly cookie)
- `GET /api/auth/me` — Get current admin user
- `POST /api/auth/logout` — Clear auth cookies
- `GET /api/tenants` — List tenants (admin only)
- `POST /api/tenants` — Create tenant (admin only)
- `GET/PUT/DELETE /api/tenants/{id}` — Tenant CRUD (admin only)
- `POST /api/tenants/{id}/seed` — Generate 500 employees + branches + sales for tenant
- `POST /api/tenants/{id}/publish` — Set tenant status to published
- `POST /api/tenants/public/{slug}/verify` — Verify tenant access password (public)
- `GET /api/tenants/public/{slug}/check` — Check if tenant exists (public)

## Completed Features
- ✅ Admin auth (JWT + bcrypt + httponly cookies)
- ✅ Admin dashboard with tenant management
- ✅ Tenant CRUD (create, list, update, delete)
- ✅ Tenant data seeding (500 employees + branches + sales per tenant)
- ✅ Publish/unpublish flow
- ✅ Public report password gate
- ✅ Login page (Turkish UI)
- ✅ Route restructuring (login → admin → public reports)

## Upcoming Tasks
- P0: Public report viewer rendering (iframe or embedded dashboard)
- P0: Admin "Raporları Gör" navigation to full dashboard per tenant
- P1: PDF export (per module + full report pack)
- P1: server.py modülerleştirme
- P2: Alert Resolution DB persistence
- P2: Additional sector taxonomies
