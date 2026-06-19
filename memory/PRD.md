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
  - Perakende: 10 departments, 37 competencies, 10 career paths, 6 strategic objectives
  - Bankacılık: 10 departments, 175 skills, banking career paths, 7 strategic objectives
- ✅ **Segment Filtering** (Feb 2026): Perakende tenants show segment filter (Mağaza/Perakende, Üretim, Merkez Ofis)
  - Replaces country filter for retail tenants
  - Each segment filters employees by their department group
  - All 30+ dashboard endpoints support segment parameter
  - Frontend auto-appends segment via Axios interceptor
  - Skills Map V2 updated - removed hardcoded "Bankacılık" labels

## Sector Taxonomy System
- `taxonomy_loader.py`: Provides `get_sector_config(sector)` returning full config dict
  - Includes DEPT_SEGMENT_MAP mapping departments to segments for Perakende
  - Banking: Uses existing JSON files (skills.json, roles.json, etc.)
  - Retail: Derived from `perakende_kutuphane.json`
- Every endpoint resolves tenant sector via `_resolve_sector(tenant_slug)`

## Segment Filtering (Perakende Only)
- Segments: Mağaza / Perakende, Üretim, Merkez Ofis
- Department → Segment mapping:
  - Mağaza Satış, Görsel Düzenleme, Perakende Operasyon → Mağaza / Perakende
  - Üretim, Kalite Kontrol, Bakım ve Teknik → Üretim
  - Tasarım ve Ar-Ge, Kategori Yönetimi, İK ve Destek, Dijital ve E-ticaret → Merkez Ofis
- Frontend: tenantInterceptor.js handles segment auto-append to API calls
- Backend: get_filtered() filters employees by segment field

## Key DB Schema
- `tenants`: {id, name, slug, sector, color, logo_url, report_title, password_hash, status, created_at}
- `employees`: All have `tenant_id` and `segment` fields (segment populated during seed)

## Upcoming
- P1: server.py modülerleştirme (~2800+ satır → route/service/model dosyalarına bölme)
- P2: Alert Resolution DB persistence
- P2: Excel import'ta segment alanını otomatik doldurma (DEPT_SEGMENT_MAP kullanarak)
- P2: Additional sector taxonomies
