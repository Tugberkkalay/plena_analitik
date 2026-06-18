# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
Multi-tenant HR analytics SaaS for Banking/Finance sector. Admin creates client-specific reports, seeds data per tenant, publishes them. Clients access their reports via unique URL with password protection.

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI, react-simple-maps, jsPDF, html2canvas
- Backend: FastAPI, Python, Motor (MongoDB), JWT auth, bcrypt
- AI: GPT-5.2 via Emergent LLM Key

## Routing
- `/login` — Admin login page
- `/admin` — Admin dashboard (tenant CRUD, seed, publish)
- `/admin/rapor/:slug/*` — Admin report view (full sidebar dashboard, tenant-filtered)
- `/raporlar/:slug` — Public report access (password gate → full report dashboard)

## Multi-Tenant System
- Axios interceptor auto-appends `?tenant=<slug>` to all API calls
- Backend `get_filtered()` + all endpoints accept optional `tenant` param
- 30+ API endpoints tenant-aware

## Completed
- ✅ Admin auth (JWT + bcrypt + httponly cookies)
- ✅ Admin dashboard with tenant CRUD
- ✅ Tenant data seeding
- ✅ Publish/Draft flow
- ✅ Public report password gate + full dashboard
- ✅ Admin report view
- ✅ PDF Export (Print CSS + jsPDF/html2canvas download)
- ✅ Career Path Visualization with Readiness Score
- ✅ Skills Map V2 with 12-cluster drill-down
- ✅ Full Turkish localization
- ✅ Plena AI branding

## Upcoming
- P1: server.py modülerleştirme (~2700 satır)
- P2: Additional sector taxonomies
- P2: Alert Resolution DB persistence
