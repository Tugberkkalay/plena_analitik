"""
Sector-specific taxonomy loader for Plenalitik.
Returns department lists, skill clusters, strategic objectives, and other
constants based on the tenant's sector (Bankacılık, Perakende, etc.)
"""
import json
import os
from functools import lru_cache

_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def _load_json(fname):
    path = os.path.join(_DATA_DIR, fname)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}

# ─── Banking Taxonomy (loaded once) ───
_BANKING_SKILLS = _load_json("skills.json").get("beceriler", [])
_BANKING_ROLES = _load_json("roles.json").get("roller", [])
_BANKING_CAREERS = _load_json("career-paths.json").get("kariyer_yollari", [])
_BANKING_CLUSTERS = _load_json("skill-clusters.json").get("kumeler", [])
_BANKING_PROFICIENCY = _load_json("proficiency-levels.json").get("seviyeler", [])

# ─── Retail Taxonomy (loaded once) ───
_RETAIL_RAW = _load_json("perakende_kutuphane.json")

# ─────────────────────────────────────────────
#  BANKING CONFIG
# ─────────────────────────────────────────────
def _build_banking_config():
    return {
        "DEPARTMENTS": [
            "Kredi ve Risk", "Hazine", "Bireysel Bankacılık", "Kurumsal Bankacılık",
            "Şube Operasyonları", "Dijital Bankacılık", "Uyum ve Mevzuat",
            "Veri ve Analitik", "İnsan Kaynakları", "Operasyon ve Süreç"
        ],
        "DEPT_WEIGHTS": [15, 8, 14, 10, 16, 9, 6, 8, 6, 8],
        "DEPT_SEGMENT_MAP": {},
        "SEGMENTS": [],
        "DEPT_ROLE_FAMILIES": {
            "Kredi ve Risk": ["Kredi ve Risk"],
            "Hazine": ["Hazine ve Sermaye Piyasaları"],
            "Bireysel Bankacılık": ["Bireysel Bankacılık", "Şube ve Bireysel Bankacılık"],
            "Kurumsal Bankacılık": ["Kurumsal Bankacılık", "Şube ve KOBİ Bankacılığı"],
            "Şube Operasyonları": ["Şube Operasyonları"],
            "Dijital Bankacılık": ["Dijital Bankacılık", "Müşteri Deneyimi ve CRM"],
            "Uyum ve Mevzuat": ["Uyum ve Mevzuat"],
            "Veri ve Analitik": ["Veri ve Analitik"],
            "İnsan Kaynakları": ["İnsan Kaynakları"],
            "Operasyon ve Süreç": ["Operasyon ve Süreç"],
        },
        "DEPT_SKILL_CLUSTERS": {
            "Kredi ve Risk": ["kredi-risk-yonetimi", "veri-analitigi-bi", "uyum-mevzuat-hukuk"],
            "Hazine": ["hazine-sermaye-piyasalari", "veri-analitigi-bi"],
            "Bireysel Bankacılık": ["bireysel-bankacilik", "sube-operasyonlari", "musteri-deneyimi-crm"],
            "Kurumsal Bankacılık": ["kurumsal-ticari-bankacilik", "kredi-risk-yonetimi"],
            "Şube Operasyonları": ["sube-operasyonlari", "bireysel-bankacilik", "musteri-deneyimi-crm"],
            "Dijital Bankacılık": ["dijital-bankacilik", "musteri-deneyimi-crm", "veri-analitigi-bi"],
            "Uyum ve Mevzuat": ["uyum-mevzuat-hukuk", "operasyon-sureç-yonetimi"],
            "Veri ve Analitik": ["veri-analitigi-bi", "dijital-bankacilik"],
            "İnsan Kaynakları": ["liderlik-yonetim", "davranissal-iletisim", "operasyon-sureç-yonetimi"],
            "Operasyon ve Süreç": ["operasyon-sureç-yonetimi", "sube-operasyonlari", "uyum-mevzuat-hukuk"],
        },
        "DEPT_SKILL_FOCUS": {
            "Kredi ve Risk": {"tech": ["Bireysel Kredi Skorlama", "KOBİ Kredi Skorlama ve Değerlendirmesi", "Basel III/IV Uygulamaları", "Risk Modeli Validasyonu"], "soft": ["Eleştirel Düşünme ve Problem Çözme", "Yazılı ve Sözlü İletişim"], "domain": ["Kurumsal Kredi Tahsis ve Yapılandırma", "Portföy Risk Yönetimi"]},
            "Hazine": {"tech": ["Aktif-Pasif Yönetimi (ALM)", "FX ve Para Piyasaları İşlemleri", "Türev Araçlar ve Hedging"], "soft": ["Stratejik Düşünme ve Karar Verme"], "domain": ["Sabit Getirili Menkul Kıymetler", "Yatırım Bankacılığı (IB)"]},
            "Bireysel Bankacılık": {"tech": ["Bireysel Kredi Ürünleri (İhtiyaç, Konut, Taşıt)", "Kart ve Ödeme Sistemleri"], "soft": ["Müşteri Odaklılık", "Müzakere ve Etki Becerileri"], "domain": ["Mevduat ve Birikim Ürünleri", "Bireysel Emeklilik ve Sigorta Ürünleri"]},
            "Kurumsal Bankacılık": {"tech": ["KOBİ Bankacılığı", "Kurumsal Bankacılık (Büyük Müşteri)"], "soft": ["Müzakere ve Etki Becerileri"], "domain": ["Dış Ticaret Finansmanı ve Akreditif", "Nakit Yönetimi (Cash Management)"]},
            "Şube Operasyonları": {"tech": ["Gişe ve Nakit Yönetimi", "Şube Satış ve Hedef Yönetimi"], "soft": ["Müşteri Odaklılık", "Takım Çalışması ve İşbirliği"], "domain": ["Şube Yönetimi", "Müşteri Kazanımı ve Onboarding"]},
            "Dijital Bankacılık": {"tech": ["Mobil Bankacılık Ürün Yönetimi", "Open Banking ve API Ekosistemi", "Dijital Ödeme Sistemleri ve QR"], "soft": ["Eleştirel Düşünme ve Problem Çözme"], "domain": ["Dijital Müşteri Yolculuğu"]},
            "Uyum ve Mevzuat": {"tech": ["BDDK Mevzuatı ve Bankacılık Düzenlemeleri", "MASAK ve Suç Gelirleri Aklanması ile Mücadele"], "soft": ["Yazılı ve Sözlü İletişim"], "domain": ["KVKK ve Kişisel Veri Yönetimi", "İç Kontrol ve İç Denetim"]},
            "Veri ve Analitik": {"tech": ["SQL ve Veri Sorgulama", "BI Dashboard ve Veri Görselleştirme", "Makine Öğrenmesi ve Modelleme"], "soft": ["Eleştirel Düşünme ve Problem Çözme"], "domain": ["Veri Mühendisliği ve ETL", "İstatistik ve Risk Modellemesi"]},
            "İnsan Kaynakları": {"tech": ["Ekip Yönetimi ve İnsan Kaynakları", "Performans Yönetimi ve Geri Bildirim"], "soft": ["Koçluk ve Mentorluk", "Değişim Yönetimi"], "domain": ["Stratejik Düşünme ve Karar Verme"]},
            "Operasyon ve Süreç": {"tech": ["Süreç Tasarımı ve İyileştirme", "RPA ve Süreç Otomasyonu"], "soft": ["Takım Çalışması ve İşbirliği"], "domain": ["Takas ve Mutabakat (Settlement)", "EFT, Havale ve FAST Operasyonları"]},
        },
        "TARGET_HEADCOUNT": {
            "Kredi ve Risk": {"target": 75, "critical_roles": ["Kıdemli Kredi Analisti", "Risk Yöneticisi", "Kredi Müdürü"]},
            "Hazine": {"target": 40, "critical_roles": ["Hazine Yöneticisi", "ALM Uzmanı"]},
            "Bireysel Bankacılık": {"target": 70, "critical_roles": ["Portföy Yöneticisi", "Bireysel Bankacılık Müdürü"]},
            "Kurumsal Bankacılık": {"target": 50, "critical_roles": ["Kurumsal İlişki Yöneticisi", "Dış Ticaret Uzmanı"]},
            "Şube Operasyonları": {"target": 80, "critical_roles": ["Şube Müdürü", "Operasyon Sorumlusu", "Satış Koordinatörü"]},
            "Dijital Bankacılık": {"target": 45, "critical_roles": ["Ürün Müdürü (Mobil)", "Open Banking Uzmanı"]},
            "Uyum ve Mevzuat": {"target": 30, "critical_roles": ["Uyum Müdürü", "MASAK Uzmanı"]},
            "Veri ve Analitik": {"target": 40, "critical_roles": ["Veri Bilimci", "BI Analisti"]},
            "İnsan Kaynakları": {"target": 30, "critical_roles": ["Yetenek Yönetimi Uzmanı", "İK Analitiği Sorumlusu"]},
            "Operasyon ve Süreç": {"target": 40, "critical_roles": ["Süreç İyileştirme Uzmanı", "Takas ve Mutabakat Sorumlusu"]},
        },
        "STRATEGIC_OBJECTIVES": [
            {"id": "dijital_donusum", "name": "Dijital Bankacılık Dönüşümü", "description": "Dijital kanalların güçlendirilmesi, mobil bankacılık ve open banking altyapısı", "priority": "Kritik",
             "required_skills": ["Mobil Bankacılık Ürün Yönetimi", "Open Banking ve API Ekosistemi", "Dijital Ödeme Sistemleri ve QR", "Dijital Müşteri Yolculuğu", "RPA ve Süreç Otomasyonu", "Makine Öğrenmesi ve Modelleme", "BI Dashboard ve Veri Görselleştirme", "Derin Öğrenme ve Sinir Ağları", "Veri Mühendisliği ve ETL"],
             "required_headcount": 120, "target_departments": ["Dijital Bankacılık", "Veri ve Analitik"], "timeline": "Q1-Q4 2025"},
            {"id": "risk_yonetimi", "name": "Gelişmiş Risk ve Uyum Yönetimi", "description": "Basel IV uyumluluğu, stres testi altyapısı ve BDDK mevzuat adaptasyonu", "priority": "Kritik",
             "required_skills": ["Basel III/IV Uygulamaları", "Stres Testi ve Senaryo Analizi", "Risk Modeli Validasyonu", "BDDK Mevzuatı ve Bankacılık Düzenlemeleri", "MASAK ve Suç Gelirleri Aklanması ile Mücadele", "Sermaye Yeterliliği ve RWA Hesaplama", "Erken Uyarı Sistemleri (EWS)", "GES/RES ve Enerji Projeleri Kredilendirme"],
             "required_headcount": 100, "target_departments": ["Kredi ve Risk", "Uyum ve Mevzuat"], "timeline": "Q1-Q3 2025"},
            {"id": "musteri_deneyimi", "name": "Müşteri Deneyimi İyileştirme", "description": "NPS artışı, müşteri segmentasyonu ve CRM modernizasyonu", "priority": "Yüksek",
             "required_skills": ["Müşteri Segmentasyonu", "NPS, CES ve Deneyim Ölçümü", "Kampanya Yönetimi ve Next-Best-Action", "Müşteri Yolculuğu Haritalama", "Şikayet Yönetimi ve Closed-Loop Feedback", "Çağrı Merkezi Operasyonları", "Müşteri Odaklılık"],
             "required_headcount": 65, "target_departments": ["Dijital Bankacılık", "Bireysel Bankacılık"], "timeline": "Q2-Q4 2025"},
            {"id": "liderlik_gelistirme", "name": "Liderlik ve Yetenek Geliştirme", "description": "Yeni nesil yöneticilerin yetiştirilmesi ve yetenek havuzu oluşturma", "priority": "Orta",
             "required_skills": ["Ekip Yönetimi ve İnsan Kaynakları", "Stratejik Düşünme ve Karar Verme", "Değişim Yönetimi", "Koçluk ve Mentorluk", "Performans Yönetimi ve Geri Bildirim", "Kriz Yönetimi", "Çapraz Fonksiyonel Liderlik", "Bütçe ve P&L Yönetimi"],
             "required_headcount": 90, "target_departments": ["İnsan Kaynakları"], "timeline": "Q1-Q4 2025"},
            {"id": "sube_verimlilik", "name": "Şube Ağı Optimizasyonu", "description": "Şube verimliliğini artırma, satış hedeflerini güçlendirme ve operasyonel iyileştirme", "priority": "Yüksek",
             "required_skills": ["Şube Satış ve Hedef Yönetimi", "Şube Yönetimi", "Gişe ve Nakit Yönetimi", "Müşteri Kazanımı ve Onboarding", "Süreç Tasarımı ve İyileştirme", "Bireysel Kredi Ürünleri (İhtiyaç, Konut, Taşıt)", "Şube Müşteri İlişkileri"],
             "required_headcount": 90, "target_departments": ["Şube Operasyonları", "Bireysel Bankacılık"], "timeline": "Q1-Q4 2025"},
            {"id": "veri_analitigi", "name": "Veri Odaklı Karar Alma Altyapısı", "description": "Gelişmiş analitik, yapay zeka modelleri ve iş zekası kapasitesi oluşturma", "priority": "Kritik",
             "required_skills": ["SQL ve Veri Sorgulama", "İstatistik ve Risk Modellemesi", "Makine Öğrenmesi ve Modelleme", "Derin Öğrenme ve Sinir Ağları", "Veri Mühendisliği ve ETL", "BI Dashboard ve Veri Görselleştirme"],
             "required_headcount": 85, "target_departments": ["Veri ve Analitik", "Dijital Bankacılık"], "timeline": "Q1-Q4 2025"},
            {"id": "uyum_guclen", "name": "Regülasyon Uyum Güçlendirme", "description": "KVKK, MASAK ve uluslararası yaptırım uyumu güçlendirme", "priority": "Yüksek",
             "required_skills": ["KVKK ve Kişisel Veri Yönetimi", "Yaptırım Listeleri ve Sanksiyon Takibi", "İç Kontrol ve İç Denetim", "BDDK Mevzuatı ve Bankacılık Düzenlemeleri", "MASAK ve Suç Gelirleri Aklanması ile Mücadele"],
             "required_headcount": 45, "target_departments": ["Uyum ve Mevzuat"], "timeline": "Q2-Q4 2025"},
        ],
        "POSITIONS_BY_BAND": {
            "A": ["Uzman Yardımcısı", "Yetkili", "Stajyer", "Asistan"],
            "B": ["Uzman", "Analist", "Koordinatör", "Temsilci"],
            "C": ["Kıdemli Uzman", "Kıdemli Analist", "Birim Yöneticisi", "Takım Lideri"],
            "D": ["Müdür", "Bölüm Başkanı", "Müdür Yardımcısı", "Grup Müdürü"],
            "E": ["Direktör", "Genel Müdür Yardımcısı", "Genel Müdür", "Başkan"],
        },
        "CAREER_PATH_BANDS": {
            "A": {"next": "B", "title": "Uzman", "timeline": "12-18 ay"},
            "B": {"next": "C", "title": "Kıdemli Uzman", "timeline": "18-24 ay"},
            "C": {"next": "D", "title": "Müdür", "timeline": "24-36 ay"},
            "D": {"next": "E", "title": "Direktör", "timeline": "36-48 ay"},
            "E": {"next": "E", "title": "Üst Yönetim", "timeline": "devam eden"},
        },
        "SKILL_TAXONOMY": _BANKING_SKILLS,
        "ROLE_TAXONOMY": _BANKING_ROLES,
        "CAREER_PATHS": _BANKING_CAREERS,
        "CLUSTER_TAXONOMY": _BANKING_CLUSTERS,
        "PROFICIENCY_LEVELS": _BANKING_PROFICIENCY,
        "SKILL_MAP": {s["id"]: s for s in _BANKING_SKILLS},
        "ROLE_MAP": {r["id"]: r for r in _BANKING_ROLES},
        "SALARY_BENCHMARK": {
            "A": {"min": 16000, "mid": 22000, "max": 30000, "sector_avg": 20000},
            "B": {"min": 30000, "mid": 40000, "max": 52000, "sector_avg": 38000},
            "C": {"min": 50000, "mid": 65000, "max": 82000, "sector_avg": 62000},
            "D": {"min": 82000, "mid": 105000, "max": 135000, "sector_avg": 100000},
            "E": {"min": 135000, "mid": 185000, "max": 260000, "sector_avg": 175000},
        },
        "HIRING_REASONS": ["Yeni Pozisyon", "Ayrılma Yerine", "Büyüme", "Yedekleme", "Proje Bazlı", "Reorganizasyon"],
        "REJECTION_REASONS": ["Maaş Beklentisi", "Yan Haklar Yetersiz", "Konum/Uzaklık", "Karşı Teklif", "Kültür Uyumsuzluğu", "Kariyer Beklentisi"],
        "HRBP_MAP": {
            "Kredi ve Risk": "Elif Aydın", "Hazine": "Elif Aydın",
            "Bireysel Bankacılık": "Zeynep Arslan", "Kurumsal Bankacılık": "Zeynep Arslan",
            "Şube Operasyonları": "Hasan Şahin", "Dijital Bankacılık": "Hasan Şahin",
            "Uyum ve Mevzuat": "Fatma Çelik", "Veri ve Analitik": "Fatma Çelik",
            "İnsan Kaynakları": "Ayşe Demir", "Operasyon ve Süreç": "Ayşe Demir",
        },
    }


# ─────────────────────────────────────────────
#  RETAIL CONFIG (derived from perakende_kutuphane.json)
# ─────────────────────────────────────────────
def _build_retail_config():
    raw = _RETAIL_RAW
    if not raw:
        # Fallback to banking if retail JSON missing
        return _build_banking_config()

    # --- Build flat skill taxonomy from retail competencies ---
    segment_cluster_map = {"CORE": "core", "RETAIL": "retail", "PROD": "prod", "HQ": "hq"}
    skill_taxonomy = []
    for seg_key, comps in raw.get("competencies", {}).items():
        cluster_id = segment_cluster_map.get(seg_key, seg_key.lower())
        for c in comps:
            skill_taxonomy.append({
                "id": c["id"],
                "ad": c["name"],
                "kume_id": cluster_id,
                "aciklama": c.get("desc", "")[:120],
                "kritiklik_seviyesi": "çekirdek" if seg_key == "CORE" else "alan",
                "kategori": c.get("category", "Domain"),
            })

    # --- Cluster taxonomy ---
    cluster_taxonomy = [
        {"id": "core", "ad": "Çekirdek Yetkinlikler"},
        {"id": "retail", "ad": "Perakende / Mağaza Yetkinlikleri"},
        {"id": "prod", "ad": "Üretim Yetkinlikleri"},
        {"id": "hq", "ad": "Merkez Ofis Yetkinlikleri"},
    ]

    # --- Role taxonomy from career ladder steps ---
    band_map = {"A": 1, "B": 2, "C": 3, "D": 4, "E": 5}
    role_taxonomy = []
    career_paths = []

    # Map path_id prefixes to department families
    path_dept_map = {
        "RL1": "Mağaza Satış", "RL2": "Görsel Düzenleme", "RL3": "Perakende Operasyon",
        "PL1": "Üretim", "PL2": "Kalite Kontrol", "PL3": "Bakım ve Teknik",
        "HL1": "Tasarım ve Ar-Ge", "HL2": "Kategori Yönetimi",
        "HL3": "İK ve Destek", "HL4": "Dijital ve E-ticaret",
    }

    for seg_key, ladders in raw.get("career_ladders", {}).items():
        for ladder in ladders:
            pid = ladder["path_id"]
            dept_name = path_dept_map.get(pid, pid)
            steps = []
            for i, step in enumerate(ladder["steps"]):
                role_id = f"{pid}-{step['band']}-{i}"
                role_taxonomy.append({
                    "id": role_id,
                    "unvan": step["role"],
                    "aile": dept_name,
                    "kademe": f"Kademe {band_map.get(step['band'], 1)}",
                    "kademe_seviyesi": band_map.get(step["band"], 1),
                    "kisa_aciklama": f"{dept_name} - {step['role']}",
                })
                steps.append({
                    "sira": i + 1,
                    "rol_id": role_id,
                    "tipik_sure_ay": _parse_duration(step.get("duration", "")),
                    "gecis_kosullari": [],
                    "aciklama": step["role"],
                })
            career_paths.append({
                "id": pid,
                "ad": ladder["name"],
                "tur": "dikey",
                "aile": dept_name,
                "adimlar": steps,
                "alternatif_yollar": [],
            })

    skill_map = {s["id"]: s for s in skill_taxonomy}
    role_map = {r["id"]: r for r in role_taxonomy}

    return {
        "DEPARTMENTS": [
            "Mağaza Satış", "Görsel Düzenleme", "Perakende Operasyon",
            "Üretim", "Kalite Kontrol", "Bakım ve Teknik",
            "Tasarım ve Ar-Ge", "Kategori Yönetimi", "İK ve Destek",
            "Dijital ve E-ticaret",
        ],
        "DEPT_WEIGHTS": [25, 5, 6, 20, 6, 5, 8, 8, 10, 7],
        "DEPT_SEGMENT_MAP": {
            "Mağaza Satış": "Mağaza / Perakende",
            "Görsel Düzenleme": "Mağaza / Perakende",
            "Perakende Operasyon": "Mağaza / Perakende",
            "Üretim": "Üretim",
            "Kalite Kontrol": "Üretim",
            "Bakım ve Teknik": "Üretim",
            "Tasarım ve Ar-Ge": "Merkez Ofis",
            "Kategori Yönetimi": "Merkez Ofis",
            "İK ve Destek": "Merkez Ofis",
            "Dijital ve E-ticaret": "Merkez Ofis",
        },
        "SEGMENTS": ["Mağaza / Perakende", "Üretim", "Merkez Ofis"],
        "DEPT_ROLE_FAMILIES": {
            "Mağaza Satış": ["Mağaza Satış"],
            "Görsel Düzenleme": ["Görsel Düzenleme"],
            "Perakende Operasyon": ["Perakende Operasyon"],
            "Üretim": ["Üretim"],
            "Kalite Kontrol": ["Kalite Kontrol"],
            "Bakım ve Teknik": ["Bakım ve Teknik"],
            "Tasarım ve Ar-Ge": ["Tasarım ve Ar-Ge"],
            "Kategori Yönetimi": ["Kategori Yönetimi"],
            "İK ve Destek": ["İK ve Destek"],
            "Dijital ve E-ticaret": ["Dijital ve E-ticaret"],
        },
        "DEPT_SKILL_CLUSTERS": {
            "Mağaza Satış": ["retail", "core"],
            "Görsel Düzenleme": ["retail", "core"],
            "Perakende Operasyon": ["retail", "hq"],
            "Üretim": ["prod", "core"],
            "Kalite Kontrol": ["prod", "core"],
            "Bakım ve Teknik": ["prod", "core"],
            "Tasarım ve Ar-Ge": ["hq", "core"],
            "Kategori Yönetimi": ["hq", "core"],
            "İK ve Destek": ["hq", "core"],
            "Dijital ve E-ticaret": ["hq", "retail"],
        },
        "DEPT_SKILL_FOCUS": {
            "Mağaza Satış": {
                "tech": ["Kasa & POS İşlemleri", "Omnichannel & E-ticaret Entegrasyonu"],
                "soft": ["Müşteri Deneyimi (CX)", "Ekip Liderliği & Koçluk", "Müşteri Odaklılık"],
                "domain": ["Satış Teknikleri", "Stok & Mağaza Operasyonu", "Mağaza Yönetimi", "Sadakat Programı (Skechers Plus)"],
            },
            "Görsel Düzenleme": {
                "tech": ["Omnichannel & E-ticaret Entegrasyonu"],
                "soft": ["İletişim", "Proje & Paydaş Yönetimi"],
                "domain": ["Görsel Düzenleme (VM)", "Marka & Ürün Bilgisi", "Pazarlama & Marka"],
            },
            "Perakende Operasyon": {
                "tech": ["Omnichannel & E-ticaret Entegrasyonu", "Dijital Okuryazarlık"],
                "soft": ["Proje & Paydaş Yönetimi", "Sonuç Odaklılık"],
                "domain": ["Stok & Mağaza Operasyonu", "Tedarik Zinciri & Planlama", "P&L / Mağaza Karlılığı"],
            },
            "Üretim": {
                "tech": ["Kesimhane Operasyonları", "Saya Dikim", "Montaj", "Bakım & Arıza Giderme"],
                "soft": ["Vardiya & Ekip Yönetimi", "Sonuç Odaklılık"],
                "domain": ["Kalite Kontrol", "İş Sağlığı & Güvenliği (İSG)", "Üretim Verimliliği (OEE)"],
            },
            "Kalite Kontrol": {
                "tech": ["Saya Dikim", "Veri Analitiği"],
                "soft": ["Proje & Paydaş Yönetimi"],
                "domain": ["Kalite Kontrol", "Uyum & Etik", "Üretim Verimliliği (OEE)"],
            },
            "Bakım ve Teknik": {
                "tech": ["Bakım & Arıza Giderme", "Dijital Okuryazarlık"],
                "soft": ["Proje & Paydaş Yönetimi", "Takım Çalışması"],
                "domain": ["İş Sağlığı & Güvenliği (İSG)", "Üretim Verimliliği (OEE)"],
            },
            "Tasarım ve Ar-Ge": {
                "tech": ["Ürün Tasarımı", "Ar-Ge & Malzeme Geliştirme"],
                "soft": ["İletişim", "Proje & Paydaş Yönetimi"],
                "domain": ["Marka & Ürün Bilgisi", "Kategori & Ürün Yönetimi"],
            },
            "Kategori Yönetimi": {
                "tech": ["Veri Analitiği"],
                "soft": ["Liderlik & Strateji", "Proje & Paydaş Yönetimi"],
                "domain": ["Kategori & Ürün Yönetimi", "Tedarik Zinciri & Planlama", "Pazarlama & Marka"],
            },
            "İK ve Destek": {
                "tech": ["Dijital Okuryazarlık", "Veri Analitiği"],
                "soft": ["İletişim", "Proje & Paydaş Yönetimi", "Sonuç Odaklılık"],
                "domain": ["Finans & Raporlama", "İnsan Kaynakları"],
            },
            "Dijital ve E-ticaret": {
                "tech": ["Veri Analitiği", "Dijital Okuryazarlık", "Omnichannel & E-ticaret Entegrasyonu"],
                "soft": ["Liderlik & Strateji"],
                "domain": ["Pazarlama & Marka", "Kategori & Ürün Yönetimi", "Tedarik Zinciri & Planlama"],
            },
        },
        "TARGET_HEADCOUNT": {
            "Mağaza Satış": {"target": 130, "critical_roles": ["Mağaza Müdürü", "Kıdemli Satış Danışmanı", "Bölge Müdürü"]},
            "Görsel Düzenleme": {"target": 25, "critical_roles": ["Bölge VM Uzmanı", "VM & Mağaza Konsept Müdürü"]},
            "Perakende Operasyon": {"target": 30, "critical_roles": ["Perakende Operasyon Uzmanı", "Operasyon Müdürü"]},
            "Üretim": {"target": 100, "critical_roles": ["Kıdemli Operatör / Usta", "Vardiya Amiri", "Üretim Müdürü"]},
            "Kalite Kontrol": {"target": 30, "critical_roles": ["Kalite Uzmanı", "Kalite Müdürü"]},
            "Bakım ve Teknik": {"target": 25, "critical_roles": ["Kıdemli Bakım Teknisyeni", "Bakım & Teknik Müdür"]},
            "Tasarım ve Ar-Ge": {"target": 40, "critical_roles": ["Kıdemli Tasarımcı", "Tasarım Direktörü"]},
            "Kategori Yönetimi": {"target": 40, "critical_roles": ["Kategori Uzmanı", "Kategori/Ürün Müdürü"]},
            "İK ve Destek": {"target": 50, "critical_roles": ["Finans Uzmanı", "İK Uzmanı", "Müdür"]},
            "Dijital ve E-ticaret": {"target": 30, "critical_roles": ["E-ticaret Uzman", "Dijital Ticaret Müdürü"]},
        },
        "STRATEGIC_OBJECTIVES": [
            {
                "id": "perakende_deneyim", "name": "Mağaza Deneyimi Dönüşümü",
                "description": "Müşteri deneyimi ve satış dönüşüm oranlarının artırılması, omnichannel entegrasyonu",
                "priority": "Kritik",
                "required_skills": ["Satış Teknikleri", "Müşteri Deneyimi (CX)", "Omnichannel & E-ticaret Entegrasyonu", "Görsel Düzenleme (VM)", "Sadakat Programı (Skechers Plus)", "Müşteri Odaklılık", "Mağaza Yönetimi"],
                "required_headcount": 120, "target_departments": ["Mağaza Satış", "Görsel Düzenleme"],
                "timeline": "Q1-Q4 2025",
            },
            {
                "id": "uretim_verimlilik", "name": "Üretim Verimliliği ve Kalite Artışı",
                "description": "OEE artırma, fire azaltma, kalite standartlarını yükseltme",
                "priority": "Kritik",
                "required_skills": ["Üretim Verimliliği (OEE)", "Kalite Kontrol", "Kesimhane Operasyonları", "Saya Dikim", "Montaj", "Bakım & Arıza Giderme", "İş Sağlığı & Güvenliği (İSG)"],
                "required_headcount": 100, "target_departments": ["Üretim", "Kalite Kontrol", "Bakım ve Teknik"],
                "timeline": "Q1-Q3 2025",
            },
            {
                "id": "dijital_ticaret", "name": "Dijital Ticaret Büyümesi",
                "description": "E-ticaret kanallarının güçlendirilmesi, veri analitiği ve dijital pazarlama",
                "priority": "Yüksek",
                "required_skills": ["Omnichannel & E-ticaret Entegrasyonu", "Veri Analitiği", "Dijital Okuryazarlık", "Pazarlama & Marka", "Kategori & Ürün Yönetimi"],
                "required_headcount": 55, "target_departments": ["Dijital ve E-ticaret", "Kategori Yönetimi"],
                "timeline": "Q2-Q4 2025",
            },
            {
                "id": "tasarim_inovasyon", "name": "Ürün Tasarımı ve İnovasyon",
                "description": "Yeni koleksiyon geliştirme, Ar-Ge kapasitesinin güçlendirilmesi",
                "priority": "Yüksek",
                "required_skills": ["Ürün Tasarımı", "Ar-Ge & Malzeme Geliştirme", "Marka & Ürün Bilgisi", "Kategori & Ürün Yönetimi"],
                "required_headcount": 45, "target_departments": ["Tasarım ve Ar-Ge", "Kategori Yönetimi"],
                "timeline": "Q1-Q4 2025",
            },
            {
                "id": "tedarik_zinciri", "name": "Tedarik Zinciri Optimizasyonu",
                "description": "Stok yönetimi, planlama ve lojistik süreçlerinin iyileştirilmesi",
                "priority": "Yüksek",
                "required_skills": ["Tedarik Zinciri & Planlama", "Stok & Mağaza Operasyonu", "Veri Analitiği", "Finans & Raporlama"],
                "required_headcount": 60, "target_departments": ["Perakende Operasyon", "İK ve Destek"],
                "timeline": "Q1-Q4 2025",
            },
            {
                "id": "liderlik_yetenek", "name": "Liderlik ve Yetenek Geliştirme",
                "description": "Mağaza ve üretim yöneticilerinin geliştirilmesi, yetenek havuzu oluşturma",
                "priority": "Orta",
                "required_skills": ["Ekip Liderliği & Koçluk", "Liderlik & Strateji", "Vardiya & Ekip Yönetimi", "İnsan Kaynakları", "P&L / Mağaza Karlılığı", "Proje & Paydaş Yönetimi"],
                "required_headcount": 70, "target_departments": ["İK ve Destek", "Mağaza Satış", "Üretim"],
                "timeline": "Q1-Q4 2025",
            },
        ],
        "POSITIONS_BY_BAND": {
            "A": ["Satış Danışmanı (Aday)", "Üretim Operatörü (Aday)", "Stajyer", "Asistan"],
            "B": ["Satış Danışmanı", "Üretim Operatörü", "Uzman Yardımcısı", "Teknisyen", "Kategori Uzman Yrd."],
            "C": ["Kıdemli Satış Danışmanı", "Kıdemli Operatör", "Uzman", "Kalite Uzmanı", "Tasarımcı"],
            "D": ["Mağaza Müdürü", "Vardiya Amiri", "Müdür", "Kalite Müdürü", "Kategori/Ürün Müdürü"],
            "E": ["Bölge Müdürü", "Üretim Müdürü", "Tasarım Direktörü", "Genel Müdür Yardımcısı"],
        },
        "CAREER_PATH_BANDS": {
            "A": {"next": "B", "title": "Danışman / Operatör", "timeline": "6-12 ay"},
            "B": {"next": "C", "title": "Kıdemli / Uzman", "timeline": "12-24 ay"},
            "C": {"next": "D", "title": "Takım Lideri / Usta", "timeline": "18-36 ay"},
            "D": {"next": "E", "title": "Müdür", "timeline": "24-48 ay"},
            "E": {"next": "E", "title": "Direktör / Bölge Müdürü", "timeline": "devam eden"},
        },
        "SKILL_TAXONOMY": skill_taxonomy,
        "ROLE_TAXONOMY": role_taxonomy,
        "CAREER_PATHS": career_paths,
        "CLUSTER_TAXONOMY": cluster_taxonomy,
        "PROFICIENCY_LEVELS": raw.get("meta", {}).get("proficiency_scale", {}),
        "SKILL_MAP": skill_map,
        "ROLE_MAP": role_map,
        "SALARY_BENCHMARK": {
            "A": {"min": 12000, "mid": 17000, "max": 24000, "sector_avg": 16000},
            "B": {"min": 22000, "mid": 32000, "max": 42000, "sector_avg": 30000},
            "C": {"min": 40000, "mid": 55000, "max": 72000, "sector_avg": 52000},
            "D": {"min": 70000, "mid": 92000, "max": 120000, "sector_avg": 88000},
            "E": {"min": 115000, "mid": 160000, "max": 230000, "sector_avg": 150000},
        },
        "HIRING_REASONS": ["Yeni Pozisyon", "Ayrılma Yerine", "Sezon Takviyesi", "Mağaza Açılışı", "Büyüme", "Reorganizasyon"],
        "REJECTION_REASONS": ["Maaş Beklentisi", "Yan Haklar Yetersiz", "Vardiya/Çalışma Saati", "Karşı Teklif", "Konum/Uzaklık", "Kariyer Beklentisi"],
        "HRBP_MAP": {
            "Mağaza Satış": "Ayşe Demir", "Görsel Düzenleme": "Ayşe Demir", "Perakende Operasyon": "Ayşe Demir",
            "Üretim": "Mehmet Kaya", "Kalite Kontrol": "Mehmet Kaya", "Bakım ve Teknik": "Mehmet Kaya",
            "Tasarım ve Ar-Ge": "Zeynep Arslan", "Kategori Yönetimi": "Zeynep Arslan",
            "İK ve Destek": "Fatma Çelik", "Dijital ve E-ticaret": "Fatma Çelik",
        },
    }


def _parse_duration(dur_str):
    """Parse '0-6 ay' or '6-12 ay' → average months."""
    import re
    m = re.findall(r'\d+', dur_str or "")
    if len(m) >= 2:
        return (int(m[0]) + int(m[1])) // 2
    if len(m) == 1:
        return int(m[0])
    return 12


# ─────────────────────────────────────────────
#  TEKNOLOJİ / TELEKOM CONFIG (TürkNet)
# ─────────────────────────────────────────────
def _build_teknoloji_config():
    return {
        "DEPARTMENTS": [
            "Müşteri Deneyimi", "Teknoloji & Ar-Ge", "Network & Altyapı",
            "Satış & Pazarlama", "Finans & Satın Alma", "İnsan & Kültür",
            "Hukuk & Regülasyon", "İdari İşler & İSG", "Strateji & PMO"
        ],
        "DEPT_WEIGHTS": [40, 15, 19, 11, 5, 3, 2, 3, 2],
        "DEPT_SEGMENT_MAP": {
            "Müşteri Deneyimi": "Operasyon",
            "Network & Altyapı": "Operasyon",
            "Teknoloji & Ar-Ge": "Teknoloji",
            "Strateji & PMO": "Teknoloji",
            "Satış & Pazarlama": "Ticari",
            "Finans & Satın Alma": "Destek",
            "İnsan & Kültür": "Destek",
            "Hukuk & Regülasyon": "Destek",
            "İdari İşler & İSG": "Destek",
        },
        "SEGMENTS": ["Operasyon", "Teknoloji", "Ticari", "Destek"],
        "DEPT_ROLE_FAMILIES": {
            "Müşteri Deneyimi": ["Çağrı Merkezi", "Teknik Destek", "Müşteri Deneyimi"],
            "Teknoloji & Ar-Ge": ["Yazılım Geliştirme", "Veri & Analitik", "Ürün Yönetimi"],
            "Network & Altyapı": ["Network Operasyon", "Saha Operasyon", "Altyapı Planlama"],
            "Satış & Pazarlama": ["Satış", "Dijital Pazarlama", "Kurumsal Satış"],
            "Finans & Satın Alma": ["Finans", "Satın Alma"],
            "İnsan & Kültür": ["İK", "Öğrenme & Gelişim"],
            "Hukuk & Regülasyon": ["Hukuk", "Uyum"],
            "İdari İşler & İSG": ["İdari İşler", "İSG"],
            "Strateji & PMO": ["Strateji", "PMO"],
        },
        "DEPT_SKILL_CLUSTERS": {
            "Müşteri Deneyimi": ["musteri-deneyimi", "cagri-merkezi", "teknik-destek"],
            "Teknoloji & Ar-Ge": ["yazilim-gelistirme", "veri-analitik", "devops-sre"],
            "Network & Altyapı": ["network-altyapi", "saha-operasyon", "veri-merkezi"],
            "Satış & Pazarlama": ["satis-pazarlama", "dijital-pazarlama", "kurumsal-satis"],
            "Finans & Satın Alma": ["finans-muhasebe", "satin-alma"],
            "İnsan & Kültür": ["ik-yonetimi", "ogrenme-gelisim"],
            "Hukuk & Regülasyon": ["hukuk-uyum", "regulasyon"],
            "İdari İşler & İSG": ["idari-isler", "isg"],
            "Strateji & PMO": ["strateji", "proje-yonetimi"],
        },
        "DEPT_SKILL_FOCUS": {
            "Müşteri Deneyimi": {
                "tech": ["CRM Yönetimi", "Çağrı Merkezi Sistemleri", "Teknik Sorun Giderme (L1/L2)", "WFM & Tahminleme"],
                "soft": ["Müşteri Odaklılık", "İletişim Becerileri", "Stres Yönetimi"],
                "domain": ["Churn Önleme & Retention", "Kalite Değerlendirme", "Sosyal Medya Yönetimi"]
            },
            "Teknoloji & Ar-Ge": {
                "tech": [".NET/Java/Python", "React/JavaScript", "Mobil Geliştirme", "SQL & Veri Modelleme", "Kubernetes & Cloud", "CI/CD Pipeline", "Test Otomasyonu"],
                "soft": ["Problem Çözme", "Çevik Düşünme"],
                "domain": ["Ürün Yönetimi", "UX Araştırma", "Veri Analitiği & BI", "Makine Öğrenmesi"]
            },
            "Network & Altyapı": {
                "tech": ["IP/MPLS & BGP", "DWDM & Transmisyon", "FTTH Kurulum", "NOC İzleme (7/24)", "Kapasite Planlama"],
                "soft": ["Sahiplenme", "Takım Çalışması"],
                "domain": ["Veri Merkezi İşletimi", "Fiber Planlama & Yatırım", "Saha Yönetimi"]
            },
            "Satış & Pazarlama": {
                "tech": ["Dijital Performans Pazarlama", "SEO/SEM", "Kampanya Analitiği"],
                "soft": ["Müzakere", "Sonuç Odaklılık"],
                "domain": ["Kurumsal Satış (B2B)", "Online Satış (B2C)", "Tele-satış", "Marka İletişimi"]
            },
            "Finans & Satın Alma": {
                "tech": ["SAP/ERP", "Excel & Finansal Modelleme"],
                "soft": ["Analitik Düşünme", "Detay Odaklılık"],
                "domain": ["Tekdüzen Muhasebe", "Bütçe & Raporlama", "Tahsilat/Kredi Kontrol", "Tedarikçi Yönetimi"]
            },
            "İnsan & Kültür": {
                "tech": ["İK Bilgi Sistemleri", "İK Analitiği"],
                "soft": ["Koçluk & Mentorluk", "Değişim Yönetimi"],
                "domain": ["İşe Alım", "Bordro & Özlük", "TurkNet Academy", "İK İş Ortaklığı"]
            },
            "Hukuk & Regülasyon": {
                "tech": ["Hukuki Araştırma Sistemleri"],
                "soft": ["Yazılı İletişim", "Eleştirel Düşünme"],
                "domain": ["BTK Regülasyonları", "KVKK & Uyum", "Sözleşme Yönetimi", "Dava & İcra"]
            },
            "İdari İşler & İSG": {
                "tech": ["İSG Yönetim Sistemleri"],
                "soft": ["Organizasyon Becerisi"],
                "domain": ["İş Güvenliği", "Tesis Yönetimi", "Lojistik/Depo", "İş Sürekliliği & Risk"]
            },
            "Strateji & PMO": {
                "tech": ["Proje Yönetim Araçları (Jira/MS Project)", "Veri Analitiği"],
                "soft": ["Stratejik Düşünme", "Sunum Becerileri"],
                "domain": ["İş Analizi", "OKR/KPI Yönetimi", "Pazar Araştırması"]
            },
        },
        "TARGET_HEADCOUNT": {
            "Müşteri Deneyimi": {"target": 340, "critical_roles": ["Teknik Destek Uzmanı (L2)", "Retention Uzmanı", "WFM Planlama Uzmanı"]},
            "Teknoloji & Ar-Ge": {"target": 128, "critical_roles": ["Kıdemli Backend Geliştirici", "DevOps Mühendisi", "Veri Bilimci", "Ürün Müdürü"]},
            "Network & Altyapı": {"target": 162, "critical_roles": ["NOC Mühendisi", "FTTH Saha Teknisyeni", "IP Core Uzmanı", "Bölge Yöneticisi (Saha)"]},
            "Satış & Pazarlama": {"target": 94, "critical_roles": ["Kurumsal Satış Yöneticisi", "Dijital Pazarlama Uzmanı", "Tele-satış Takım Lideri"]},
            "Finans & Satın Alma": {"target": 43, "critical_roles": ["Finansal Analiz Uzmanı", "Satın Alma Uzmanı"]},
            "İnsan & Kültür": {"target": 22, "critical_roles": ["İşe Alım Uzmanı", "İK İş Ortağı", "Öğrenme & Gelişim Uzmanı"]},
            "Hukuk & Regülasyon": {"target": 15, "critical_roles": ["BTK Uzmanı", "KVKK Sorumlusu"]},
            "İdari İşler & İSG": {"target": 28, "critical_roles": ["İSG Uzmanı", "İş Sürekliliği Uzmanı"]},
            "Strateji & PMO": {"target": 18, "critical_roles": ["Kıdemli İş Analisti", "Proje Yöneticisi"]},
        },
        "STRATEGIC_OBJECTIVES": [
            {"id": "gigafiber_buyume", "name": "Gigafiber Altyapı Büyümesi",
             "description": "FTTH altyapı yatırımlarının hızlandırılması, yeni il/ilçe genişlemesi",
             "priority": "Kritik",
             "required_skills": ["FTTH Kurulum", "Fiber Planlama & Yatırım", "Kapasite Planlama", "IP/MPLS & BGP", "Saha Yönetimi"],
             "required_headcount": 180, "target_departments": ["Network & Altyapı"],
             "timeline": "Q1-Q4 2025"},
            {"id": "musteri_deneyimi_donusum", "name": "Müşteri Deneyimi Dönüşümü",
             "description": "NPS artışı, dijital self-servis oranını yükseltme, churn azaltma",
             "priority": "Kritik",
             "required_skills": ["Churn Önleme & Retention", "CRM Yönetimi", "Çağrı Merkezi Sistemleri", "Müşteri Odaklılık", "WFM & Tahminleme"],
             "required_headcount": 340, "target_departments": ["Müşteri Deneyimi"],
             "timeline": "Q1-Q4 2025"},
            {"id": "dijital_urun_gelistirme", "name": "Dijital Ürün Geliştirme",
             "description": "Mobil uygulama, self-servis portal, otomasyon projeleri",
             "priority": "Kritik",
             "required_skills": [".NET/Java/Python", "React/JavaScript", "Mobil Geliştirme", "Ürün Yönetimi", "UX Araştırma", "CI/CD Pipeline", "Kubernetes & Cloud"],
             "required_headcount": 128, "target_departments": ["Teknoloji & Ar-Ge"],
             "timeline": "Q1-Q4 2025"},
            {"id": "kurumsal_buyume", "name": "Kurumsal Segment Büyümesi",
             "description": "Veri merkezi, IP VPN ve barındırma hizmetlerinde büyüme",
             "priority": "Yüksek",
             "required_skills": ["Kurumsal Satış (B2B)", "Veri Merkezi İşletimi", "Teklif Yönetimi"],
             "required_headcount": 50, "target_departments": ["Satış & Pazarlama", "Network & Altyapı"],
             "timeline": "Q2-Q4 2025"},
            {"id": "veri_odakli_kultur", "name": "Veri Odaklı Karar Alma Kültürü",
             "description": "İK analitiği, iş zekası ve veri platformu güçlendirme",
             "priority": "Yüksek",
             "required_skills": ["Veri Analitiği & BI", "Makine Öğrenmesi", "SQL & Veri Modelleme", "İK Analitiği"],
             "required_headcount": 35, "target_departments": ["Teknoloji & Ar-Ge", "İnsan & Kültür"],
             "timeline": "Q1-Q4 2025"},
            {"id": "liderlik_akademi", "name": "TurkNet Academy & Liderlik Gelişimi",
             "description": "Yeni nesil lider yetiştirme, onboarding iyileştirme, öğrenme kültürü",
             "priority": "Orta",
             "required_skills": ["Koçluk & Mentorluk", "Değişim Yönetimi", "TurkNet Academy", "İK İş Ortaklığı"],
             "required_headcount": 22, "target_departments": ["İnsan & Kültür"],
             "timeline": "Q1-Q4 2025"},
        ],
        "POSITIONS_BY_BAND": {
            "A": ["Müşteri Temsilcisi", "Stajyer", "Uzman Yardımcısı", "Saha Teknisyeni", "Asistan"],
            "B": ["Kıdemli Müşteri Temsilcisi", "Uzman", "Yazılım Geliştirici", "Network Uzmanı", "Analist", "Teknisyen"],
            "C": ["Takım Lideri", "Kıdemli Uzman", "Kıdemli Geliştirici", "Süpervizör", "Bölge Yöneticisi (Saha)", "Kıdemli Analist"],
            "D": ["Yönetici", "Müdür", "Müdür Yardımcısı", "Teknik Müdür", "Satış Müdürü"],
            "E": ["Direktör", "Genel Müdür Yardımcısı", "CTO", "CFO", "CHRO"],
        },
        "CAREER_PATH_BANDS": {
            "A": {"next": "B", "title": "Uzman / Kıdemli MT", "timeline": "12-18 ay"},
            "B": {"next": "C", "title": "Kıdemli Uzman / Takım Lideri", "timeline": "18-24 ay"},
            "C": {"next": "D", "title": "Yönetici", "timeline": "24-36 ay"},
            "D": {"next": "E", "title": "Direktör", "timeline": "36-48 ay"},
            "E": {"next": "E", "title": "Üst Yönetim", "timeline": "devam eden"},
        },
        "SKILL_TAXONOMY": [
            {"id":"tk-crm","ad":"CRM Yönetimi","kume_id":"musteri-deneyimi","kategori":"Technical"},
            {"id":"tk-cagri","ad":"Çağrı Merkezi Sistemleri","kume_id":"musteri-deneyimi","kategori":"Technical"},
            {"id":"tk-teknik-destek","ad":"Teknik Sorun Giderme (L1/L2)","kume_id":"musteri-deneyimi","kategori":"Technical"},
            {"id":"tk-wfm","ad":"WFM & Tahminleme","kume_id":"musteri-deneyimi","kategori":"Technical"},
            {"id":"tk-churn","ad":"Churn Önleme & Retention","kume_id":"musteri-deneyimi","kategori":"Technical"},
            {"id":"tk-dotnet","ad":".NET/Java Geliştirme","kume_id":"yazilim-gelistirme","kategori":"Technical"},
            {"id":"tk-react","ad":"React/JavaScript","kume_id":"yazilim-gelistirme","kategori":"Technical"},
            {"id":"tk-python","ad":"Python Geliştirme","kume_id":"yazilim-gelistirme","kategori":"Technical"},
            {"id":"tk-mobil","ad":"Mobil Uygulama Geliştirme","kume_id":"yazilim-gelistirme","kategori":"Technical"},
            {"id":"tk-sql","ad":"SQL & Veri Modelleme","kume_id":"veri-analitik","kategori":"Technical"},
            {"id":"tk-k8s","ad":"Kubernetes & Cloud","kume_id":"devops-sre","kategori":"Technical"},
            {"id":"tk-cicd","ad":"CI/CD Pipeline","kume_id":"devops-sre","kategori":"Technical"},
            {"id":"tk-test","ad":"Test Otomasyonu","kume_id":"devops-sre","kategori":"Technical"},
            {"id":"tk-urun","ad":"Ürün Yönetimi","kume_id":"veri-analitik","kategori":"Technical"},
            {"id":"tk-bi","ad":"Veri Analitiği & BI","kume_id":"veri-analitik","kategori":"Technical"},
            {"id":"tk-ml","ad":"Makine Öğrenmesi","kume_id":"veri-analitik","kategori":"Technical"},
            {"id":"tk-ip","ad":"IP/MPLS & BGP","kume_id":"network-altyapi","kategori":"Technical"},
            {"id":"tk-dwdm","ad":"DWDM & Transmisyon","kume_id":"network-altyapi","kategori":"Technical"},
            {"id":"tk-ftth","ad":"FTTH Kurulum","kume_id":"network-altyapi","kategori":"Technical"},
            {"id":"tk-noc","ad":"NOC İzleme (7/24)","kume_id":"network-altyapi","kategori":"Technical"},
            {"id":"tk-kapasite","ad":"Kapasite Planlama","kume_id":"network-altyapi","kategori":"Technical"},
            {"id":"tk-fiber","ad":"Fiber Planlama & Yatırım","kume_id":"saha-operasyon","kategori":"Technical"},
            {"id":"tk-saha","ad":"Saha Yönetimi","kume_id":"saha-operasyon","kategori":"Technical"},
            {"id":"tk-dijital","ad":"Dijital Performans Pazarlama","kume_id":"satis-pazarlama","kategori":"Technical"},
            {"id":"tk-seo","ad":"SEO/SEM","kume_id":"satis-pazarlama","kategori":"Technical"},
            {"id":"tk-kurumsal","ad":"Kurumsal Satış (B2B)","kume_id":"kurumsal-satis","kategori":"Technical"},
            {"id":"tk-telesatis","ad":"Tele-satış","kume_id":"satis-pazarlama","kategori":"Technical"},
            {"id":"tk-sap","ad":"SAP/ERP","kume_id":"finans-muhasebe","kategori":"Technical"},
            {"id":"tk-butce","ad":"Bütçe & Raporlama","kume_id":"finans-muhasebe","kategori":"Technical"},
            {"id":"tk-ik-bilgi","ad":"İK Bilgi Sistemleri","kume_id":"ik-yonetimi","kategori":"Technical"},
            {"id":"tk-ik-analitik","ad":"İK Analitiği","kume_id":"ik-yonetimi","kategori":"Technical"},
            {"id":"tk-btk","ad":"BTK Regülasyonları","kume_id":"regulasyon","kategori":"Technical"},
            {"id":"tk-kvkk","ad":"KVKK & Uyum","kume_id":"hukuk-uyum","kategori":"Technical"},
            {"id":"tk-isg","ad":"İş Güvenliği","kume_id":"isg","kategori":"Technical"},
            {"id":"tk-jira","ad":"Proje Yönetim Araçları (Jira)","kume_id":"proje-yonetimi","kategori":"Technical"},
            {"id":"tk-okr","ad":"OKR/KPI Yönetimi","kume_id":"strateji","kategori":"Technical"},
            {"id":"tk-liderlik","ad":"Liderlik","kume_id":"yonetim-becerileri","kategori":"Soft"},
            {"id":"tk-iletisim","ad":"İletişim Becerileri","kume_id":"yonetim-becerileri","kategori":"Soft"},
            {"id":"tk-musteri","ad":"Müşteri Odaklılık","kume_id":"davranissal","kategori":"Soft"},
            {"id":"tk-problem","ad":"Problem Çözme","kume_id":"davranissal","kategori":"Soft"},
            {"id":"tk-cevik","ad":"Çevik Düşünme","kume_id":"davranissal","kategori":"Soft"},
            {"id":"tk-degisim","ad":"Değişim Yönetimi","kume_id":"davranissal","kategori":"Soft"},
        ],
        "ROLE_TAXONOMY": [],
        "CAREER_PATHS": [
            {"from_role":"Müşteri Temsilcisi","to_role":"Kıdemli Müşteri Temsilcisi","band_from":"A","band_to":"B","typical_years":2},
            {"from_role":"Uzman","to_role":"Kıdemli Uzman","band_from":"B","band_to":"C","typical_years":3},
            {"from_role":"Yazılım Geliştirici","to_role":"Kıdemli Geliştirici","band_from":"B","band_to":"C","typical_years":2},
            {"from_role":"Kıdemli Uzman","to_role":"Yönetici","band_from":"C","band_to":"D","typical_years":3},
            {"from_role":"Takım Lideri","to_role":"Yönetici","band_from":"C","band_to":"D","typical_years":2},
            {"from_role":"Yönetici","to_role":"Direktör","band_from":"D","band_to":"E","typical_years":4},
        ],
        "CLUSTER_TAXONOMY": [
            {"id":"musteri-deneyimi","ad":"Müşteri Deneyimi"},
            {"id":"yazilim-gelistirme","ad":"Yazılım Geliştirme"},
            {"id":"veri-analitik","ad":"Veri & Analitik"},
            {"id":"devops-sre","ad":"DevOps & SRE"},
            {"id":"network-altyapi","ad":"Network & Altyapı"},
            {"id":"saha-operasyon","ad":"Saha Operasyon"},
            {"id":"satis-pazarlama","ad":"Satış & Pazarlama"},
            {"id":"kurumsal-satis","ad":"Kurumsal Satış"},
            {"id":"finans-muhasebe","ad":"Finans & Muhasebe"},
            {"id":"ik-yonetimi","ad":"İK Yönetimi"},
            {"id":"hukuk-uyum","ad":"Hukuk & Uyum"},
            {"id":"regulasyon","ad":"Regülasyon"},
            {"id":"isg","ad":"İSG"},
            {"id":"proje-yonetimi","ad":"Proje Yönetimi"},
            {"id":"strateji","ad":"Strateji & PMO"},
            {"id":"yonetim-becerileri","ad":"Yönetim Becerileri"},
            {"id":"davranissal","ad":"Davranışsal Yetkinlikler"},
        ],
        "PROFICIENCY_LEVELS": [{"seviye":1,"ad":"Farkında"},{"seviye":2,"ad":"Uygulayıcı"},{"seviye":3,"ad":"Yetkin"},{"seviye":4,"ad":"İleri"},{"seviye":5,"ad":"Uzman"}],
        "SKILL_MAP": {},
        "ROLE_MAP": {},
        "SALARY_BENCHMARK": {
            "A": {"min": 22000, "mid": 30000, "max": 40000, "sector_avg": 28000},
            "B": {"min": 38000, "mid": 52000, "max": 68000, "sector_avg": 48000},
            "C": {"min": 65000, "mid": 85000, "max": 110000, "sector_avg": 80000},
            "D": {"min": 105000, "mid": 140000, "max": 185000, "sector_avg": 130000},
            "E": {"min": 180000, "mid": 250000, "max": 380000, "sector_avg": 230000},
        },
        "HIRING_REASONS": ["Büyüme", "Ayrılma Yerine", "Yeni Proje", "Kadro Devri", "Staj Programı", "Mevsimsel Takviye"],
        "REJECTION_REASONS": ["Maaş Beklentisi", "Karşı Teklif", "Başka Teklif Kabul", "Çalışma Modeli Uyuşmazlığı", "Konum/Uzaklık", "Süreç Uzunluğu"],
        "HRBP_MAP": {
            "Müşteri Deneyimi": "Selin Yılmaz",
            "Teknoloji & Ar-Ge": "Burcu Aydın",
            "Network & Altyapı": "Selin Yılmaz",
            "Satış & Pazarlama": "Emre Karaca",
            "Finans & Satın Alma": "Emre Karaca",
            "İnsan & Kültür": "Burcu Aydın",
            "Hukuk & Regülasyon": "Emre Karaca",
            "İdari İşler & İSG": "Emre Karaca",
            "Strateji & PMO": "Burcu Aydın",
        },
        # TürkNet-specific: departman bazlı devir oranı çarpanları
        "DEPT_TURNOVER_MULT": {
            "Müşteri Deneyimi": 2.2,     # Çağrı merkezi = yüksek devir
            "Teknoloji & Ar-Ge": 0.9,
            "Network & Altyapı": 1.3,     # Saha = ortanın üstü
            "Satış & Pazarlama": 1.4,
            "Finans & Satın Alma": 0.7,
            "İnsan & Kültür": 0.6,
            "Hukuk & Regülasyon": 0.5,
            "İdari İşler & İSG": 0.8,
            "Strateji & PMO": 0.7,
        },
        # İşe alım kaynak kanalları
        "RECRUITMENT_SOURCES": [
            "LinkedIn", "Kariyer.net", "Kurumsal Kariyer Sitesi", "Çalışan Referansı",
            "Techcareer", "Üniversite & Staj", "Headhunter", "İç İlan", "Sosyal Medya"
        ],
        "SOURCE_WEIGHTS": [22, 18, 15, 14, 8, 8, 5, 6, 4],
    }


# ─────────────────────────────────────────────
#  SAVUNMA / HAVACILIK CONFIG (TUSAŞ)
# ─────────────────────────────────────────────
def _build_savunma_config():
    return {
        "DEPARTMENTS": [
            "Montaj Hattı", "CNC ve Talaşlı İmalat", "Kompozit Üretim",
            "Aviyonik Sistemler", "Yapısal Tasarım", "Sistem Mühendisliği",
            "Yazılım Mühendisliği", "Test ve Doğrulama", "Uçuş Bilimleri",
            "Kalite Güvence", "Tedarik Zinciri", "Proje Yönetimi",
            "Bilgi Teknolojileri", "İnsan Kaynakları"
        ],
        "DEPT_WEIGHTS": [13, 8, 8, 9, 7, 8, 7, 8, 6, 7, 6, 5, 4, 4],
        "DEPT_SEGMENT_MAP": {
            "Montaj Hattı": "Üretim", "CNC ve Talaşlı İmalat": "Üretim", "Kompozit Üretim": "Üretim",
            "Aviyonik Sistemler": "Mühendislik", "Yapısal Tasarım": "Mühendislik",
            "Sistem Mühendisliği": "Mühendislik", "Yazılım Mühendisliği": "Mühendislik",
            "Test ve Doğrulama": "Mühendislik", "Uçuş Bilimleri": "Mühendislik",
            "Kalite Güvence": "Destek", "Tedarik Zinciri": "Destek",
            "Proje Yönetimi": "Destek", "Bilgi Teknolojileri": "Destek",
            "İnsan Kaynakları": "Destek",
        },
        "SEGMENTS": ["Mühendislik", "Üretim", "Destek"],
        "DEPT_ROLE_FAMILIES": {
            "Montaj Hattı": ["Üretim"], "CNC ve Talaşlı İmalat": ["Üretim"], "Kompozit Üretim": ["Üretim"],
            "Aviyonik Sistemler": ["Mühendislik"], "Yapısal Tasarım": ["Mühendislik"],
            "Sistem Mühendisliği": ["Mühendislik"], "Yazılım Mühendisliği": ["Mühendislik"],
            "Test ve Doğrulama": ["Mühendislik"], "Uçuş Bilimleri": ["Mühendislik"],
            "Kalite Güvence": ["Kalite"], "Tedarik Zinciri": ["Tedarik"],
            "Proje Yönetimi": ["Yönetim"], "Bilgi Teknolojileri": ["BT"],
            "İnsan Kaynakları": ["İK"],
        },
        "DEPT_SKILL_CLUSTERS": {
            "Montaj Hattı": ["uretim-montaj", "kalite"], "CNC ve Talaşlı İmalat": ["uretim-cnc", "kalite"],
            "Kompozit Üretim": ["uretim-kompozit", "kalite"], "Aviyonik Sistemler": ["aviyonik", "elektronik"],
            "Yapısal Tasarım": ["yapisal", "cad-cam"], "Sistem Mühendisliği": ["sistem-muh", "entegrasyon"],
            "Yazılım Mühendisliği": ["yazilim", "gömülü-sistemler"], "Test ve Doğrulama": ["test-dogrulama", "kalite"],
            "Uçuş Bilimleri": ["ucus", "aerodinamik"], "Kalite Güvence": ["kalite", "sertifikasyon"],
            "Tedarik Zinciri": ["tedarik", "lojistik"], "Proje Yönetimi": ["proje-yonetimi"],
            "Bilgi Teknolojileri": ["bt-altyapi", "yazilim"], "İnsan Kaynakları": ["ik-yonetimi"],
        },
        "DEPT_SKILL_FOCUS": {
            "Montaj Hattı": {"tech": ["Uçak Montaj Teknikleri", "Yapısal Bütünlük Kontrolü", "Tork/Bağlantı Elemanları"], "soft": ["Takım Çalışması", "Detay Odaklılık"], "domain": ["Havacılık Standartları (AS9100)", "FOD Yönetimi"]},
            "CNC ve Talaşlı İmalat": {"tech": ["CNC Programlama (G-Code)", "CAM Yazılımları", "Hassas İşleme"], "soft": ["Detay Odaklılık"], "domain": ["Titanyum/Alüminyum İşleme", "Tolerans Yönetimi"]},
            "Kompozit Üretim": {"tech": ["Otoklav Kürlenme", "Hand Lay-up", "RTM/VARTM"], "soft": ["Kalite Bilinci"], "domain": ["Karbon Fiber Teknolojisi", "NDT Muayene"]},
            "Aviyonik Sistemler": {"tech": ["Aviyonik Sistem Entegrasyonu", "ARINC/MIL-STD", "Radar & EW Sistemleri"], "soft": ["Analitik Düşünme"], "domain": ["DO-178C", "DO-254", "Uçuş Kontrol Sistemleri"]},
            "Yapısal Tasarım": {"tech": ["CATIA/NX", "FEA (Nastran/Abaqus)", "Yapısal Analiz"], "soft": ["Problem Çözme"], "domain": ["Havacılık Malzeme Bilgisi", "Dayanım Hesapları", "Sertifikasyon"]},
            "Sistem Mühendisliği": {"tech": ["MBSE", "Gereksinim Yönetimi (DOORS)", "Sistem Entegrasyonu"], "soft": ["Sistem Düşüncesi"], "domain": ["V-Model Yaşam Döngüsü", "Arayüz Yönetimi"]},
            "Yazılım Mühendisliği": {"tech": ["C/C++/Ada", "Gömülü Sistemler", "RTOS"], "soft": ["Problem Çözme"], "domain": ["DO-178C Sertifikasyonu", "Model Tabanlı Tasarım", "Güvenlik Kritik Yazılım"]},
            "Test ve Doğrulama": {"tech": ["Yer Testleri", "Uçuş Test Enstrümantasyonu", "HIL/SIL Simülasyonu"], "soft": ["Analitik Düşünme"], "domain": ["Test Planlaması", "Hata Analizi (FMEA)"]},
            "Uçuş Bilimleri": {"tech": ["Aerodinamik Analiz (CFD)", "Performans Hesaplama", "Uçuş Mekaniği"], "soft": ["Bilimsel Yaklaşım"], "domain": ["Uçuş Zarfı", "Stabilite & Kontrol"]},
            "Kalite Güvence": {"tech": ["NDT Yöntemleri", "AS9100/EN9100", "İstatistiksel Proses Kontrol"], "soft": ["Detay Odaklılık"], "domain": ["EASA/SHGM Sertifikasyonu", "Müşteri Kabul"]},
            "Tedarik Zinciri": {"tech": ["SAP/ERP", "MRP Planlama"], "soft": ["Müzakere Becerisi"], "domain": ["Offset Yönetimi", "Havacılık Tedarik Standartları"]},
            "Proje Yönetimi": {"tech": ["MS Project/Primavera", "EVM (Kazanılmış Değer)"], "soft": ["Liderlik", "İletişim"], "domain": ["Savunma Proje Yönetimi", "Müşteri İlişkileri (SSB)"]},
            "Bilgi Teknolojileri": {"tech": ["PLM/PDM Sistemleri", "Siber Güvenlik", "ERP"], "soft": ["Çözüm Odaklılık"], "domain": ["ITAR/Gizlilik", "Veri Güvenliği"]},
            "İnsan Kaynakları": {"tech": ["İK Bilgi Sistemleri", "İK Analitiği"], "soft": ["İletişim", "Empati"], "domain": ["Güvenlik Soruşturması Yönetimi", "Yetenek Programları (SKY/LIFT UP)"]},
        },
        "TARGET_HEADCOUNT": {
            "Montaj Hattı": {"target": 310, "critical_roles": ["Kıdemli Montaj Teknisyeni", "Montaj Takım Lideri"]},
            "CNC ve Talaşlı İmalat": {"target": 190, "critical_roles": ["CNC Programcısı", "Hassas İşleme Uzmanı"]},
            "Kompozit Üretim": {"target": 190, "critical_roles": ["Kompozit Üretim Uzmanı", "NDT Teknisyeni"]},
            "Aviyonik Sistemler": {"target": 215, "critical_roles": ["Aviyonik Sistem Mühendisi", "Radar Mühendisi"]},
            "Yapısal Tasarım": {"target": 170, "critical_roles": ["Kıdemli Yapısal Tasarım Mühendisi", "Dayanım Uzmanı"]},
            "Sistem Mühendisliği": {"target": 190, "critical_roles": ["Sistem Entegrasyon Mühendisi", "Gereksinim Yöneticisi"]},
            "Yazılım Mühendisliği": {"target": 170, "critical_roles": ["Gömülü Yazılım Mühendisi", "DO-178C Uzmanı"]},
            "Test ve Doğrulama": {"target": 190, "critical_roles": ["Uçuş Test Mühendisi", "HIL/SIL Uzmanı"]},
            "Uçuş Bilimleri": {"target": 145, "critical_roles": ["Aerodinamik Mühendisi", "Performans Mühendisi"]},
            "Kalite Güvence": {"target": 165, "critical_roles": ["NDT Uzmanı", "Sertifikasyon Mühendisi"]},
            "Tedarik Zinciri": {"target": 150, "critical_roles": ["Offset Yöneticisi", "Havacılık Satın Alma Uzmanı"]},
            "Proje Yönetimi": {"target": 120, "critical_roles": ["Program Yöneticisi", "Planlama Uzmanı"]},
            "Bilgi Teknolojileri": {"target": 100, "critical_roles": ["PLM Uzmanı", "Siber Güvenlik Uzmanı"]},
            "İnsan Kaynakları": {"target": 95, "critical_roles": ["İşe Alım Uzmanı", "Yetenek Yönetimi Uzmanı"]},
        },
        "STRATEGIC_OBJECTIVES": [
            {"id": "kaan_teslimat", "name": "KAAN Seri Üretim & Teslimat", "description": "5. nesil savaş uçağı KAAN'ın seri üretim hattı kurulumu ve ilk teslimatlar", "priority": "Kritik",
             "required_skills": ["Uçak Montaj Teknikleri", "Aviyonik Sistem Entegrasyonu", "Uçuş Test Enstrümantasyonu"], "required_headcount": 600, "target_departments": ["Montaj Hattı", "Aviyonik Sistemler", "Test ve Doğrulama"], "timeline": "Q1-Q4 2025"},
            {"id": "hurjet_sertifikasyon", "name": "HÜRJET Sertifikasyon", "description": "Jet eğitim uçağı HÜRJET'in uçuşa elverişlilik sertifikasyonu", "priority": "Kritik",
             "required_skills": ["EASA/SHGM Sertifikasyonu", "DO-178C Sertifikasyonu", "Uçuş Zarfı"], "required_headcount": 250, "target_departments": ["Kalite Güvence", "Uçuş Bilimleri", "Yazılım Mühendisliği"], "timeline": "Q1-Q4 2025"},
            {"id": "iha_kapasite", "name": "İHA/SİHA Kapasite Artışı", "description": "ANKA ve AKSUNGUR platformlarında üretim kapasitesinin artırılması", "priority": "Yüksek",
             "required_skills": ["Kompozit Üretim", "Sistem Entegrasyonu", "MRP Planlama"], "required_headcount": 300, "target_departments": ["Kompozit Üretim", "Sistem Mühendisliği", "Tedarik Zinciri"], "timeline": "Q2-Q4 2025"},
            {"id": "dijital_donusum", "name": "Dijital Dönüşüm (Endüstri 4.0)", "description": "Akıllı fabrika, dijital ikiz ve PLM modernizasyonu", "priority": "Yüksek",
             "required_skills": ["PLM/PDM Sistemleri", "Siber Güvenlik", "Model Tabanlı Tasarım"], "required_headcount": 100, "target_departments": ["Bilgi Teknolojileri", "Sistem Mühendisliği"], "timeline": "Q1-Q4 2025"},
            {"id": "yetenek_kazanimi", "name": "Kritik Yetenek Kazanımı", "description": "SKY, LIFT UP, MGP programları ile nitelikli mühendis kazanımı", "priority": "Yüksek",
             "required_skills": ["Güvenlik Soruşturması Yönetimi", "Yetenek Programları (SKY/LIFT UP)"], "required_headcount": 95, "target_departments": ["İnsan Kaynakları"], "timeline": "Q1-Q4 2025"},
        ],
        "POSITIONS_BY_BAND": {
            "A": ["Teknisyen", "Operatör", "Stajyer", "Uzman Yardımcısı"],
            "B": ["Kıdemli Teknisyen", "Mühendis", "Uzman", "Analist"],
            "C": ["Kıdemli Mühendis", "Kıdemli Uzman", "Takım Lideri", "Baş Mühendis"],
            "D": ["Müdür", "Program Yöneticisi", "Bölüm Başkanı", "Teknik Müdür"],
            "E": ["Direktör", "Genel Müdür Yardımcısı", "Başkan Yardımcısı"],
        },
        "CAREER_PATH_BANDS": {
            "A": {"next": "B", "title": "Mühendis / Kıdemli Teknisyen", "timeline": "18-24 ay"},
            "B": {"next": "C", "title": "Kıdemli Mühendis / Takım Lideri", "timeline": "24-36 ay"},
            "C": {"next": "D", "title": "Müdür / Program Yöneticisi", "timeline": "36-48 ay"},
            "D": {"next": "E", "title": "Direktör", "timeline": "48-60 ay"},
            "E": {"next": "E", "title": "Üst Yönetim", "timeline": "devam eden"},
        },
        "SKILL_TAXONOMY": [
            # Üretim-Montaj
            {"id":"sv-montaj-teknik","ad":"Uçak Montaj Teknikleri","kume_id":"uretim-montaj","kategori":"Technical"},
            {"id":"sv-tork","ad":"Tork/Bağlantı Elemanları","kume_id":"uretim-montaj","kategori":"Technical"},
            {"id":"sv-fod","ad":"FOD Yönetimi","kume_id":"uretim-montaj","kategori":"Technical"},
            {"id":"sv-yapisal-butunluk","ad":"Yapısal Bütünlük Kontrolü","kume_id":"uretim-montaj","kategori":"Technical"},
            # Üretim-CNC
            {"id":"sv-cnc-prog","ad":"CNC Programlama (G-Code)","kume_id":"uretim-cnc","kategori":"Technical"},
            {"id":"sv-cam","ad":"CAM Yazılımları","kume_id":"uretim-cnc","kategori":"Technical"},
            {"id":"sv-hassas","ad":"Hassas İşleme","kume_id":"uretim-cnc","kategori":"Technical"},
            {"id":"sv-titanyum","ad":"Titanyum/Alüminyum İşleme","kume_id":"uretim-cnc","kategori":"Technical"},
            {"id":"sv-tolerans","ad":"Tolerans Yönetimi","kume_id":"uretim-cnc","kategori":"Technical"},
            # Üretim-Kompozit
            {"id":"sv-otoklav","ad":"Otoklav Kürlenme","kume_id":"uretim-kompozit","kategori":"Technical"},
            {"id":"sv-layup","ad":"Hand Lay-up / RTM","kume_id":"uretim-kompozit","kategori":"Technical"},
            {"id":"sv-karbon","ad":"Karbon Fiber Teknolojisi","kume_id":"uretim-kompozit","kategori":"Technical"},
            {"id":"sv-ndt-muayene","ad":"NDT Muayene","kume_id":"uretim-kompozit","kategori":"Technical"},
            # Aviyonik
            {"id":"sv-aviyonik-ent","ad":"Aviyonik Sistem Entegrasyonu","kume_id":"aviyonik","kategori":"Technical"},
            {"id":"sv-arinc","ad":"ARINC/MIL-STD Standartları","kume_id":"aviyonik","kategori":"Technical"},
            {"id":"sv-radar","ad":"Radar & EW Sistemleri","kume_id":"aviyonik","kategori":"Technical"},
            {"id":"sv-ucus-kontrol","ad":"Uçuş Kontrol Sistemleri","kume_id":"aviyonik","kategori":"Technical"},
            {"id":"sv-do178","ad":"DO-178C Sertifikasyonu","kume_id":"aviyonik","kategori":"Technical"},
            # Elektronik
            {"id":"sv-elektronik-tasarim","ad":"Elektronik Devre Tasarımı","kume_id":"elektronik","kategori":"Technical"},
            {"id":"sv-fpga","ad":"FPGA/ASIC Tasarımı","kume_id":"elektronik","kategori":"Technical"},
            {"id":"sv-emc","ad":"EMC/EMI Uyumluluk","kume_id":"elektronik","kategori":"Technical"},
            # Yapısal
            {"id":"sv-catia","ad":"CATIA/NX CAD","kume_id":"yapisal","kategori":"Technical"},
            {"id":"sv-fea","ad":"FEA (Nastran/Abaqus)","kume_id":"yapisal","kategori":"Technical"},
            {"id":"sv-yapisal-analiz","ad":"Yapısal Analiz","kume_id":"yapisal","kategori":"Technical"},
            {"id":"sv-malzeme","ad":"Havacılık Malzeme Bilgisi","kume_id":"yapisal","kategori":"Technical"},
            {"id":"sv-dayanim","ad":"Dayanım Hesapları","kume_id":"yapisal","kategori":"Technical"},
            # CAD-CAM
            {"id":"sv-catia-v5","ad":"CATIA V5/V6","kume_id":"cad-cam","kategori":"Technical"},
            {"id":"sv-3d-model","ad":"3D Modelleme","kume_id":"cad-cam","kategori":"Technical"},
            {"id":"sv-teknik-resim","ad":"Teknik Resim Okuma","kume_id":"cad-cam","kategori":"Technical"},
            # Sistem Mühendisliği
            {"id":"sv-mbse","ad":"MBSE","kume_id":"sistem-muh","kategori":"Technical"},
            {"id":"sv-doors","ad":"Gereksinim Yönetimi (DOORS)","kume_id":"sistem-muh","kategori":"Technical"},
            {"id":"sv-vmodel","ad":"V-Model Yaşam Döngüsü","kume_id":"sistem-muh","kategori":"Technical"},
            {"id":"sv-arayuz","ad":"Arayüz Yönetimi","kume_id":"sistem-muh","kategori":"Technical"},
            # Entegrasyon
            {"id":"sv-sistem-ent","ad":"Sistem Entegrasyonu","kume_id":"entegrasyon","kategori":"Technical"},
            {"id":"sv-test-planlama","ad":"Test Planlaması","kume_id":"entegrasyon","kategori":"Technical"},
            # Yazılım
            {"id":"sv-c-cpp","ad":"C/C++/Ada Programlama","kume_id":"yazilim","kategori":"Technical"},
            {"id":"sv-rtos","ad":"RTOS Geliştirme","kume_id":"yazilim","kategori":"Technical"},
            {"id":"sv-model-tabanli","ad":"Model Tabanlı Tasarım","kume_id":"yazilim","kategori":"Technical"},
            {"id":"sv-guvenlik-yazilim","ad":"Güvenlik Kritik Yazılım","kume_id":"yazilim","kategori":"Technical"},
            # Gömülü Sistemler
            {"id":"sv-gomulu","ad":"Gömülü Sistem Geliştirme","kume_id":"gömülü-sistemler","kategori":"Technical"},
            {"id":"sv-hil-sil","ad":"HIL/SIL Simülasyonu","kume_id":"gömülü-sistemler","kategori":"Technical"},
            # Test-Doğrulama
            {"id":"sv-yer-test","ad":"Yer Testleri","kume_id":"test-dogrulama","kategori":"Technical"},
            {"id":"sv-ucus-test","ad":"Uçuş Test Enstrümantasyonu","kume_id":"test-dogrulama","kategori":"Technical"},
            {"id":"sv-fmea","ad":"Hata Analizi (FMEA)","kume_id":"test-dogrulama","kategori":"Technical"},
            {"id":"sv-test-otomasyon","ad":"Test Otomasyonu","kume_id":"test-dogrulama","kategori":"Technical"},
            # Kalite
            {"id":"sv-ndt","ad":"NDT Yöntemleri","kume_id":"kalite","kategori":"Technical"},
            {"id":"sv-as9100","ad":"AS9100/EN9100","kume_id":"kalite","kategori":"Technical"},
            {"id":"sv-spc","ad":"İstatistiksel Proses Kontrol","kume_id":"kalite","kategori":"Technical"},
            {"id":"sv-easa","ad":"EASA/SHGM Sertifikasyonu","kume_id":"kalite","kategori":"Technical"},
            # Uçuş
            {"id":"sv-aerodinamik","ad":"Aerodinamik Analiz (CFD)","kume_id":"ucus","kategori":"Technical"},
            {"id":"sv-performans","ad":"Performans Hesaplama","kume_id":"ucus","kategori":"Technical"},
            {"id":"sv-stabilite","ad":"Stabilite & Kontrol","kume_id":"ucus","kategori":"Technical"},
            {"id":"sv-ucus-zarfi","ad":"Uçuş Zarfı","kume_id":"ucus","kategori":"Technical"},
            # Aerodinamik
            {"id":"sv-cfd","ad":"CFD Simülasyonu","kume_id":"aerodinamik","kategori":"Technical"},
            {"id":"sv-ruzgar-tuneli","ad":"Rüzgar Tüneli Testleri","kume_id":"aerodinamik","kategori":"Technical"},
            # Tedarik
            {"id":"sv-sap","ad":"SAP/ERP","kume_id":"tedarik","kategori":"Technical"},
            {"id":"sv-mrp","ad":"MRP Planlama","kume_id":"tedarik","kategori":"Technical"},
            {"id":"sv-offset","ad":"Offset Yönetimi","kume_id":"tedarik","kategori":"Technical"},
            # Proje Yönetimi
            {"id":"sv-primavera","ad":"MS Project/Primavera","kume_id":"proje-yonetimi","kategori":"Technical"},
            {"id":"sv-evm","ad":"Kazanılmış Değer Yönetimi","kume_id":"proje-yonetimi","kategori":"Technical"},
            {"id":"sv-ssb","ad":"Müşteri İlişkileri (SSB)","kume_id":"proje-yonetimi","kategori":"Technical"},
            # BT
            {"id":"sv-plm","ad":"PLM/PDM Sistemleri","kume_id":"bt-altyapi","kategori":"Technical"},
            {"id":"sv-siber","ad":"Siber Güvenlik","kume_id":"bt-altyapi","kategori":"Technical"},
            {"id":"sv-itar","ad":"ITAR/Gizlilik","kume_id":"bt-altyapi","kategori":"Technical"},
            # İK
            {"id":"sv-ik-bilgi","ad":"İK Bilgi Sistemleri","kume_id":"ik-yonetimi","kategori":"Technical"},
            {"id":"sv-ik-analitik","ad":"İK Analitiği","kume_id":"ik-yonetimi","kategori":"Technical"},
            {"id":"sv-yetenek","ad":"Yetenek Programları (SKY/LIFT UP)","kume_id":"ik-yonetimi","kategori":"Technical"},
            {"id":"sv-guvenlik-sor","ad":"Güvenlik Soruşturması Yönetimi","kume_id":"ik-yonetimi","kategori":"Technical"},
            # Liderlik & Soft Skills
            {"id":"sv-liderlik","ad":"Liderlik","kume_id":"liderlik-yonetim","kategori":"Soft"},
            {"id":"sv-takim","ad":"Takım Çalışması","kume_id":"liderlik-yonetim","kategori":"Soft"},
            {"id":"sv-iletisim","ad":"İletişim","kume_id":"liderlik-yonetim","kategori":"Soft"},
            {"id":"sv-problem","ad":"Problem Çözme","kume_id":"liderlik-yonetim","kategori":"Soft"},
            {"id":"sv-analitik","ad":"Analitik Düşünme","kume_id":"davranissal-iletisim","kategori":"Soft"},
            {"id":"sv-detay","ad":"Detay Odaklılık","kume_id":"davranissal-iletisim","kategori":"Soft"},
            {"id":"sv-kalite-bilinci","ad":"Kalite Bilinci","kume_id":"davranissal-iletisim","kategori":"Soft"},
            {"id":"sv-stres","ad":"Stres Yönetimi","kume_id":"davranissal-iletisim","kategori":"Soft"},
        ],
        "CLUSTER_TAXONOMY": [
            {"id":"uretim-montaj","ad":"Üretim & Montaj"},
            {"id":"uretim-cnc","ad":"CNC & Talaşlı İmalat"},
            {"id":"uretim-kompozit","ad":"Kompozit Üretim"},
            {"id":"aviyonik","ad":"Aviyonik Sistemler"},
            {"id":"elektronik","ad":"Elektronik Tasarım"},
            {"id":"yapisal","ad":"Yapısal Tasarım & Analiz"},
            {"id":"cad-cam","ad":"CAD/CAM"},
            {"id":"sistem-muh","ad":"Sistem Mühendisliği"},
            {"id":"entegrasyon","ad":"Entegrasyon & Test"},
            {"id":"yazilim","ad":"Yazılım Mühendisliği"},
            {"id":"gömülü-sistemler","ad":"Gömülü Sistemler"},
            {"id":"test-dogrulama","ad":"Test & Doğrulama"},
            {"id":"kalite","ad":"Kalite & Sertifikasyon"},
            {"id":"ucus","ad":"Uçuş Bilimleri"},
            {"id":"aerodinamik","ad":"Aerodinamik"},
            {"id":"tedarik","ad":"Tedarik & Lojistik"},
            {"id":"proje-yonetimi","ad":"Proje Yönetimi"},
            {"id":"bt-altyapi","ad":"Bilgi Teknolojileri"},
            {"id":"ik-yonetimi","ad":"İK Yönetimi"},
            {"id":"liderlik-yonetim","ad":"Liderlik & Yönetim"},
            {"id":"davranissal-iletisim","ad":"Davranışsal & İletişim"},
        ],
        "CAREER_PATHS": [
            {"from_role":"Teknisyen","to_role":"Kıdemli Teknisyen","band_from":"A","band_to":"B","typical_years":2},
            {"from_role":"Operatör","to_role":"Kıdemli Teknisyen","band_from":"A","band_to":"B","typical_years":3},
            {"from_role":"Mühendis","to_role":"Kıdemli Mühendis","band_from":"B","band_to":"C","typical_years":3},
            {"from_role":"Kıdemli Mühendis","to_role":"Takım Lideri","band_from":"C","band_to":"C","typical_years":2},
            {"from_role":"Takım Lideri","to_role":"Müdür","band_from":"C","band_to":"D","typical_years":3},
            {"from_role":"Müdür","to_role":"Direktör","band_from":"D","band_to":"E","typical_years":4},
            {"from_role":"Uzman","to_role":"Kıdemli Uzman","band_from":"B","band_to":"C","typical_years":3},
            {"from_role":"Kıdemli Uzman","to_role":"Müdür","band_from":"C","band_to":"D","typical_years":4},
        ],
        "ROLE_TAXONOMY": [],
        "PROFICIENCY_LEVELS": [{"seviye":1,"ad":"Farkında"},{"seviye":2,"ad":"Uygulayıcı"},{"seviye":3,"ad":"Yetkin"},{"seviye":4,"ad":"İleri"},{"seviye":5,"ad":"Uzman"}],
        "SKILL_MAP": {},
        "ROLE_MAP": {},
        "SALARY_BENCHMARK": {
            "A": {"min": 35000, "mid": 50000, "max": 68000, "sector_avg": 48000},
            "B": {"min": 60000, "mid": 82000, "max": 110000, "sector_avg": 78000},
            "C": {"min": 100000, "mid": 135000, "max": 175000, "sector_avg": 128000},
            "D": {"min": 165000, "mid": 210000, "max": 280000, "sector_avg": 200000},
            "E": {"min": 270000, "mid": 350000, "max": 480000, "sector_avg": 330000},
        },
        "HIRING_REASONS": ["Büyüme (Proje)", "Ayrılma Yerine", "Yeni Program", "Kapasite Artışı", "Staj/SKY Programı", "Yurt Dışı Transfer"],
        "REJECTION_REASONS": ["Güvenlik Soruşturması", "Maaş Beklentisi", "Yurt Dışı Teklif", "Başka Savunma Şirketi", "Teknik Yeterlilik", "Süreç Uzunluğu"],
        "HRBP_MAP": {
            "Montaj Hattı": "Merve Aksoy", "CNC ve Talaşlı İmalat": "Merve Aksoy", "Kompozit Üretim": "Merve Aksoy",
            "Aviyonik Sistemler": "Elif Korkmaz", "Yapısal Tasarım": "Elif Korkmaz",
            "Sistem Mühendisliği": "Elif Korkmaz", "Yazılım Mühendisliği": "Elif Korkmaz",
            "Test ve Doğrulama": "Deniz Yıldırım", "Uçuş Bilimleri": "Deniz Yıldırım",
            "Kalite Güvence": "Deniz Yıldırım", "Tedarik Zinciri": "Deniz Yıldırım",
            "Proje Yönetimi": "Ayşe Çetin", "Bilgi Teknolojileri": "Ayşe Çetin",
            "İnsan Kaynakları": "Ayşe Çetin",
        },
        "DEPT_TURNOVER_MULT": {
            "Montaj Hattı": 0.9, "CNC ve Talaşlı İmalat": 0.8, "Kompozit Üretim": 0.8,
            "Aviyonik Sistemler": 1.3, "Yapısal Tasarım": 1.1, "Sistem Mühendisliği": 1.2,
            "Yazılım Mühendisliği": 1.5, "Test ve Doğrulama": 1.0, "Uçuş Bilimleri": 1.1,
            "Kalite Güvence": 0.7, "Tedarik Zinciri": 0.9, "Proje Yönetimi": 0.8,
            "Bilgi Teknolojileri": 1.4, "İnsan Kaynakları": 0.6,
        },
        "RECRUITMENT_SOURCES": ["Kariyer Portalı", "LinkedIn", "SKY Programı", "Çalışan Referansı", "Kariyer Fuarı"],
        "SOURCE_WEIGHTS": [35, 20, 18, 15, 12],
        "PROJECTS": ["KAAN", "HURJET", "ANKA", "AKSUNGUR", "GOKBEY", "A400M Yapısallar", "Uzay Sistemleri", "Genel"],
    }

# ─── Caching ───
_config_cache = {}

def get_sector_config(sector="Bankacılık"):
    """Return the full taxonomy config dict for the given sector."""
    if sector not in _config_cache:
        if sector == "Perakende":
            _config_cache[sector] = _build_retail_config()
        elif sector == "Teknoloji":
            _config_cache[sector] = _build_teknoloji_config()
        elif sector in ("Savunma/Havacılık", "Savunma"):
            _config_cache[sector] = _build_savunma_config()
        else:
            _config_cache[sector] = _build_banking_config()
    return _config_cache[sector]
