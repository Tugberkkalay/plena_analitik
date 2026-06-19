# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
Multi-tenant HR analytics SaaS. Admin manages clients, seeds/imports data, publishes branded reports. Supports sector-specific taxonomies (Banking, Retail) that drive departments, skills, career paths, and AI logic.

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI, jsPDF, html2canvas
- Backend: FastAPI, Python, Motor (MongoDB), JWT auth, bcrypt, openpyxl
- AI: GPT-5.2 via Emergent LLM Key
- Taxonomy: `taxonomy_loader.py` dynamically provides sector configs

## Completed Features
- ✅ Multi-tenant admin (CRUD, seed, publish, branding)
- ✅ Public report with password gate + full grouped sidebar
- ✅ Tenant branding (logo upload incl. SVG, color palette, report title)
- ✅ PDF export (jsPDF + html2canvas)
- ✅ Excel template download (7 sheets) + Excel data import
- ✅ 30+ tenant-filtered API endpoints
- ✅ Career Path Visualization, Skills Map V2, Full Turkish UI
- ✅ Dynamic Sector Taxonomy: Banking vs Retail auto-switch based on tenant.sector
- ✅ Segment Filtering: Perakende tenants show Mağaza/Üretim/Merkez Ofis filter
- ✅ Realistic demo data: ~30% branches underperform, skill alerts with expert threshold
- ✅ All alert categories populated: Devir, Kadro, Org Sağlığı, Yedekleme, Yetkinlik, Şube Satış, Şube Kadro, Şube Sirkülasyon
- ✅ Succession page: Risk colors fixed (TR keys), chart title translated

## Key DB Schema
- `tenants`: {id, name, slug, sector, color, logo_url, report_title, password_hash, status}
- `employees`: All have `tenant_id` and `segment` fields
- `branches`, `sales_performance`, `recruitment`, `training`, `engagement`: All have `tenant_id`

## Upcoming
- P1: server.py modularization (~2800+ lines → route/service/model files)
- P2: Excel import auto-fill segment from DEPT_SEGMENT_MAP
- P2: Alert Resolution DB persistence
