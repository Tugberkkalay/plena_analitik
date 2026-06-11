# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
HR + Branch/Sales analytics for financial sector (bank/factoring). 29 modules. Turkish UI.

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI, react-simple-maps
- Backend: FastAPI, Python, Motor (MongoDB)
- AI: GPT-5.2 via Emergent LLM Key

## Modules (29 total)
### İşgücü (5): Overview, Kadro, Alım & Ayrılma, Devir, Hareket
### Planlama (6): HC Planning, WF Alignment, Org Health, Skills Map, Scenario Sim, Succession
### Satış & Şube (4): Şube Performansı, Prim & Hedef, Şube Kadro Planlama, Şube Haritası
### Yetenek (8): İç Mobilite, İşe Alım, Performans, Eğitim, Ücret, Bağlılık, Kariyer, AI Kariyer
### Öngörü (5): Aksiyon Merkezi (AI + 8 sinyal kaynağı), AI Tahmin, Yetkinlik Tahmin, Tükenmişlik, İK Ops
### Ayarlar (1): Veri Yönetimi

## Branch/Sales Layer
- 30 branches, 7 regions, 3 segments (Bireysel/Ticari/Karma)
- 126 sales reps, monthly target/actual/commission
- Tiered commission: <85%=0, 85-100%=0.5%, 100-120%=1%, 120%+=1.5%
- Staffing quadrant (achievement vs fill rate)
- Turkey map with interactive pins (react-simple-maps)
- 3 new alert sources: Şube Satış, Şube Sirkülasyon, Şube Kadro

## Upcoming (Faz 3)
- Genel Bakış'a şube performans özet kartı
- Performans sayfasına satış gerçekleşme kolonu
- server.py modülerleştirme (~2300 satır)
