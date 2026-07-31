# Plenalitik — Enterprise HR & Sales Analytics Platform

## Original Problem Statement
Develop an Enterprise HR Analytics application ("Plenalitik") that serves as a multi-tenant platform. It must include core HR modules (recruitment, performance, succession, etc.) and custom Finance/Branch layers. The application must utilize custom sector-specific taxonomies (e.g., Banking, Retail, Teknoloji) to drive its logic, AI forecasting, data seeding, and career planning.

## Architecture
- **Frontend**: React, Tailwind CSS, Recharts, Shadcn/UI, xlsx, html2canvas/jspdf
- **Backend**: FastAPI, Python, MongoDB, PyJWT, bcrypt, openpyxl
- **Integrations**: Emergent LLM Key (GPT-5.2) for AI Forecasting/Action Center

## Completed Features
- ✅ Multi-tenant admin, branding, Excel import/export, PDF export, full Turkish UI
- ✅ Dynamic Sector Taxonomy (Banking/Retail/Teknoloji) + Segment Filtering
- ✅ Department & HRBP Filters with _effective_depts() helper across all endpoints
- ✅ Excel Export ("Excel'e Aktar") on 13 table-heavy pages
- ✅ Kadro & Ücret: Norm Kadro, Ek Kadro Talepleri, Teklif Analizi, Ücret Benchmark
- ✅ İşe Alım: Kaynak Analizi, Üniversite Analizi, Maliyet Analizi, Aday Hunisi
- ✅ **TürkNet Tenant (Teknoloji Sektörü)** (Jul 2026):
  - 9 departman (Müşteri Deneyimi %40, Network & Altyapı %19, Teknoloji & Ar-Ge %15, vb.)
  - 850 çalışan, 3 HRBP (Selin Yılmaz, Burcu Aydın, Emre Karaca)
  - 4 segment (Operasyon, Teknoloji, Ticari, Destek)
  - Telekom sektörüne özel devir oranları (Müşteri Deneyimi 2.2x, Teknoloji 0.9x)
  - Sektör bazlı maaş benchmark, pozisyon yapısı, stratejik hedefler

## Tenants
- `yapikredi` — Bankacılık (10 departments, 5 HRBPs, ~500 employees)
- `parakende` — Perakende (10 departments, 4 HRBPs, segments: Mağaza/Üretim/Merkez)
- `turknet` — Teknoloji (9 departments, 3 HRBPs, 850 employees, color: #E3000F)

## Upcoming / Backlog
- **P1**: Refactor `server.py` (~3937 lines) into modular route files
- **P2**: Persist alert resolutions in Action Center to DB
- **P2**: HRBP back-fill migration for existing employee data
- **P3**: Responsive TopBar filter grouping for narrow screens
