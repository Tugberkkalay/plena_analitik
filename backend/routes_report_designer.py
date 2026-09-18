"""
Report Designer API — KPI tanımlama, hesaplama formülleri, rapor oluşturma/yürütme.
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from collections import Counter

router = APIRouter(prefix="/api/report-designer", tags=["report-designer"])
db = None

def setup_report_designer(database):
    global db
    db = database

# ─── Data Source Definitions ───
DATA_SOURCES = {
    "employees": {
        "label": "Çalışanlar",
        "collection": "employees",
        "columns": {
            "name": {"label": "Ad Soyad", "type": "text", "role": "dimension"},
            "department": {"label": "Departman", "type": "category", "role": "dimension"},
            "segment": {"label": "Segment/Grup", "type": "category", "role": "dimension"},
            "project": {"label": "Proje", "type": "category", "role": "dimension"},
            "job_title": {"label": "Kadro/Unvan", "type": "category", "role": "dimension"},
            "band": {"label": "Band", "type": "category", "role": "dimension"},
            "city": {"label": "Lokasyon", "type": "category", "role": "dimension"},
            "gender": {"label": "Cinsiyet", "type": "category", "role": "dimension"},
            "education_level": {"label": "Eğitim Seviyesi", "type": "category", "role": "dimension"},
            "university": {"label": "Üniversite", "type": "category", "role": "dimension"},
            "hrbp": {"label": "HRBP", "type": "category", "role": "dimension"},
            "status": {"label": "Durum", "type": "category", "role": "dimension"},
            "leaving_reason": {"label": "Ayrılma Nedeni", "type": "category", "role": "dimension"},
            "termination_type": {"label": "Ayrılma Tipi", "type": "category", "role": "dimension"},
            "recruitment_source": {"label": "İşe Alım Kaynağı", "type": "category", "role": "dimension"},
            "marital_status": {"label": "Medeni Durum", "type": "category", "role": "dimension"},
            "hire_date": {"label": "İşe Giriş Tarihi", "type": "date", "role": "dimension"},
            "termination_date": {"label": "Çıkış Tarihi", "type": "date", "role": "dimension"},
            "salary": {"label": "Aylık Brüt Ücret", "type": "number", "role": "measure"},
            "age": {"label": "Yaş", "type": "number", "role": "measure"},
            "seniority_years": {"label": "Kıdem (Yıl)", "type": "number", "role": "measure"},
            "performance_score": {"label": "Performans Puanı", "type": "number", "role": "measure"},
            "engagement_score": {"label": "Bağlılık Skoru", "type": "number", "role": "measure"},
            "is_talent": {"label": "Kritik Rol", "type": "boolean", "role": "dimension"},
            "is_manager": {"label": "Yönetici", "type": "boolean", "role": "dimension"},
        },
    },
    "recruitment": {
        "label": "İşe Alım Hunisi",
        "collection": "recruitment",
        "columns": {
            "department": {"label": "Departman", "type": "category", "role": "dimension"},
            "position": {"label": "Pozisyon", "type": "category", "role": "dimension"},
            "source": {"label": "Başvuru Kanalı", "type": "category", "role": "dimension"},
            "stage": {"label": "Son Aşama", "type": "category", "role": "dimension"},
            "status": {"label": "Durum", "type": "category", "role": "dimension"},
            "band": {"label": "Band", "type": "category", "role": "dimension"},
            "gender": {"label": "Cinsiyet", "type": "category", "role": "dimension"},
            "university": {"label": "Üniversite", "type": "category", "role": "dimension"},
            "education": {"label": "Eğitim", "type": "category", "role": "dimension"},
            "hrbp": {"label": "HRBP", "type": "category", "role": "dimension"},
            "segment": {"label": "Segment", "type": "category", "role": "dimension"},
            "hired": {"label": "İşe Alındı", "type": "boolean", "role": "dimension"},
            "rejection_reason": {"label": "Red Nedeni", "type": "category", "role": "dimension"},
            "application_date": {"label": "Başvuru Tarihi", "type": "date", "role": "dimension"},
            "start_date": {"label": "İşe Başlama Tarihi", "type": "date", "role": "dimension"},
            "total_days": {"label": "Toplam Süre (gün)", "type": "number", "role": "measure"},
        },
    },
    "talent_programs": {
        "label": "Yetenek Programları",
        "collection": "talent_programs",
        "columns": {
            "program": {"label": "Program", "type": "category", "role": "dimension"},
            "donem": {"label": "Dönem", "type": "number", "role": "dimension"},
            "cinsiyet": {"label": "Cinsiyet", "type": "category", "role": "dimension"},
            "universite": {"label": "Üniversite", "type": "category", "role": "dimension"},
            "tamamladi": {"label": "Tamamladı", "type": "boolean", "role": "dimension"},
            "ise_alindi": {"label": "İşe Alındı", "type": "boolean", "role": "dimension"},
            "ilk_yil_kaldi": {"label": "İlk Yıl Kaldı", "type": "boolean", "role": "dimension"},
        },
    },
    "engagement": {
        "label": "Bağlılık Anketleri",
        "collection": "engagement",
        "columns": {
            "employee_name": {"label": "Ad Soyad", "type": "text", "role": "dimension"},
            "department": {"label": "Departman", "type": "category", "role": "dimension"},
            "survey_date": {"label": "Anket Tarihi", "type": "date", "role": "dimension"},
            "engagement_score": {"label": "Bağlılık Skoru", "type": "number", "role": "measure"},
            "enps_score": {"label": "eNPS Skoru", "type": "number", "role": "measure"},
            "satisfaction": {"label": "Memnuniyet", "type": "number", "role": "measure"},
            "work_life_balance": {"label": "İş-Yaşam Dengesi", "type": "number", "role": "measure"},
            "career_growth": {"label": "Kariyer Gelişimi", "type": "number", "role": "measure"},
            "manager_rating": {"label": "Yönetici Değerlendirme", "type": "number", "role": "measure"},
            "recognition": {"label": "Tanınma", "type": "number", "role": "measure"},
            "culture_alignment": {"label": "Kültür Uyumu", "type": "number", "role": "measure"},
            "absenteeism_days": {"label": "Devamsızlık (gün)", "type": "number", "role": "measure"},
        },
    },
    "training": {
        "label": "Eğitim & Gelişim",
        "collection": "training",
        "columns": {
            "employee_name": {"label": "Ad Soyad", "type": "text", "role": "dimension"},
            "department": {"label": "Departman", "type": "category", "role": "dimension"},
            "course_name": {"label": "Eğitim Adı", "type": "category", "role": "dimension"},
            "category": {"label": "Kategori", "type": "category", "role": "dimension"},
            "status": {"label": "Durum", "type": "category", "role": "dimension"},
            "mandatory": {"label": "Zorunlu", "type": "boolean", "role": "dimension"},
            "hours": {"label": "Saat", "type": "number", "role": "measure"},
            "score": {"label": "Puan", "type": "number", "role": "measure"},
            "cost": {"label": "Maliyet", "type": "number", "role": "measure"},
            "date": {"label": "Tarih", "type": "date", "role": "dimension"},
        },
    },
}

# ─── KPI Templates ───
KPI_TEMPLATES = [
    {"id": "turnover_rate", "name": "Turnover Oranı", "description": "Ayrılan / Toplam Aktif x 100",
     "data_source": "employees", "formula": "count_where(status='terminated') / count_where(status='active') * 100",
     "format": "percent", "category": "İşgücü"},
    {"id": "voluntary_turnover", "name": "Gönüllü Turnover", "description": "Gönüllü Ayrılan / Toplam Aktif x 100",
     "data_source": "employees", "formula": "count_where(termination_type='voluntary') / count_where(status='active') * 100",
     "format": "percent", "category": "İşgücü"},
    {"id": "avg_salary", "name": "Ortalama Ücret", "description": "Aktif çalışanların ortalama brüt ücreti",
     "data_source": "employees", "formula": "avg(salary) where status='active'",
     "format": "currency", "category": "Ücret"},
    {"id": "headcount", "name": "Aktif Çalışan Sayısı", "description": "Aktif çalışan sayısı",
     "data_source": "employees", "formula": "count_where(status='active')",
     "format": "number", "category": "İşgücü"},
    {"id": "female_ratio", "name": "Kadın Oranı", "description": "Kadın / Toplam Aktif x 100",
     "data_source": "employees", "formula": "count_where(gender='Female',status='active') / count_where(status='active') * 100",
     "format": "percent", "category": "Çeşitlilik"},
    {"id": "avg_seniority", "name": "Ortalama Kıdem", "description": "Aktif çalışanların ortalama kıdem yılı",
     "data_source": "employees", "formula": "avg(seniority_years) where status='active'",
     "format": "decimal", "category": "İşgücü"},
    {"id": "avg_performance", "name": "Ortalama Performans", "description": "Aktif çalışanların ortalama performans puanı",
     "data_source": "employees", "formula": "avg(performance_score) where status='active'",
     "format": "decimal", "category": "Performans"},
    {"id": "time_to_hire", "name": "Time-to-Hire", "description": "İşe alınanların ortalama süre (gün)",
     "data_source": "recruitment", "formula": "avg(total_days) where hired=true",
     "format": "number", "category": "İşe Alım"},
    {"id": "offer_acceptance", "name": "Teklif Kabul Oranı", "description": "İşe başlayan / Teklif alan x 100",
     "data_source": "recruitment", "formula": "count_where(hired=true) / count_where(stage='Teklif' or hired=true) * 100",
     "format": "percent", "category": "İşe Alım"},
    {"id": "funnel_conversion", "name": "Huni Dönüşüm Oranı", "description": "İşe başlayan / Toplam başvuru x 100",
     "data_source": "recruitment", "formula": "count_where(hired=true) / count() * 100",
     "format": "percent", "category": "İşe Alım"},
    {"id": "program_completion", "name": "Program Tamamlama Oranı", "description": "Tamamlayan / Toplam katılımcı x 100",
     "data_source": "talent_programs", "formula": "count_where(tamamladi=true) / count() * 100",
     "format": "percent", "category": "Yetenek"},
    {"id": "program_hire_rate", "name": "Program İşe Dönüşüm", "description": "İşe alınan / Toplam katılımcı x 100",
     "data_source": "talent_programs", "formula": "count_where(ise_alindi=true) / count() * 100",
     "format": "percent", "category": "Yetenek"},
    {"id": "program_retention", "name": "Program Retention", "description": "İlk yıl kalan / İşe alınan x 100",
     "data_source": "talent_programs", "formula": "count_where(ilk_yil_kaldi=true) / count_where(ise_alindi=true) * 100",
     "format": "percent", "category": "Yetenek"},
    {"id": "critical_role_ratio", "name": "Kritik Rol Oranı", "description": "Kritik roldeki / Toplam aktif x 100",
     "data_source": "employees", "formula": "count_where(is_talent=true,status='active') / count_where(status='active') * 100",
     "format": "percent", "category": "Yetenek"},
    {"id": "avg_engagement", "name": "Ortalama Bağlılık", "description": "Aktif çalışanların ortalama bağlılık skoru",
     "data_source": "employees", "formula": "avg(engagement_score) where status='active'",
     "format": "decimal", "category": "Bağlılık"},
    # Engagement-specific KPIs
    {"id": "enps", "name": "eNPS Skoru", "description": "Çalışan Net Tavsiye Skoru",
     "data_source": "engagement", "formula": "(promoters - detractors) / total * 100",
     "format": "number", "category": "Bağlılık"},
    {"id": "avg_satisfaction", "name": "Ort. Memnuniyet", "description": "Ortalama memnuniyet puanı (1-5)",
     "data_source": "engagement", "formula": "avg(satisfaction)",
     "format": "decimal", "category": "Bağlılık"},
    {"id": "avg_wlb", "name": "İş-Yaşam Dengesi", "description": "Ortalama iş-yaşam dengesi puanı (1-5)",
     "data_source": "engagement", "formula": "avg(work_life_balance)",
     "format": "decimal", "category": "Bağlılık"},
    {"id": "avg_absenteeism", "name": "Ort. Devamsızlık", "description": "Ortalama devamsızlık günü",
     "data_source": "engagement", "formula": "avg(absenteeism_days)",
     "format": "decimal", "category": "Bağlılık"},
    # Training KPIs
    {"id": "training_hours", "name": "Toplam Eğitim Saati", "description": "Verilen toplam eğitim saati",
     "data_source": "training", "formula": "sum(hours)",
     "format": "number", "category": "Eğitim"},
    {"id": "training_completion", "name": "Eğitim Tamamlama %", "description": "Tamamlanan / Toplam eğitim x 100",
     "data_source": "training", "formula": "count_where(status='Completed') / count() * 100",
     "format": "percent", "category": "Eğitim"},
    {"id": "training_avg_score", "name": "Ort. Eğitim Puanı", "description": "Tamamlanan eğitimlerin ortalama puanı",
     "data_source": "training", "formula": "avg(score) where status='Completed'",
     "format": "decimal", "category": "Eğitim"},
    {"id": "training_cost", "name": "Toplam Eğitim Maliyeti", "description": "Toplam eğitim yatırımı",
     "data_source": "training", "formula": "sum(cost)",
     "format": "currency", "category": "Eğitim"},
    {"id": "hours_per_emp", "name": "Kişi Başı Eğitim Saati", "description": "Benzersiz katılımcı başına ortalama eğitim saati",
     "data_source": "training", "formula": "sum(hours) / distinct_count(employee_id)",
     "format": "decimal", "category": "Eğitim"},
]

# ─── Models ───
class ReportCreate(BaseModel):
    name: str
    data_source: str
    chart_type: str = "table"
    dimensions: list = []
    measures: list = []
    filters: list = []
    kpi_ids: list = []
    conditional_formatting: list = []
    description: str = ""

class ReportUpdate(BaseModel):
    name: Optional[str] = None
    chart_type: Optional[str] = None
    dimensions: Optional[list] = None
    measures: Optional[list] = None
    filters: Optional[list] = None
    kpi_ids: Optional[list] = None
    conditional_formatting: Optional[list] = None
    description: Optional[str] = None


# ─── Endpoints ───

@router.get("/data-sources")
async def get_data_sources(tenant: str = None):
    """Return available data sources with column metadata."""
    return {"data_sources": DATA_SOURCES}


@router.get("/data-sources/{source_id}/preview")
async def preview_data_source(source_id: str, tenant: str = None, limit: int = 20):
    """Return first N rows of a data source for preview."""
    if source_id not in DATA_SOURCES:
        raise HTTPException(404, "Veri kaynağı bulunamadı")
    ds = DATA_SOURCES[source_id]
    query = {"tenant_id": tenant} if tenant else {}
    rows = await db[ds["collection"]].find(query, {"_id": 0, "skills": 0, "created_at": 0, "data_source": 0}).to_list(limit)
    return {"rows": rows, "total": await db[ds["collection"]].count_documents(query)}


@router.get("/data-sources/{source_id}/values/{column}")
async def get_column_values(source_id: str, column: str, tenant: str = None):
    """Return distinct values for a category column (for filter dropdowns)."""
    if source_id not in DATA_SOURCES:
        raise HTTPException(404, "Veri kaynağı bulunamadı")
    ds = DATA_SOURCES[source_id]
    query = {"tenant_id": tenant} if tenant else {}
    values = await db[ds["collection"]].distinct(column, query)

# ─── Hazır Rapor Şablonları ───
REPORT_TEMPLATES = [
    # İşgücü
    {"name": "Departman Bazlı Headcount", "data_source": "employees", "chart_type": "bar",
     "dimensions": ["department"], "measures": [{"column": "salary", "aggregation": "count", "label": "Çalışan Sayısı"}],
     "filters": [{"column": "status", "operator": "eq", "value": "active"}], "kpi_ids": ["headcount", "female_ratio"], "category": "İşgücü"},
    {"name": "Band Bazlı Ücret Dağılımı", "data_source": "employees", "chart_type": "bar",
     "dimensions": ["band"], "measures": [{"column": "salary", "aggregation": "avg", "label": "Ort. Ücret"}, {"column": "salary", "aggregation": "count", "label": "Kişi Sayısı"}],
     "filters": [{"column": "status", "operator": "eq", "value": "active"}], "kpi_ids": ["avg_salary", "headcount"], "category": "Ücret"},
    {"name": "Turnover Analizi (Departman)", "data_source": "employees", "chart_type": "bar",
     "dimensions": ["department"], "measures": [{"column": "salary", "aggregation": "count", "label": "Ayrılan Sayı"}],
     "filters": [{"column": "status", "operator": "eq", "value": "terminated"}], "kpi_ids": ["turnover_rate", "voluntary_turnover"], "category": "İşgücü"},
    {"name": "Cinsiyet Dağılımı", "data_source": "employees", "chart_type": "pie",
     "dimensions": ["gender"], "measures": [{"column": "salary", "aggregation": "count", "label": "Kişi"}],
     "filters": [{"column": "status", "operator": "eq", "value": "active"}], "kpi_ids": ["female_ratio"], "category": "Çeşitlilik"},
    {"name": "Performans Dağılımı", "data_source": "employees", "chart_type": "bar",
     "dimensions": ["department"], "measures": [{"column": "performance_score", "aggregation": "avg", "label": "Ort. Performans"}],
     "filters": [{"column": "status", "operator": "eq", "value": "active"}], "kpi_ids": ["avg_performance", "headcount"], "category": "Performans"},
    {"name": "Eğitim Bazlı Kıdem", "data_source": "employees", "chart_type": "bar",
     "dimensions": ["education_level"], "measures": [{"column": "seniority_years", "aggregation": "avg", "label": "Ort. Kıdem"}, {"column": "salary", "aggregation": "count", "label": "Kişi"}],
     "filters": [{"column": "status", "operator": "eq", "value": "active"}], "kpi_ids": ["avg_seniority"], "category": "İşgücü"},
    {"name": "Lokasyon Bazlı Dağılım", "data_source": "employees", "chart_type": "pie",
     "dimensions": ["city"], "measures": [{"column": "salary", "aggregation": "count", "label": "Kişi"}],
     "filters": [{"column": "status", "operator": "eq", "value": "active"}], "kpi_ids": ["headcount"], "category": "İşgücü"},
    # İşe Alım
    {"name": "Başvuru Kanalı Analizi", "data_source": "recruitment", "chart_type": "bar",
     "dimensions": ["source"], "measures": [{"column": "total_days", "aggregation": "count", "label": "Başvuru"}, {"column": "total_days", "aggregation": "avg", "label": "Ort. Süre (gün)"}],
     "filters": [], "kpi_ids": ["funnel_conversion", "time_to_hire"], "category": "İşe Alım"},
    {"name": "İşe Alım Hunisi (Aşama)", "data_source": "recruitment", "chart_type": "bar",
     "dimensions": ["stage"], "measures": [{"column": "total_days", "aggregation": "count", "label": "Aday Sayısı"}],
     "filters": [], "kpi_ids": ["funnel_conversion", "offer_acceptance"], "category": "İşe Alım"},
    {"name": "Red Nedeni Dağılımı", "data_source": "recruitment", "chart_type": "pie",
     "dimensions": ["rejection_reason"], "measures": [{"column": "total_days", "aggregation": "count", "label": "Aday"}],
     "filters": [{"column": "hired", "operator": "eq", "value": False}], "kpi_ids": [], "category": "İşe Alım"},
    {"name": "Departman Bazlı İşe Alım", "data_source": "recruitment", "chart_type": "bar",
     "dimensions": ["department"], "measures": [{"column": "total_days", "aggregation": "count", "label": "Başvuru"}, {"column": "total_days", "aggregation": "avg", "label": "Ort. Süre"}],
     "filters": [], "kpi_ids": ["time_to_hire"], "category": "İşe Alım"},
    # Eğitim
    {"name": "Eğitim Kategorisi Bazlı Tamamlama", "data_source": "training", "chart_type": "bar",
     "dimensions": ["category"], "measures": [{"column": "hours", "aggregation": "sum", "label": "Toplam Saat"}, {"column": "hours", "aggregation": "count", "label": "Kayıt"}],
     "filters": [], "kpi_ids": ["training_completion", "training_hours"], "category": "Eğitim"},
    {"name": "Departman Eğitim Yatırımı", "data_source": "training", "chart_type": "bar",
     "dimensions": ["department"], "measures": [{"column": "cost", "aggregation": "sum", "label": "Toplam Maliyet"}, {"column": "hours", "aggregation": "avg", "label": "Ort. Saat"}],
     "filters": [], "kpi_ids": ["training_cost", "hours_per_emp"], "category": "Eğitim"},
    {"name": "Eğitim Program Detayı", "data_source": "training", "chart_type": "table",
     "dimensions": ["course_name"], "measures": [{"column": "hours", "aggregation": "count", "label": "Katılımcı"}, {"column": "score", "aggregation": "avg", "label": "Ort. Puan"}, {"column": "cost", "aggregation": "sum", "label": "Toplam Maliyet"}],
     "filters": [], "kpi_ids": ["training_avg_score"], "category": "Eğitim"},
    # Bağlılık
    {"name": "Departman Bağlılık Karşılaştırma", "data_source": "engagement", "chart_type": "bar",
     "dimensions": ["department"], "measures": [{"column": "engagement_score", "aggregation": "avg", "label": "Ort. Bağlılık"}, {"column": "satisfaction", "aggregation": "avg", "label": "Ort. Memnuniyet"}],
     "filters": [], "kpi_ids": ["enps", "avg_satisfaction"], "category": "Bağlılık"},
    {"name": "eNPS & Devamsızlık Analizi", "data_source": "engagement", "chart_type": "bar",
     "dimensions": ["department"], "measures": [{"column": "enps_score", "aggregation": "avg", "label": "Ort. eNPS"}, {"column": "absenteeism_days", "aggregation": "avg", "label": "Ort. Devamsızlık"}],
     "filters": [], "kpi_ids": ["enps", "avg_absenteeism"], "category": "Bağlılık"},
    # Yetenek
    {"name": "Program Bazlı Dönüşüm", "data_source": "talent_programs", "chart_type": "bar",
     "dimensions": ["program"], "measures": [{"column": "donem", "aggregation": "count", "label": "Katılımcı"}],
     "filters": [], "kpi_ids": ["program_completion", "program_hire_rate", "program_retention"], "category": "Yetenek"},
    {"name": "Üniversite Bazlı Katılım", "data_source": "talent_programs", "chart_type": "bar",
     "dimensions": ["universite"], "measures": [{"column": "donem", "aggregation": "count", "label": "Katılımcı"}],
     "filters": [], "kpi_ids": ["program_completion"], "category": "Yetenek"},
    # KPI Dashboard'ları
    {"name": "İK Temel KPI'lar", "data_source": "employees", "chart_type": "kpi_card",
     "dimensions": [], "measures": [],
     "filters": [], "kpi_ids": ["headcount", "turnover_rate", "voluntary_turnover", "avg_salary", "female_ratio", "avg_performance", "avg_seniority", "critical_role_ratio"], "category": "KPI Dashboard"},
    {"name": "İşe Alım KPI'lar", "data_source": "recruitment", "chart_type": "kpi_card",
     "dimensions": [], "measures": [],
     "filters": [], "kpi_ids": ["funnel_conversion", "time_to_hire", "offer_acceptance"], "category": "KPI Dashboard"},
    {"name": "Eğitim KPI'lar", "data_source": "training", "chart_type": "kpi_card",
     "dimensions": [], "measures": [],
     "filters": [], "kpi_ids": ["training_hours", "training_completion", "training_avg_score", "training_cost", "hours_per_emp"], "category": "KPI Dashboard"},
]

@router.get("/report-templates")
async def get_report_templates():
    """Return predefined report templates for quick creation."""
    return {"templates": REPORT_TEMPLATES}

@router.post("/report-templates/{template_index}/create")
async def create_from_template(template_index: int, tenant: str = None):
    """Create a report from a template."""
    if template_index < 0 or template_index >= len(REPORT_TEMPLATES):
        raise HTTPException(400, "Geçersiz şablon")
    tmpl = REPORT_TEMPLATES[template_index]
    report = {
        "id": str(uuid.uuid4()),
        "name": tmpl["name"],
        "data_source": tmpl["data_source"],
        "chart_type": tmpl["chart_type"],
        "dimensions": tmpl["dimensions"],
        "measures": tmpl["measures"],
        "filters": tmpl["filters"],
        "kpi_ids": tmpl["kpi_ids"],
        "conditional_formatting": [],
        "description": f"Hazır şablon: {tmpl['category']}",
        "tenant_id": tenant or "default",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.report_definitions.insert_one(report)
    report.pop("_id", None)
    return report


@router.get("/kpi-templates")
async def get_kpi_templates():
    """Return predefined KPI templates."""
    return {"templates": KPI_TEMPLATES}


@router.post("/reports")
async def create_report(body: ReportCreate, tenant: str = None):
    """Create a new report definition."""
    report = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "data_source": body.data_source,
        "chart_type": body.chart_type,
        "dimensions": body.dimensions,
        "measures": body.measures,
        "filters": body.filters,
        "kpi_ids": body.kpi_ids,
        "conditional_formatting": body.conditional_formatting,
        "description": body.description,
        "tenant_id": tenant or "default",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.report_definitions.insert_one(report)
    report.pop("_id", None)
    return report


@router.get("/reports")
async def list_reports(tenant: str = None):
    """List all saved reports for a tenant."""
    query = {"tenant_id": tenant} if tenant else {}
    reports = await db.report_definitions.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"reports": reports}


@router.get("/reports/{report_id}")
async def get_report(report_id: str):
    """Get a single report definition."""
    report = await db.report_definitions.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(404, "Rapor bulunamadı")
    return report


@router.put("/reports/{report_id}")
async def update_report(report_id: str, body: ReportUpdate):
    """Update a report definition."""
    update = {k: v for k, v in body.dict().items() if v is not None}
    if not update:
        raise HTTPException(400, "Güncelleme verisi boş")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.report_definitions.update_one({"id": report_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Rapor bulunamadı")
    return await db.report_definitions.find_one({"id": report_id}, {"_id": 0})


@router.delete("/reports/{report_id}")
async def delete_report(report_id: str):
    """Delete a report definition."""
    result = await db.report_definitions.delete_one({"id": report_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Rapor bulunamadı")
    return {"message": "Rapor silindi"}


@router.post("/reports/{report_id}/duplicate")
async def duplicate_report(report_id: str):
    """Duplicate a report."""
    original = await db.report_definitions.find_one({"id": report_id}, {"_id": 0})
    if not original:
        raise HTTPException(404, "Rapor bulunamadı")
    new_report = {**original, "id": str(uuid.uuid4()), "name": f"{original['name']} (Kopya)",
                  "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.report_definitions.insert_one(new_report)
    new_report.pop("_id", None)
    return new_report


@router.post("/reports/{report_id}/execute")
async def execute_report(report_id: str, tenant: str = None):
    """Execute a report definition and return computed results."""
    report = await db.report_definitions.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(404, "Rapor bulunamadı")
    return await _execute_report_config(report, tenant or report.get("tenant_id"))


@router.post("/execute-preview")
async def execute_preview(body: ReportCreate, tenant: str = None):
    """Execute a report config without saving (live preview)."""
    config = body.dict()
    config["tenant_id"] = tenant or "default"
    return await _execute_report_config(config, tenant)


# ─── Report Execution Engine ───

async def _execute_report_config(config, tenant):
    """Core engine: runs a report config against MongoDB and returns chart-ready data."""
    source_id = config.get("data_source", "employees")
    if source_id not in DATA_SOURCES:
        raise HTTPException(400, f"Bilinmeyen veri kaynağı: {source_id}")

    ds = DATA_SOURCES[source_id]
    collection = ds["collection"]
    columns = ds["columns"]

    # Build MongoDB query from filters
    query = {"tenant_id": tenant} if tenant else {}
    for f in config.get("filters", []):
        col = f.get("column")
        op = f.get("operator", "eq")
        val = f.get("value")
        if not col or val is None:
            continue
        if op == "eq":
            query[col] = val
        elif op == "ne":
            query[col] = {"$ne": val}
        elif op == "in":
            query[col] = {"$in": val if isinstance(val, list) else [val]}
        elif op == "gt":
            query[col] = {"$gt": val}
        elif op == "lt":
            query[col] = {"$lt": val}
        elif op == "gte":
            query[col] = {"$gte": val}
        elif op == "lte":
            query[col] = {"$lte": val}
        elif op == "contains":
            query[col] = {"$regex": str(val), "$options": "i"}

    rows = await db[collection].find(query, {"_id": 0, "skills": 0, "created_at": 0, "data_source": 0}).to_list(50000)

    dimensions = config.get("dimensions", [])
    measures = config.get("measures", [])
    chart_type = config.get("chart_type", "table")
    kpi_ids = config.get("kpi_ids", [])
    cond_fmt = config.get("conditional_formatting", [])

    # ─── KPI Calculations ───
    kpi_results = []
    if kpi_ids:
        kpi_map = {k["id"]: k for k in KPI_TEMPLATES}
        for kid in kpi_ids:
            tmpl = kpi_map.get(kid)
            if not tmpl:
                continue
            val = _compute_kpi(tmpl, rows)
            kpi_results.append({
                "id": kid, "name": tmpl["name"], "value": val,
                "format": tmpl["format"], "category": tmpl["category"],
                "description": tmpl["description"],
            })

    # ─── Aggregation ───
    if chart_type == "kpi_card":
        return {"chart_type": "kpi_card", "kpis": kpi_results, "total_rows": len(rows)}

    if not dimensions and not measures:
        # Return raw table data
        return {"chart_type": chart_type, "data": rows[:500], "total_rows": len(rows), "kpis": kpi_results}

    # Group by dimensions
    grouped = {}
    for row in rows:
        key_parts = []
        for dim in dimensions:
            v = row.get(dim, "")
            if v is None:
                v = "(Boş)"
            key_parts.append(str(v))
        key = tuple(key_parts) if key_parts else ("Toplam",)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(row)

    # Compute measures for each group
    result_data = []
    for key, group_rows in grouped.items():
        entry = {}
        for i, dim in enumerate(dimensions):
            col_meta = columns.get(dim, {})
            entry[col_meta.get("label", dim)] = key[i] if i < len(key) else ""

        for m in measures:
            col_name = m.get("column", "")
            agg = m.get("aggregation", "count")
            label = m.get("label", col_name)
            col_meta = columns.get(col_name, {})
            display_label = label or col_meta.get("label", col_name)

            if agg == "count":
                entry[display_label] = len(group_rows)
            elif agg == "distinct_count":
                entry[display_label] = len(set(r.get(col_name) for r in group_rows if r.get(col_name)))
            elif agg == "sum":
                entry[display_label] = round(sum(r.get(col_name, 0) or 0 for r in group_rows), 2)
            elif agg == "avg":
                vals = [r.get(col_name, 0) for r in group_rows if r.get(col_name) is not None]
                entry[display_label] = round(sum(vals) / len(vals), 2) if vals else 0
            elif agg == "min":
                vals = [r.get(col_name, 0) for r in group_rows if r.get(col_name) is not None]
                entry[display_label] = min(vals) if vals else 0
            elif agg == "max":
                vals = [r.get(col_name, 0) for r in group_rows if r.get(col_name) is not None]
                entry[display_label] = max(vals) if vals else 0
            elif agg == "ratio_percent":
                # Custom: count of true / total * 100 (for boolean fields)
                total = len(group_rows)
                true_count = len([r for r in group_rows if r.get(col_name)])
                entry[display_label] = round(true_count / total * 100, 1) if total else 0

        # If no measures defined, just count
        if not measures:
            entry["Kayıt Sayısı"] = len(group_rows)

        result_data.append(entry)

    # Sort by first measure descending or by first dimension
    if measures:
        first_label = measures[0].get("label", "") or columns.get(measures[0].get("column", ""), {}).get("label", "")
        result_data.sort(key=lambda x: x.get(first_label, 0), reverse=True)

    # Apply conditional formatting
    formatted = []
    for row in result_data:
        fmt_row = {**row, "_formatting": {}}
        for cf in cond_fmt:
            col_label = cf.get("column_label", "")
            threshold = cf.get("threshold")
            color_above = cf.get("color_above", "#DC2626")
            color_below = cf.get("color_below", "#059669")
            val = row.get(col_label)
            if val is not None and threshold is not None:
                try:
                    fmt_row["_formatting"][col_label] = color_above if float(val) >= float(threshold) else color_below
                except (ValueError, TypeError):
                    pass
        formatted.append(fmt_row)

    return {
        "chart_type": chart_type,
        "data": formatted[:1000],
        "total_rows": len(rows),
        "dimensions": dimensions,
        "measures": measures,
        "kpis": kpi_results,
    }


def _compute_kpi(template, rows):
    """Compute a KPI value from template formula against data rows."""
    kid = template["id"]
    fmt = template["format"]

    if kid == "headcount":
        val = len([r for r in rows if r.get("status") == "active"])
    elif kid == "turnover_rate":
        active = len([r for r in rows if r.get("status") == "active"])
        left = len([r for r in rows if r.get("status") == "terminated"])
        val = round(left / max(active, 1) * 100, 1)
    elif kid == "voluntary_turnover":
        active = len([r for r in rows if r.get("status") == "active"])
        vol = len([r for r in rows if r.get("termination_type") == "voluntary"])
        val = round(vol / max(active, 1) * 100, 1)
    elif kid == "avg_salary":
        actives = [r for r in rows if r.get("status") == "active"]
        sals = [r.get("salary", 0) for r in actives if r.get("salary")]
        val = round(sum(sals) / len(sals)) if sals else 0
    elif kid == "female_ratio":
        actives = [r for r in rows if r.get("status") == "active"]
        female = len([r for r in actives if r.get("gender") == "Female"])
        val = round(female / max(len(actives), 1) * 100, 1)
    elif kid == "avg_seniority":
        actives = [r for r in rows if r.get("status") == "active"]
        vals = [r.get("seniority_years", 0) for r in actives if r.get("seniority_years") is not None]
        val = round(sum(vals) / len(vals), 1) if vals else 0
    elif kid == "avg_performance":
        actives = [r for r in rows if r.get("status") == "active"]
        vals = [r.get("performance_score", 0) for r in actives if r.get("performance_score") is not None]
        val = round(sum(vals) / len(vals), 1) if vals else 0
    elif kid == "time_to_hire":
        hired = [r for r in rows if r.get("hired")]
        vals = [r.get("total_days", 0) for r in hired if r.get("total_days")]
        val = round(sum(vals) / len(vals), 1) if vals else 0
    elif kid == "offer_acceptance":
        hired = len([r for r in rows if r.get("hired")])
        offered = len([r for r in rows if r.get("stage") in ("Teklif", "İşe Başlama") or r.get("hired")])
        val = round(hired / max(offered, 1) * 100, 1)
    elif kid == "funnel_conversion":
        hired = len([r for r in rows if r.get("hired")])
        total = len(rows)
        val = round(hired / max(total, 1) * 100, 1)
    elif kid == "program_completion":
        completed = len([r for r in rows if r.get("tamamladi")])
        total = len(rows)
        val = round(completed / max(total, 1) * 100, 1)
    elif kid == "program_hire_rate":
        hired = len([r for r in rows if r.get("ise_alindi")])
        total = len(rows)
        val = round(hired / max(total, 1) * 100, 1)
    elif kid == "program_retention":
        hired = len([r for r in rows if r.get("ise_alindi")])
        retained = len([r for r in rows if r.get("ilk_yil_kaldi")])
        val = round(retained / max(hired, 1) * 100, 1)
    elif kid == "critical_role_ratio":
        actives = [r for r in rows if r.get("status") == "active"]
        critical = len([r for r in actives if r.get("is_talent")])
        val = round(critical / max(len(actives), 1) * 100, 1)
    elif kid == "avg_engagement":
        actives = [r for r in rows if r.get("status") == "active"]
        vals = [r.get("engagement_score", 0) for r in actives if r.get("engagement_score") is not None]
        val = round(sum(vals) / len(vals), 1) if vals else 0
    elif kid == "enps":
        total = len(rows)
        promoters = len([r for r in rows if r.get("enps_score", 0) >= 50])
        detractors = len([r for r in rows if r.get("enps_score", 0) <= 0])
        val = round((promoters - detractors) / max(total, 1) * 100, 1)
    elif kid == "avg_satisfaction":
        vals = [r.get("satisfaction", 0) for r in rows if r.get("satisfaction") is not None]
        val = round(sum(vals) / len(vals), 1) if vals else 0
    elif kid == "avg_wlb":
        vals = [r.get("work_life_balance", 0) for r in rows if r.get("work_life_balance") is not None]
        val = round(sum(vals) / len(vals), 1) if vals else 0
    elif kid == "avg_absenteeism":
        vals = [r.get("absenteeism_days", 0) for r in rows if r.get("absenteeism_days") is not None]
        val = round(sum(vals) / len(vals), 1) if vals else 0
    elif kid == "training_hours":
        val = round(sum(r.get("hours", 0) or 0 for r in rows))
    elif kid == "training_completion":
        total = len(rows)
        completed = len([r for r in rows if r.get("status") == "Completed"])
        val = round(completed / max(total, 1) * 100, 1)
    elif kid == "training_avg_score":
        completed = [r for r in rows if r.get("status") == "Completed" and r.get("score")]
        vals = [r["score"] for r in completed]
        val = round(sum(vals) / len(vals), 1) if vals else 0
    elif kid == "training_cost":
        val = round(sum(r.get("cost", 0) or 0 for r in rows))
    elif kid == "hours_per_emp":
        total_hours = sum(r.get("hours", 0) or 0 for r in rows)
        unique_emps = len(set(r.get("employee_id") for r in rows if r.get("employee_id")))
        val = round(total_hours / max(unique_emps, 1), 1)
    else:
        val = 0

    return val
