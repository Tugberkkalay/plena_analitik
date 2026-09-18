# Plenalitik — Enterprise HR & Sales Analytics Platform

## Completed
- ✅ Multi-tenant, 5 sectors, all filters, Excel Export
- ✅ 5 tenants with full data (skills, engagement, training, surveys)
- ✅ Anket Analizi: 4 türü (Bağlılık, Çıkış, Onboarding, Pulse)
- ✅ Rapor Tasarımcısı: 5 veri kaynağı, 24 KPI, 21 hazır şablon (9 kategori), save fix
- ✅ Dashboard Yönetimi: Grid widget, sürükle-boyutlandır, kaydet/yayınla
- ✅ Dashboard Paylaşım Linki: Token bazlı, şifreli/şifresiz, /shared/dashboard/{token}
- ✅ KPI etiketleri düzeltildi (label/title alias, font-semibold)
- ✅ **Jolly Tur Performans Analitiği** (Turizm sektörü):
  - Excel'den 5 sheet import (55 çalışan, 309 hedef, 490 yetkinlik, 55 karne)
  - 7 ekran: Genel Bakış, Hedef Analizi, Yetkinlik Analizi, Kalibrasyon, 9 Kutu Yetenek Matrisi, Çalışan Karnesi, **Şube Haritası**
  - **Excel çıktı butonları** tüm 7 sekmede (17 ayrı export butonu)
  - **İnteraktif Türkiye haritası**: Bölge renklendirme (skor bazlı), 12 şube marker, hover tooltip, bölge/şube performans sıralaması
  - Turizm sektör taksonomisi: 12 departman, 18 skill, 4 HRBP, DEPT_SKILL_FOCUS, CAREER_PATHS
  - **Tüm standart raporlar dolu**: Genel Bakış, Kadro, İşe Alım, Eğitim, Yetkinlik, Bağlılık, Kariyer, Performans — 200 recruitment, 192 training, 51 engagement, 6 exit, 20 onboarding, 631 pulse survey

## Tenants
- yapikredi (Bankacılık), parakende (Perakende), turknet (Teknoloji), tusas (Savunma), **jollytur (Turizm)**

## Upcoming
- **P1**: server.py modülarizasyonu
- **P2**: Zamanlanmış rapor çalıştırma
- **P2**: Dönem filtresi (çoklu değerlendirme dönemleri karşılaştırma)
