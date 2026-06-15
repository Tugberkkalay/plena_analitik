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
### Yetenek (8): İç Mobilite, İşe Alım, Performans, Eğitim, Ücret, Bağlılık, Kariyer Yetenek, AI Kariyer Gelişimi
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
- Staffing quadrant (achievement vs fill rate)
- Turkey map with interactive pins (react-simple-maps)
- 3 new alert sources: Şube Satış, Şube Sirkülasyon, Şube Kadro

## Completed (Latest Session - 15 Jun 2026)
- ✅ Career Path Visualization: Interactive career ladder with 18 banking career paths, step-by-step progression, expandable transition conditions and required skills
- ✅ Career Path Browser: Browsable catalog grouped by family (Kredi ve Risk, Şube ve Bireysel Bankacılık, etc.) with 5-column layout
- ✅ Skills Map V2 Cluster Drill-Down: 12 expandable cluster cards with 175 skills, proficiency bars, kritiklik labels, expert counts
- ✅ Skills Map Tab Navigation: 3 views (Yetkinlik Kümeleri, Açık Analizi, Isı Haritası)
- ✅ Cluster Summary Bar Chart: Horizontal bar chart showing avg proficiency per cluster
- ✅ STRATEGIC_OBJECTIVES updated to banking taxonomy skills (was generic IT skills causing 0% coverage)
- ✅ TARGET_HEADCOUNT updated to match banking departments
- ✅ DEPT_SKILL_FOCUS added (was undefined, causing potential runtime errors)
- ✅ English text remnants fixed to Turkish (gap severity labels, demand/supply legends, action suggestions)
- ✅ New API endpoints: GET /api/career-paths, GET /api/career-paths/{path_id}

## Upcoming Tasks
- P1: server.py modülerleştirme (~2600 satır → routes, models, seed ayrımı)
- P2: Alert Resolution Persistence (DB'ye kaydedilme)
- P2: Workforce Alignment and Headcount Plan pages - verify they render correctly with updated banking data
