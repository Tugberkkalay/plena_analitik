"""
Survey Analytics — Bağlılık, Çıkış Mülakatı, Onboarding, Pulse anket verileri ve analiz endpoint'leri.
"""
import uuid
import random
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from collections import Counter

router = APIRouter(prefix="/api/dashboard", tags=["surveys"])
db = None

def setup_surveys(database):
    global db
    db = database

# ─── Survey Question Definitions ───
ENGAGEMENT_QUESTIONS = [
    {"id": "satisfaction", "text": "Genel iş memnuniyetim yüksektir", "category": "Memnuniyet", "benchmark": 3.6},
    {"id": "work_life_balance", "text": "İş-yaşam dengemi koruyabiliyorum", "category": "İş-Yaşam Dengesi", "benchmark": 3.3},
    {"id": "career_growth", "text": "Kariyer gelişim fırsatlarım yeterlidir", "category": "Kariyer Gelişimi", "benchmark": 3.1},
    {"id": "manager_rating", "text": "Yöneticim beni destekler ve yönlendirir", "category": "Yönetici İlişkisi", "benchmark": 3.7},
    {"id": "recognition", "text": "Başarılarım tanınır ve ödüllendirilir", "category": "Tanınma", "benchmark": 3.2},
    {"id": "culture_alignment", "text": "Şirket kültürü değerlerimle uyumludur", "category": "Kültür Uyumu", "benchmark": 3.5},
]

EXIT_QUESTIONS = [
    {"id": "exit_reason", "text": "Ana ayrılma nedeniniz nedir?", "category": "Ayrılma Nedeni", "type": "category",
     "options": ["Maaş/Yan Haklar", "Kariyer Gelişimi", "Yönetici İlişkisi", "İş-Yaşam Dengesi", "Şirket Kültürü", "Yurt Dışı Fırsat", "Başka Sektör", "Kişisel Nedenler"]},
    {"id": "exit_recommend", "text": "Şirketi başkalarına tavsiye eder misiniz?", "category": "Tavsiye", "type": "scale", "benchmark": 3.2},
    {"id": "exit_manager", "text": "Yöneticinizle ilişkiniz nasıldı?", "category": "Yönetici", "type": "scale", "benchmark": 3.5},
    {"id": "exit_growth", "text": "Kariyer gelişim fırsatlarını yeterli buldunuz mu?", "category": "Gelişim", "type": "scale", "benchmark": 2.9},
    {"id": "exit_workload", "text": "İş yükünüz makul düzeyde miydi?", "category": "İş Yükü", "type": "scale", "benchmark": 3.1},
    {"id": "exit_culture", "text": "Şirket kültürüne ne kadar uyum sağladınız?", "category": "Kültür", "type": "scale", "benchmark": 3.4},
    {"id": "exit_return", "text": "Gelecekte geri dönmeyi düşünür müsünüz?", "category": "Geri Dönüş", "type": "scale", "benchmark": 2.8},
]

ONBOARDING_QUESTIONS = [
    {"id": "onb_orientation", "text": "Oryantasyon süreci yeterli ve bilgilendiriciydi", "category": "Oryantasyon", "benchmark": 3.8},
    {"id": "onb_buddy", "text": "Buddy/mentor desteği faydalı oldu", "category": "Mentor Desteği", "benchmark": 3.5},
    {"id": "onb_tools", "text": "İş araç ve sistemlere erişimim zamanında sağlandı", "category": "Araçlar", "benchmark": 3.4},
    {"id": "onb_team", "text": "Ekibime entegrasyon kolay oldu", "category": "Ekip Entegrasyonu", "benchmark": 3.6},
    {"id": "onb_expectations", "text": "İş tanımı ve beklentiler açıkça anlatıldı", "category": "Beklentiler", "benchmark": 3.3},
    {"id": "onb_overall", "text": "Genel onboarding deneyimim olumluydu", "category": "Genel Değerlendirme", "benchmark": 3.5},
]

PULSE_QUESTIONS = [
    {"id": "pulse_morale", "text": "Bu ay motivasyonum yüksek", "category": "Motivasyon", "benchmark": 3.4},
    {"id": "pulse_workload", "text": "İş yüküm yönetilebilir seviyede", "category": "İş Yükü", "benchmark": 3.2},
    {"id": "pulse_support", "text": "İhtiyacım olduğunda destek alabiliyorum", "category": "Destek", "benchmark": 3.6},
]


async def generate_survey_data(tenant_slug):
    """Generate exit, onboarding, and pulse survey data for a tenant."""
    employees = await db.employees.find({"tenant_id": tenant_slug}, {"_id": 0, "id": 1, "name": 1, "department": 1, "status": 1, "hire_date": 1, "termination_date": 1, "hrbp": 1, "project": 1, "segment": 1}).to_list(5000)

    terminated = [e for e in employees if e.get("status") == "terminated"]
    recent_hires = [e for e in employees if e.get("status") == "active" and (e.get("hire_date", "") >= "2024-01-01")]
    active = [e for e in employees if e.get("status") == "active"]

    # 1. Exit Surveys (for terminated employees)
    await db.exit_surveys.delete_many({"tenant_id": tenant_slug})
    exit_surveys = []
    for emp in terminated:
        reason = random.choice(EXIT_QUESTIONS[0]["options"])
        survey = {
            "id": str(uuid.uuid4()),
            "employee_id": emp["id"], "employee_name": emp.get("name", ""),
            "department": emp.get("department", ""), "hrbp": emp.get("hrbp", ""),
            "project": emp.get("project", ""), "segment": emp.get("segment", ""),
            "survey_date": emp.get("termination_date") or "2025-06-01",
            "exit_reason": reason,
            "exit_recommend": round(max(1, min(5, random.gauss(3.0, 1.0))), 1),
            "exit_manager": round(max(1, min(5, random.gauss(3.3, 0.9))), 1),
            "exit_growth": round(max(1, min(5, random.gauss(2.8, 1.1))), 1),
            "exit_workload": round(max(1, min(5, random.gauss(3.0, 0.9))), 1),
            "exit_culture": round(max(1, min(5, random.gauss(3.2, 0.8))), 1),
            "exit_return": round(max(1, min(5, random.gauss(2.6, 1.2))), 1),
            "voluntary": random.random() < 0.72,
            "tenure_months": random.randint(6, 84),
            "tenant_id": tenant_slug,
        }
        exit_surveys.append(survey)
    if exit_surveys:
        await db.exit_surveys.insert_many(exit_surveys)

    # 2. Onboarding Surveys (for recent hires, 30-90 days after start)
    await db.onboarding_surveys.delete_many({"tenant_id": tenant_slug})
    onb_surveys = []
    for emp in random.sample(recent_hires, min(len(recent_hires), int(len(recent_hires) * 0.85))):
        survey = {
            "id": str(uuid.uuid4()),
            "employee_id": emp["id"], "employee_name": emp.get("name", ""),
            "department": emp.get("department", ""), "hrbp": emp.get("hrbp", ""),
            "project": emp.get("project", ""), "segment": emp.get("segment", ""),
            "survey_date": f"2025-{random.randint(1,9):02d}-{random.randint(1,28):02d}",
            "onb_orientation": round(max(1, min(5, random.gauss(3.7, 0.7))), 1),
            "onb_buddy": round(max(1, min(5, random.gauss(3.4, 0.9))), 1),
            "onb_tools": round(max(1, min(5, random.gauss(3.3, 0.8))), 1),
            "onb_team": round(max(1, min(5, random.gauss(3.6, 0.7))), 1),
            "onb_expectations": round(max(1, min(5, random.gauss(3.2, 0.9))), 1),
            "onb_overall": round(max(1, min(5, random.gauss(3.5, 0.8))), 1),
            "tenant_id": tenant_slug,
        }
        onb_surveys.append(survey)
    if onb_surveys:
        await db.onboarding_surveys.insert_many(onb_surveys)

    # 3. Pulse Surveys (monthly, for random 40% of active employees)
    await db.pulse_surveys.delete_many({"tenant_id": tenant_slug})
    pulse_surveys = []
    for month in range(1, 10):
        sample_size = int(len(active) * 0.4)
        for emp in random.sample(active, min(sample_size, len(active))):
            survey = {
                "id": str(uuid.uuid4()),
                "employee_id": emp["id"], "employee_name": emp.get("name", ""),
                "department": emp.get("department", ""), "hrbp": emp.get("hrbp", ""),
                "project": emp.get("project", ""), "segment": emp.get("segment", ""),
                "month": f"2025-{month:02d}",
                "survey_date": f"2025-{month:02d}-15",
                "pulse_morale": round(max(1, min(5, random.gauss(3.4 + random.uniform(-0.3, 0.3), 0.8))), 1),
                "pulse_workload": round(max(1, min(5, random.gauss(3.2 + random.uniform(-0.2, 0.2), 0.9))), 1),
                "pulse_support": round(max(1, min(5, random.gauss(3.5 + random.uniform(-0.2, 0.2), 0.7))), 1),
                "tenant_id": tenant_slug,
            }
            pulse_surveys.append(survey)
    if pulse_surveys:
        await db.pulse_surveys.insert_many(pulse_surveys)

    return {"exit": len(exit_surveys), "onboarding": len(onb_surveys), "pulse": len(pulse_surveys)}


# ─── Analytics Endpoints ───

@router.get("/survey-analytics")
async def get_survey_analytics(survey_type: str = "engagement", tenant: str = None, department: str = None, hrbp: str = None, project: str = None):
    """Comprehensive survey analytics with question-level detail, trends, and benchmarks."""

    if survey_type == "engagement":
        return await _engagement_analytics(tenant, department, hrbp, project)
    elif survey_type == "exit":
        return await _exit_analytics(tenant, department, hrbp, project)
    elif survey_type == "onboarding":
        return await _onboarding_analytics(tenant, department, hrbp, project)
    elif survey_type == "pulse":
        return await _pulse_analytics(tenant, department, hrbp, project)
    else:
        raise HTTPException(400, f"Bilinmeyen anket türü: {survey_type}")


async def _build_query(tenant, department, hrbp, project):
    q = {}
    if tenant: q["tenant_id"] = tenant
    if department: q["department"] = department
    if hrbp: q["hrbp"] = hrbp
    if project: q["project"] = project
    return q


def _question_analysis(rows, questions, dept_field="department"):
    """Build question-level analysis with scores, benchmarks, department breakdown."""
    result = []
    for q in questions:
        qid = q["id"]
        if q.get("type") == "category":
            vals = [r.get(qid) for r in rows if r.get(qid)]
            dist = Counter(vals)
            result.append({"id": qid, "text": q["text"], "category": q["category"], "type": "category",
                           "distribution": [{"value": k, "count": v, "pct": round(v / max(len(vals), 1) * 100, 1)} for k, v in dist.most_common()]})
        else:
            vals = [r.get(qid) for r in rows if r.get(qid) is not None]
            avg = round(sum(vals) / len(vals), 2) if vals else 0
            benchmark = q.get("benchmark", 3.5)
            gap = round(avg - benchmark, 2)
            # Department breakdown
            dept_scores = {}
            for r in rows:
                d = r.get(dept_field, "")
                if d and r.get(qid) is not None:
                    if d not in dept_scores: dept_scores[d] = []
                    dept_scores[d].append(r[qid])
            by_dept = [{"department": d, "avg": round(sum(v) / len(v), 2), "count": len(v), "benchmark": benchmark, "gap": round(sum(v) / len(v) - benchmark, 2)} for d, v in sorted(dept_scores.items())]
            # Score distribution
            dist = [{"range": "1.0-2.0", "count": len([v for v in vals if v < 2.0])},
                    {"range": "2.0-3.0", "count": len([v for v in vals if 2.0 <= v < 3.0])},
                    {"range": "3.0-4.0", "count": len([v for v in vals if 3.0 <= v < 4.0])},
                    {"range": "4.0-5.0", "count": len([v for v in vals if v >= 4.0])}]
            result.append({"id": qid, "text": q["text"], "category": q["category"], "type": "scale",
                           "avg": avg, "benchmark": benchmark, "gap": gap,
                           "gap_color": "#059669" if gap >= 0 else "#DC2626",
                           "by_department": by_dept, "distribution": dist, "response_count": len(vals)})
    return result


async def _engagement_analytics(tenant, department, hrbp, project):
    q = await _build_query(tenant, department, hrbp, project)
    rows = await db.engagement.find(q, {"_id": 0}).to_list(10000)
    if not rows:
        return {"kpis": {}, "questions": [], "trends": [], "benchmarks": []}

    total = len(rows)
    avg_eng = round(sum(r["engagement_score"] for r in rows) / total, 1)
    enps_vals = [r.get("enps_score", 0) for r in rows]
    promoters = len([v for v in enps_vals if v >= 50])
    detractors = len([v for v in enps_vals if v <= 0])
    enps = round((promoters - detractors) / total * 100, 1)

    questions = _question_analysis(rows, ENGAGEMENT_QUESTIONS)

    # Monthly trend
    month_groups = {}
    for r in rows:
        m = r.get("survey_date", "")[:7]
        if m:
            if m not in month_groups: month_groups[m] = []
            month_groups[m].append(r)
    trends = [{"month": m, "avg_engagement": round(sum(r["engagement_score"] for r in rs) / len(rs), 1), "count": len(rs)} for m, rs in sorted(month_groups.items())]

    # Benchmark summary
    benchmarks = [{"question": q["text"], "score": next((x["avg"] for x in questions if x["id"] == q["id"]), 0), "benchmark": q["benchmark"]} for q in ENGAGEMENT_QUESTIONS]

    return {
        "survey_type": "engagement", "total_responses": total,
        "kpis": {"avg_engagement": avg_eng, "enps": enps, "promoters": promoters, "detractors": detractors, "participation": total},
        "questions": questions, "trends": trends, "benchmarks": benchmarks,
    }


async def _exit_analytics(tenant, department, hrbp, project):
    q = await _build_query(tenant, department, hrbp, project)
    rows = await db.exit_surveys.find(q, {"_id": 0}).to_list(5000)
    if not rows:
        return {"kpis": {}, "questions": [], "trends": [], "reasons": []}

    total = len(rows)
    voluntary = len([r for r in rows if r.get("voluntary")])
    avg_tenure = round(sum(r.get("tenure_months", 0) for r in rows) / total, 1)
    avg_recommend = round(sum(r.get("exit_recommend", 0) for r in rows) / total, 1)
    would_return = len([r for r in rows if r.get("exit_return", 0) >= 3.5])

    questions = _question_analysis(rows, EXIT_QUESTIONS)

    # Reason distribution
    reason_dist = Counter(r.get("exit_reason") for r in rows if r.get("exit_reason"))
    reasons = [{"reason": k, "count": v, "pct": round(v / total * 100, 1)} for k, v in reason_dist.most_common()]

    # Monthly trend
    month_groups = {}
    for r in rows:
        m = r.get("survey_date", "")[:7]
        if m:
            if m not in month_groups: month_groups[m] = []
            month_groups[m].append(r)
    trends = [{"month": m, "count": len(rs), "avg_recommend": round(sum(r.get("exit_recommend", 0) for r in rs) / len(rs), 1)} for m, rs in sorted(month_groups.items())]

    return {
        "survey_type": "exit", "total_responses": total,
        "kpis": {"total_exits": total, "voluntary": voluntary, "voluntary_pct": round(voluntary / max(total, 1) * 100, 1),
                 "avg_tenure_months": avg_tenure, "avg_recommend": avg_recommend, "would_return_pct": round(would_return / max(total, 1) * 100, 1)},
        "questions": questions, "trends": trends, "reasons": reasons,
    }


async def _onboarding_analytics(tenant, department, hrbp, project):
    q = await _build_query(tenant, department, hrbp, project)
    rows = await db.onboarding_surveys.find(q, {"_id": 0}).to_list(5000)
    if not rows:
        return {"kpis": {}, "questions": [], "trends": []}

    total = len(rows)
    q_ids = [q["id"] for q in ONBOARDING_QUESTIONS]
    overall_scores = []
    for r in rows:
        scores = [r.get(qid, 0) for qid in q_ids if r.get(qid) is not None]
        if scores:
            overall_scores.append(sum(scores) / len(scores))
    avg_overall = round(sum(overall_scores) / len(overall_scores), 1) if overall_scores else 0
    satisfied = len([s for s in overall_scores if s >= 3.5])

    questions = _question_analysis(rows, ONBOARDING_QUESTIONS)

    # Monthly trend
    month_groups = {}
    for r in rows:
        m = r.get("survey_date", "")[:7]
        if m:
            if m not in month_groups: month_groups[m] = []
            month_groups[m].append(r)
    trends = [{"month": m, "count": len(rs), "avg_overall": round(sum(r.get("onb_overall", 0) for r in rs) / len(rs), 1)} for m, rs in sorted(month_groups.items())]

    return {
        "survey_type": "onboarding", "total_responses": total,
        "kpis": {"total_responses": total, "avg_overall": avg_overall, "satisfaction_pct": round(satisfied / max(total, 1) * 100, 1),
                 "lowest_area": min(questions, key=lambda x: x.get("avg", 5))["category"] if questions else ""},
        "questions": questions, "trends": trends,
    }


async def _pulse_analytics(tenant, department, hrbp, project):
    q = await _build_query(tenant, department, hrbp, project)
    rows = await db.pulse_surveys.find(q, {"_id": 0}).to_list(50000)
    if not rows:
        return {"kpis": {}, "questions": [], "trends": []}

    total = len(rows)
    avg_morale = round(sum(r.get("pulse_morale", 0) for r in rows) / total, 1)
    avg_workload = round(sum(r.get("pulse_workload", 0) for r in rows) / total, 1)
    avg_support = round(sum(r.get("pulse_support", 0) for r in rows) / total, 1)

    questions = _question_analysis(rows, PULSE_QUESTIONS)

    # Monthly trend
    month_groups = {}
    for r in rows:
        m = r.get("month") or r.get("survey_date", "")[:7]
        if m:
            if m not in month_groups: month_groups[m] = []
            month_groups[m].append(r)
    trends = []
    for m, rs in sorted(month_groups.items()):
        trends.append({
            "month": m, "count": len(rs),
            "morale": round(sum(r.get("pulse_morale", 0) for r in rs) / len(rs), 1),
            "workload": round(sum(r.get("pulse_workload", 0) for r in rs) / len(rs), 1),
            "support": round(sum(r.get("pulse_support", 0) for r in rs) / len(rs), 1),
        })

    return {
        "survey_type": "pulse", "total_responses": total,
        "kpis": {"total_responses": total, "avg_morale": avg_morale, "avg_workload": avg_workload, "avg_support": avg_support,
                 "unique_months": len(month_groups)},
        "questions": questions, "trends": trends,
    }
