# Plenalitik — Enterprise HR & Sales Analytics Platform

## Original Problem Statement
Multi-tenant HR Analytics platform with sector-specific taxonomies (Banking, Retail, Technology, Defense/Aerospace), AI forecasting, and customizable public report pages.

## Architecture
- **Frontend**: React, Tailwind CSS, Recharts, Shadcn/UI, xlsx, html2canvas/jspdf
- **Backend**: FastAPI, Python, MongoDB, PyJWT, bcrypt, openpyxl
- **Integrations**: Emergent LLM Key (GPT-5.2) for AI Forecasting/Action Center

## Completed Features
- ✅ Multi-tenant admin, branding, Excel import/export, PDF, Turkish UI
- ✅ 4 Sector Taxonomies: Bankacılık, Perakende, Teknoloji, Savunma/Havacılık
- ✅ Department, HRBP & Project Filters with _effective_depts() across all endpoints
- ✅ Excel Export on 15+ table-heavy pages
- ✅ Kadro & Ücret (4 pages), İşe Alım (6 pages), Planlama, Kariyer, Şube, AI
- ✅ **TUSAŞ Tenant** (Sep 2026): Real Excel imported — 2400 employees, 3000 recruitment, 700 talent programs
- ✅ **Project Filter** (Sep 2026): Dropdown for KAAN/HURJET/ANKA/AKSUNGUR/GOKBEY/A400M/Uzay Sistemleri/Genel
- ✅ **Yetenek Programları Page** (Sep 2026): SKY/LIFT UP/MGP dönüşüm oranları, üniversite/cinsiyet dağılımı
- ✅ **Güvenlik Soruşturması Page** (Sep 2026): Aşama hunisi, süre dağılımı, departman bazlı güvenlik metrikleri

## Tenants
- `yapikredi` — Bankacılık (500 emp, 10 depts, 5 HRBPs)
- `parakende` — Perakende (segments: Mağaza/Üretim/Merkez)
- `turknet` — Teknoloji (850 emp, 9 depts, 3 HRBPs)
- `tusas` — Savunma/Havacılık (2400 emp, 14 depts, 4 HRBPs, 8 projects, Excel-imported)

## Upcoming / Backlog
- **P0**: Rapor Tasarımcısı — KPI/veri tanımlama, hesaplama tanımlama, rapor tanımlama
- **P1**: Refactor server.py (~4132 lines) into modular route files
- **P2**: Alert resolution persistence
