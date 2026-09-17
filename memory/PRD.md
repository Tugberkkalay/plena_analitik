# Plenalitik — Enterprise HR & Sales Analytics Platform

## Original Problem Statement
Multi-tenant HR Analytics platform with sector-specific taxonomies, AI forecasting, customizable public report pages, and a Report Designer for custom KPI/report creation.

## Architecture
- **Frontend**: React, Tailwind CSS, Recharts, Shadcn/UI, xlsx, html2canvas/jspdf
- **Backend**: FastAPI, Python, MongoDB, PyJWT, bcrypt, openpyxl
- **Integrations**: Emergent LLM Key (GPT-5.2) for AI Forecasting/Action Center

## Completed Features
- ✅ Multi-tenant admin, branding, Excel import/export, PDF, Turkish UI
- ✅ 4 Sector Taxonomies: Bankacılık, Perakende, Teknoloji, Savunma/Havacılık
- ✅ Department, HRBP & Project Filters across all endpoints
- ✅ Excel Export on 15+ table-heavy pages
- ✅ All HR modules: Kadro (4), İşe Alım (6), Planlama, Kariyer, Şube, AI
- ✅ TUSAŞ Tenant: Real Excel imported (2400 emp, 3000 recruitment, 700 talent)
- ✅ Yetenek Programları + Güvenlik Soruşturması pages
- ✅ **Rapor Tasarımcısı Faz 1** (Sep 2026):
  - Veri sözlüğü: 3 veri kaynağı (Çalışanlar 25 kolon, İşe Alım 16, Yetenek 7)
  - 15 hazır KPI şablonu (Turnover, Gönüllü Turnover, Time-to-Hire, Kadın Oranı, vb.)
  - Rapor oluşturma: boyut/ölçüt seçimi, 5 grafik türü (tablo, çubuk, çizgi, pasta, KPI kart)
  - Filtre tanımlama (eq, ne, gt, lt, contains, in)
  - Koşullu biçimlendirme (eşik değere göre renk)
  - Canlı önizleme + Excel export
  - Rapor kaydetme, düzenleme, silme, kopyalama

## Tenants
- `yapikredi` — Bankacılık (500 emp)
- `parakende` — Perakende
- `turknet` — Teknoloji (850 emp)
- `tusas` — Savunma/Havacılık (2400 emp, Excel-imported)

## Upcoming / Backlog
- **P0**: Rapor Tasarımcısı Faz 2 — Dashboard grid, ortak filtreler, sürükle-bırak widget
- **P1**: Refactor server.py into modular route files
- **P2**: Rapor Tasarımcısı Faz 3 — Yetki/paylaşım, zamanlanmış raporlar
