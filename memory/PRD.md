# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
Multi-tenant HR analytics SaaS with sector-specific taxonomies (Banking, Retail).

## Completed Features
- ✅ Multi-tenant admin, branding, Excel import/export, PDF, Turkish UI
- ✅ Dynamic Sector Taxonomy (Banking/Retail)
- ✅ Segment Filtering (Mağaza/Üretim/Merkez Ofis for Retail)
- ✅ **İşe Alım Analitik Module** (Feb 2026):
  - Kadro Planlama: Hedef vs mevcut, çeyrek/aylık maliyet, alım sebepleri
  - Teklif Analizi: Red sebepleri (maaş/yan haklar/konum), sektör benchmark karşılaştırma
  - Ücret Kıyaslama: Band/departman/kişi bazlı sektör ortalaması karşılaştırma, compa ratio
  - Sector-specific salary benchmarks in taxonomy_loader
- ✅ All alert categories: Devir, Kadro, Yetkinlik, Şube Satış, Org Sağlığı, Yedekleme

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI
- Backend: FastAPI, MongoDB, taxonomy_loader.py
- AI: GPT-5.2 via Emergent LLM Key

## Upcoming
- P1: server.py modularization (~2900+ lines)
- P2: Excel import auto-fill segment
- P2: Alert Resolution DB persistence
