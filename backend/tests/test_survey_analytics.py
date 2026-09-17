"""Survey Analytics endpoint tests - iteration 18 (Anket Analizi feature)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://workforce-insights-15.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/dashboard/survey-analytics"
TENANT = "tusas"


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ── Engagement ──
class TestEngagement:
    def test_status_and_shape(self, sess):
        r = sess.get(f"{API}?survey_type=engagement&tenant={TENANT}", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["survey_type"] == "engagement"
        for k in ("kpis", "questions", "trends", "benchmarks"):
            assert k in d, f"missing key {k}"

    def test_kpi_values(self, sess):
        d = sess.get(f"{API}?survey_type=engagement&tenant={TENANT}", timeout=30).json()
        k = d["kpis"]
        assert d["total_responses"] == 2065, f"expected 2065 responses, got {d['total_responses']}"
        assert k["avg_engagement"] == 6.7
        assert abs(k["enps"] - 20.6) < 0.5
        assert k["promoters"] == 694
        assert k["detractors"] == 268

    def test_questions_have_scale_analysis(self, sess):
        d = sess.get(f"{API}?survey_type=engagement&tenant={TENANT}", timeout=30).json()
        scale_qs = [q for q in d["questions"] if q.get("type") == "scale"]
        assert len(scale_qs) == 6
        for q in scale_qs:
            assert "avg" in q and "benchmark" in q and "gap" in q
            assert "by_department" in q and len(q["by_department"]) > 0
            assert "distribution" in q and len(q["distribution"]) == 4


# ── Exit ──
class TestExit:
    def test_status_and_shape(self, sess):
        r = sess.get(f"{API}?survey_type=exit&tenant={TENANT}", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["survey_type"] == "exit"
        for k in ("kpis", "questions", "trends", "reasons"):
            assert k in d

    def test_kpi_values(self, sess):
        d = sess.get(f"{API}?survey_type=exit&tenant={TENANT}", timeout=30).json()
        k = d["kpis"]
        assert d["total_responses"] == 335, f"expected 335 exits, got {d['total_responses']}"
        # voluntary ~ 72% base rate → allow range
        assert 60 <= k["voluntary_pct"] <= 80
        assert 40 <= k["avg_tenure_months"] <= 55
        assert 2.5 <= k["avg_recommend"] <= 3.5

    def test_reasons_distribution(self, sess):
        d = sess.get(f"{API}?survey_type=exit&tenant={TENANT}", timeout=30).json()
        assert len(d["reasons"]) >= 5
        total_pct = sum(r["pct"] for r in d["reasons"])
        assert 99 <= total_pct <= 101, f"reason pcts should sum to ~100, got {total_pct}"

    def test_has_category_and_scale_questions(self, sess):
        d = sess.get(f"{API}?survey_type=exit&tenant={TENANT}", timeout=30).json()
        cat_qs = [q for q in d["questions"] if q.get("type") == "category"]
        scale_qs = [q for q in d["questions"] if q.get("type") == "scale"]
        assert len(cat_qs) == 1
        assert len(scale_qs) == 6


# ── Onboarding ──
class TestOnboarding:
    def test_status_and_shape(self, sess):
        r = sess.get(f"{API}?survey_type=onboarding&tenant={TENANT}", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["survey_type"] == "onboarding"
        for k in ("kpis", "questions", "trends"):
            assert k in d

    def test_kpi_values(self, sess):
        d = sess.get(f"{API}?survey_type=onboarding&tenant={TENANT}", timeout=30).json()
        assert d["total_responses"] == 305, f"expected 305 onboarding, got {d['total_responses']}"
        k = d["kpis"]
        assert 1 <= k["avg_overall"] <= 5
        assert 0 <= k["satisfaction_pct"] <= 100
        assert k["lowest_area"]


# ── Pulse ──
class TestPulse:
    def test_status_and_shape(self, sess):
        r = sess.get(f"{API}?survey_type=pulse&tenant={TENANT}", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["survey_type"] == "pulse"

    def test_kpi_values(self, sess):
        d = sess.get(f"{API}?survey_type=pulse&tenant={TENANT}", timeout=30).json()
        assert d["total_responses"] == 7434, f"expected 7434 pulse, got {d['total_responses']}"
        k = d["kpis"]
        assert 3.0 <= k["avg_morale"] <= 3.8
        assert 2.8 <= k["avg_workload"] <= 3.6
        assert 3.2 <= k["avg_support"] <= 3.8
        assert k["unique_months"] == 9

    def test_monthly_trends(self, sess):
        d = sess.get(f"{API}?survey_type=pulse&tenant={TENANT}", timeout=30).json()
        assert len(d["trends"]) == 9
        for t in d["trends"]:
            assert "morale" in t and "workload" in t and "support" in t


# ── Invalid ──
def test_invalid_survey_type(sess):
    r = sess.get(f"{API}?survey_type=invalid&tenant={TENANT}", timeout=30)
    assert r.status_code == 400
