# Plenalitik — Enterprise HR & Sales Analytics Platform

## Completed
- ✅ Multi-tenant, 4+ sectors, all filters, Excel Export
- ✅ 5 tenants with full data (skills, engagement, training, surveys)
- ✅ Anket Analizi: 4 türü (Bağlılık, Çıkış, Onboarding, Pulse)
- ✅ Rapor Tasarımcısı: 5 veri kaynağı, 24 KPI, 21 hazır şablon (9 kategori), save fix
- ✅ Dashboard Yönetimi: Grid widget, sürükle-boyutlandır, kaydet/yayınla
- ✅ Dashboard Paylaşım Linki: Token bazlı, şifreli/şifresiz, /shared/dashboard/{token}
- ✅ KPI etiketleri düzeltildi (label/title alias, font-semibold)
- ✅ **Jolly Tur Performans Analitiği** (Turizm sektörü, Sept 2026):
  - Excel'den 5 sheet import (Parametreler, Calisanlar, Hedefler, Yetkinlikler, Karne_Ozeti)
  - 55 çalışan, 309 hedef, 490 yetkinlik, 55 karne kaydı
  - 6 ekran: Genel Bakış, Hedef Analizi, Yetkinlik Analizi, Kalibrasyon, 9 Kutu Yetenek Matrisi, Çalışan Karnesi
  - Bölge/Şube/Rol filtreleri tüm ekranlarda aktif
  - Türkçe sayı formatı, lacivert (#1F3864) tema
  - Backend: /api/jolly/* (8 endpoint), Frontend: JollyTurPage.jsx (6 sekmeli tek sayfa)

## Tenants
- yapikredi (Bankacılık), parakende (Perakende), turknet (Teknoloji), tusas (Savunma), **jollytur (Turizm)**

## Upcoming
- **P1**: server.py modülarizasyonu
- **P2**: Zamanlanmış rapor çalıştırma
