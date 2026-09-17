# Plenalitik — Enterprise HR & Sales Analytics Platform

## Original Problem Statement
Develop an Enterprise HR Analytics application ("Plenalitik") that serves as a multi-tenant platform with sector-specific taxonomies (Banking, Retail, Technology, Defense/Aerospace).

## Architecture
- **Frontend**: React, Tailwind CSS, Recharts, Shadcn/UI, xlsx, html2canvas/jspdf
- **Backend**: FastAPI, Python, MongoDB, PyJWT, bcrypt, openpyxl
- **Integrations**: Emergent LLM Key (GPT-5.2) for AI Forecasting/Action Center

## Completed Features
- ✅ Multi-tenant admin, branding, Excel import/export, PDF, Turkish UI
- ✅ 4 Sector Taxonomies: Bankacılık, Perakende, Teknoloji, Savunma/Havacılık
- ✅ Department & HRBP Filters + _effective_depts() across all endpoints
- ✅ Excel Export on 13 table-heavy pages
- ✅ All HR modules: Kadro, İşe Alım (4 pages), Kadro & Ücret (4 pages), Planlama, Kariyer, Şube, AI
- ✅ **TUSAŞ Tenant** (Sep 2026): Real Excel data imported — 2400 employees, 3000 recruitment records, 700 talent program participants. Savunma/Havacılık sector with 14 departments, 4 HRBPs, 3 segments, 8 projects (KAAN, HURJET, ANKA etc.)
- ✅ **Excel Data Importer** (tusas_importer.py): Converts TUSAŞ Excel (Çalışanlar, İseAlimHunisi, YetenekProgramları) to Plenalitik data model

## Tenants
- `yapikredi` — Bankacılık (500 emp, 10 depts, 5 HRBPs)
- `parakende` — Perakende (segments: Mağaza/Üretim/Merkez)
- `turknet` — Teknoloji (850 emp, 9 depts, 3 HRBPs, color: #E3000F)
- `tusas` — Savunma/Havacılık (2400 emp, 14 depts, 4 HRBPs, color: #003366, Excel-imported real data)

## Upcoming / Backlog
- **P0**: Rapor Tasarımcısı Admin Paneli (drag-and-drop report builder per Emergent_Rapor_Tasarimcisi_Gereksinim.md)
- **P1**: Refactor server.py into modular route files
- **P2**: Alert resolution persistence in Action Center
