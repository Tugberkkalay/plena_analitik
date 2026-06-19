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


# ─── Caching ───
_config_cache = {}

def get_sector_config(sector="Bankacılık"):
    """Return the full taxonomy config dict for the given sector."""
    if sector not in _config_cache:
        if sector == "Perakende":
            _config_cache[sector] = _build_retail_config()
        else:
            _config_cache[sector] = _build_banking_config()
    return _config_cache[sector]
