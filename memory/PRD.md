# Plenalitik — Enterprise HR & Sales Analytics Platform

## Original Problem Statement
Develop an Enterprise HR Analytics application ("Plenalitik") that serves as a multi-tenant platform. It must include core HR modules (recruitment, performance, succession, etc.) and custom Finance/Branch layers. The application must utilize custom sector-specific taxonomies (e.g., Banking, Retail) to drive its logic, AI forecasting, data seeding, and career planning. It features an Admin portal for tenant management and password-protected, customizable public report pages.

## Architecture
- **Frontend**: React, Tailwind CSS, Recharts, Shadcn/UI, xlsx, html2canvas/jspdf
- **Backend**: FastAPI, Python, MongoDB, PyJWT, bcrypt, openpyxl
- **Integrations**: Emergent LLM Key (GPT-5.2) for AI Forecasting/Action Center

## Completed Features
- ✅ Multi-tenant admin, branding, Excel import/export, PDF export, full Turkish UI
- ✅ Dynamic Sector Taxonomy (Banking/Retail) + Segment Filtering
- ✅ Kadro & Ücret: Norm Kadro, Ek Kadro Talepleri, Teklif Analizi, Ücret Benchmark
- ✅ İşe Alım Modülü: Kaynak Analizi, Üniversite Analizi, Maliyet Analizi, Aday Hunisi
- ✅ **Department & HRBP Filters** (Jul 2026): Full filtering across ALL endpoints. _effective_depts() helper ensures department charts only show relevant departments when HRBP is selected
- ✅ **Excel Export** (Jul 2026): "Excel'e Aktar" on 13 table-heavy pages across all modules
- ✅ **HRBP Filter Bug Fix** (Jul 2026): Department charts now properly narrow to HRBP's departments (was showing all 10 with 8 at zero)

## Upcoming / Backlog
- **P1**: Refactor `server.py` (~3937 lines) into modular route files
- **P2**: Persist alert resolutions in Action Center to DB
- **P2**: HRBP back-fill migration for existing employee data
- **P3**: Responsive TopBar filter grouping for narrow screens
- **P3**: Show "no data" hint when Dept+HRBP intersection is empty

## Tenants
- `yapikredi` — Bankacılık (10 departments, 5 HRBPs)
- `parakende` — Perakende (segments: Lüks, Günlük, Ekonomi)
