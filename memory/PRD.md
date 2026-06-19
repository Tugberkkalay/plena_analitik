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
- ✅ **Dynamic Sector Taxonomy** (Feb 2026): Banking vs Retail taxonomy auto-switches based on tenant.sector
  - Perakende: 10 departments (Mağaza Satış, Üretim, Kalite Kontrol, etc.), 37 competencies, 10 career paths, 6 strategic objectives
  - Bankacılık: 10 departments, 175 skills, banking career paths, 7 strategic objectives
  - All dashboard endpoints, data seeding, AI prompts use sector-aware config

## Sector Taxonomy System
- `taxonomy_loader.py`: Provides `get_sector_config(sector)` returning full config dict
- Banking: Uses existing JSON files (skills.json, roles.json, career-paths.json, etc.)
- Retail: Derived from `perakende_kutuphane.json` (segments → departments, competencies → skills)
- Every endpoint resolves tenant sector via `_resolve_sector(tenant_slug)` and uses config

## Excel Import System
- Template: 7 sheets with Turkish headers, sample rows, formatted
- Upload: Parse xlsx → clear tenant data → insert to 6 collections
- Collections: employees, branches, sales_performance, recruitment, training, engagement

## Key DB Schema
- `tenants`: {id, name, slug, sector, color, logo_url, report_title, password_hash, status, created_at}
- `employees`, `branches`, `sales_performance`, `recruitment`, `training`, `engagement`: All have `tenant_id` field

## Upcoming
- P1: server.py modülerleştirme (~2800 satır → route/service/model dosyalarına bölme)
- P2: Alert Resolution DB persistence
- P2: Additional sector taxonomies (Savunma, Teknoloji, etc.)
