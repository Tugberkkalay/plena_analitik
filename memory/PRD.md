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
- ✅ **Department & HRBP Filters** (Jul 2026): Dropdowns in TopBar (admin) and public report page, synced to Axios interceptor, triggers data refetch
- ✅ **Excel Export** (Jul 2026): "Excel'e Aktar" button on all 8 table-heavy pages (NormKadro, EkKadro, TeklifAnalizi, UcretBenchmark, KaynakAnalizi, UniversiteAnalizi, MaliyetAnalizi, AdayHunisi) via xlsx library and reusable ExcelExportButton component

## Sidebar Structure
- İşgücü: Genel Bakış, Kadro, Alım & Ayrılma, Devir, Hareket
- Kadro & Ücret: Norm Kadro, Ek Kadro Talepleri, Teklif Analizi, Ücret Benchmark
- İşe Alım: Kaynak Analizi, Üniversite Analizi, Maliyet Analizi, Aday Hunisi
- Planlama: Kadro Planlama, Strateji Hizalama, Org Sağlığı, Yetkinlik, Senaryo, Yedekleme
- Kariyer & Gelişim, Şube, AI, Ayarlar

## Upcoming / Backlog
- **P1**: Refactor `server.py` (~3900 lines) into modular route files
- **P2**: Persist alert resolutions in Action Center to DB
- **P2**: HRBP back-fill migration for existing employee data
- **P3**: Responsive TopBar filter grouping for narrow screens
- **P3**: Validate department/hrbp query params against tenant taxonomy

## Key Files
- `/app/backend/server.py` — Core backend monolith
- `/app/frontend/src/App.js` — Routing, TopBar, filter state management
- `/app/frontend/src/lib/tenantInterceptor.js` — Axios interceptor for tenant/segment/dept/hrbp
- `/app/frontend/src/lib/exportToExcel.js` — Excel export utility
- `/app/frontend/src/components/ExcelExportButton.jsx` — Reusable export button
- `/app/frontend/src/components/ChartCard.jsx` — Chart card with headerRight prop
- `/app/frontend/src/pages/PublicReportPage.jsx` — Public report with filters

## Tenants
- `yapikredi` — Bankacılık (10 departments, 5 HRBPs)
- `parakende` — Perakende (segments: Lüks, Günlük, Ekonomi)
