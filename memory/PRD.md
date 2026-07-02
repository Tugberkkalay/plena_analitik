# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
Multi-tenant HR analytics SaaS with sector-specific taxonomies (Banking, Retail).

## Completed Features
- ✅ Multi-tenant admin, branding, Excel import/export, PDF, Turkish UI
- ✅ Dynamic Sector Taxonomy (Banking/Retail) + Segment Filtering
- ✅ İşe Alım Analitik (Alım & Ayrılma tabları: Kadro Planlama, Teklif Analizi, Ücret Kıyaslama)
- ✅ **4 Yeni Modül (Feb 2026):**
  - **Norm Kadro Takip**: Hedef vs gerçekleşen, pozisyon kırılımı, aylık trend + ek maliyet dual-axis, drill-down
  - **Ek Kadro Talepleri**: Talep no, sebep, onay durumu, kişi sayısı, maliyet takibi, çeyrek trend
  - **Teklif Analizi Detay**: Red sebepleri, scatter plot (rekabetçilik), çeyrek red trendi, departman/pozisyon kırılımı
  - **Ücret Benchmark**: 3-seviye drill-down (birim→pozisyon→kişi), band box-plot, risk çalışan listesi, compa ratio
- ✅ Sector salary benchmarks (banking & retail specific)
- ✅ All alert categories populated

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI
- Backend: FastAPI, MongoDB, taxonomy_loader.py
- AI: GPT-5.2 via Emergent LLM Key
- DB Collections: employees, branches, sales_performance, recruitment, training, engagement, ek_kadro_talepleri, norm_kadro

## Upcoming
- P1: server.py modularization (~3000+ lines)
- P2: CRUD screens for Ek Kadro Talepleri
- P2: Excel export for tables, PNG for charts
