# Plenalitik — Enterprise HR & Sales Analytics Platform

## Original Problem Statement
Multi-tenant HR Analytics platform with sector-specific taxonomies, AI forecasting, custom report designer, and all analytics modules populated with data.

## Architecture
- **Frontend**: React, Tailwind CSS, Recharts, Shadcn/UI, xlsx, html2canvas/jspdf
- **Backend**: FastAPI, Python, MongoDB, PyJWT, bcrypt, openpyxl
- **Integrations**: Emergent LLM Key (GPT-5.2) for AI Forecasting/Action Center

## Completed Features
- ✅ Multi-tenant, 4 sectors (Bankacılık, Perakende, Teknoloji, Savunma/Havacılık)
- ✅ All filters: Department, HRBP, Project, Segment, Year
- ✅ Excel Export on 15+ pages
- ✅ TUSAŞ: 2400 emp + 3000 recruitment + 700 talent + 2065 engagement + 3595 training
- ✅ Savunma sektörü: 76 yetkinlik, 21 cluster, 8 kariyer yolu, 14 departman
- ✅ All analytics pages populated for TUSAŞ:
  - Skills Map (76 unique), Engagement (6.7/10, eNPS 20.6), Learning (3595 progs, 91920 hrs)
  - Career (524 talent pool), Succession (109 critical), Burnout (risk scoring)
- ✅ Rapor Tasarımcısı: 5 veri kaynağı, 24 KPI şablonu, rapor CRUD + execute

## Tenants
- `yapikredi` — Bankacılık | `parakende` — Perakende | `turknet` — Teknoloji | `tusas` — Savunma

## Upcoming / Backlog
- **P0**: Dashboard grid yönetimi (Rapor Tasarımcısı Faz 2)
- **P1**: server.py modülarizasyonu (~4137 satır)
