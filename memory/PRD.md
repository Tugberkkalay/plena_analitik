# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
HR + Branch/Sales analytics for financial sector (bank/factoring). 29+ modules. Turkish UI. Banking taxonomy (175 skills, 44 roles, 12 clusters, 18 career paths).

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI, react-simple-maps, Phosphor Icons
- Backend: FastAPI, Python, Motor (MongoDB)
- AI: GPT-5.2 via Emergent LLM Key
- Data: Custom banking taxonomy JSONs (skills.json, roles.json, career-paths.json, skill-clusters.json, proficiency-levels.json)

## Modules (29 total)
### İşgücü (5): Overview, Kadro, Alım & Ayrılma, Devir, Hareket
### Planlama (7): HC Planning, WF Alignment, Org Health, Skills Map V2 (cluster drill-down), Scenario Sim, Succession, Yetkinlik Haritası
### Satış & Şube (4): Şube Performansı, Prim & Hedef, Şube Kadro Planlama, Şube Haritası
### Yetenek (8): İç Mobilite, İşe Alım, Performans, Eğitim, Ücret, Bağlılık, Kariyer Yetenek, AI Kariyer Gelişimi (with Readiness Score)
### Öngörü (5): Aksiyon Merkezi (AI + 8 sinyal kaynağı), AI Tahmin, Yetkinlik Tahmin, Tükenmişlik, İK Ops
### Ayarlar (1): Veri Yönetimi

## Banking Taxonomy
- **12 Clusters**: Kredi ve Risk Yönetimi, Hazine ve Sermaye Piyasaları, Bireysel Bankacılık, Kurumsal ve Ticari Bankacılık, Şube Operasyonları, Dijital Bankacılık, Uyum ve Mevzuat, Veri Analitiği ve BI, Müşteri Deneyimi ve CRM, Operasyon ve Süreç, Liderlik ve Yönetim, Davranışsal ve İletişim
- **175 Skills**: Each with kritiklik_seviyesi (çekirdek/uzmanlık/destekleyici), açıklama, ilgili_beceriler
- **44 Roles**: Each with kademe_seviyesi (1-6), gerekli_beceriler with gerekli_seviye
- **18 Career Paths**: Step-by-step with rol_id, tipik_sure_ay, gecis_kosullari, alternatif_yollar

## Branch/Sales Layer
- 30 branches, 7 regions, 3 segments (Bireysel/Ticari/Karma)
- 126 sales reps, monthly target/actual/commission
- Tiered commission: <85%=0, 85-100%=0.5%, 100-120%=1%, 120%+=1.5%

## Completed Features (Latest - 15 Jun 2026)
- ✅ Career Path Visualization: 18 career paths, step-by-step ladder, transition conditions, required skills
- ✅ Career Path Browser: Browsable catalog grouped by family
- ✅ **Readiness Score (Hazırlık Skoru)**: Per-step % readiness comparing employee skills vs required skills. Color-coded badges (red/amber/green), progress bars, expanded detail with met/unmet skill indicators and empProf/reqLevel numbers
- ✅ Skills Map V2 Cluster Drill-Down: 12 expandable cluster cards, 175 skills, 3 view tabs
- ✅ STRATEGIC_OBJECTIVES, TARGET_HEADCOUNT, DEPT_SKILL_FOCUS updated to banking taxonomy
- ✅ Turkish text fixes (gap severities, action suggestions, legends)
- ✅ New API endpoints: GET /api/career-paths, GET /api/career-paths/{path_id}

## Upcoming Tasks
- P1: server.py modülerleştirme (~2600+ satır → routes, models, seed ayrımı)
- P2: Alert Resolution Persistence (DB'ye kaydedilme)
- P2: CareerDevPage.jsx bileşen parçalama (~535 satır → CareerLadder, CareerPathBrowser ayrı dosyalara)
