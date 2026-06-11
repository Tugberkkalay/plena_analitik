# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
HR analytics platform with branch/sales layer for financial sector (bank/factoring). 25+ HR modules + 2 branch/sales modules. Turkish UI, multi-location (Turkey + Italy).

## Architecture
- Frontend: React 18, Tailwind CSS, Recharts, Shadcn UI
- Backend: FastAPI, Python, Motor (MongoDB)
- AI: OpenAI GPT-5.2 via Emergent LLM Key
- Theme: Corporate light (teal + slate)

## Modules (27 total)
### İşgücü (5): Overview, Kadro, Alım & Ayrılma, Devir, Hareket
### Planlama (6): HC Planning, WF Alignment, Org Health, Skills Map, Scenario Sim, Succession
### Satış & Şube (2 - NEW): Şube Performansı, Prim & Hedef
### Yetenek (8): İç Mobilite, İşe Alım, Performans, Eğitim, Ücret, Bağlılık, Kariyer, AI Kariyer
### Öngörü (5): Aksiyon Merkezi (AI), AI Tahmin, Yetkinlik Tahmin, Tükenmişlik, İK Ops
### Ayarlar (1): Veri Yönetimi

## Branch/Sales Layer
- 30 branches across 7 regions (Marmara, Ege, İç Anadolu, Akdeniz, Karadeniz, Doğu/Güneydoğu)
- 126 sales reps with monthly target/actual/commission data
- Tiered commission: <85%=0, 85-100%=0.5%, 100-120%=1%, 120%+=1.5%
- Segments: Bireysel, Ticari, Karma

## Upcoming (Faz 2)
- Şube Kadro Planlama (staffing + turnover heatmap + quadrant)
- Şube Haritası (Türkiye haritası with interactive pins)
- Aksiyon Merkezi'ne şube uyarıları entegrasyonu
- Genel Bakış'a şube performans özet kartı
