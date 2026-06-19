"""
Dynamic sector taxonomy regression test (iteration 12).
Verifies that a tenant with sector='Perakende' returns retail-specific data
across all dashboard endpoints, while the existing banking tenant 'yapikredi'
remains unaffected.
"""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback for local pytest exec
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "admin@plenalitik.com"
ADMIN_PASSWORD = "Plena2025!"
BANKING_SLUG = "yapikredi"

RETAIL_DEPARTMENTS = {
    "Mağaza Satış", "Görsel Düzenleme", "Perakende Operasyon",
    "Üretim", "Kalite Kontrol", "Bakım ve Teknik",
    "Tasarım ve Ar-Ge", "Kategori Yönetimi", "İK ve Destek",
    "Dijital ve E-ticaret",
}
BANKING_DEPARTMENTS = {
    "Kredi ve Risk", "Hazine", "Bireysel Bankacılık", "Kurumsal Bankacılık",
    "Şube Operasyonları", "Dijital Bankacılık", "Uyum ve Mevzuat",
    "Veri ve Analitik", "İnsan Kaynakları", "Operasyon ve Süreç",
}
RETAIL_CLUSTER_IDS = {"core", "retail", "prod", "hq"}
RETAIL_STRATEGIC_IDS = {
    "perakende_deneyim", "uretim_verimlilik", "dijital_ticaret",
    "tasarim_inovasyon", "tedarik_zinciri", "liderlik_yetenek",
}


# ───────────────────────── Fixtures ─────────────────────────
@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
               timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    assert "access_token" in s.cookies, "access_token cookie not set"
    return s


@pytest.fixture(scope="session")
def perakende_tenant(admin_session):
    """Create a Perakende tenant, seed it, yield slug+id, then delete."""
    slug = f"test-perakende-{uuid.uuid4().hex[:6]}"
    payload = {
        "name": "TEST Perakende Co",
        "slug": slug,
        "sector": "Perakende",
        "access_password": "test123",
        "report_title": "TEST Retail Report",
        "primary_color": "#E11D48",
    }
    r = admin_session.post(f"{BASE_URL}/api/tenants", json=payload, timeout=20)
    assert r.status_code == 200, f"Tenant create failed: {r.status_code} {r.text}"
    tenant = r.json()
    assert tenant["sector"] == "Perakende"
    assert tenant["slug"] == slug

    # Seed
    seed = admin_session.post(f"{BASE_URL}/api/tenants/{tenant['id']}/seed", timeout=120)
    assert seed.status_code == 200, f"Seed failed: {seed.status_code} {seed.text}"

    # Give DB a moment
    time.sleep(1)

    yield {"id": tenant["id"], "slug": slug}

    # Cleanup
    admin_session.delete(f"{BASE_URL}/api/tenants/{tenant['id']}", timeout=20)


# ───────────────────── Auth ─────────────────────
class TestAuth:
    def test_login_sets_httponly_cookies(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert "access_token" in s.cookies
        assert "refresh_token" in s.cookies

    def test_me_returns_admin(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ───────────────────── Tenant Create/Persist ─────────────────────
class TestTenantCreateAndSeed:
    def test_tenant_created_with_perakende_sector(self, admin_session, perakende_tenant):
        # GET to verify persistence
        r = admin_session.get(f"{BASE_URL}/api/tenants/{perakende_tenant['id']}", timeout=15)
        assert r.status_code == 200
        t = r.json()
        assert t["sector"] == "Perakende"
        assert t["slug"] == perakende_tenant["slug"]
        # employee_count should reflect seeded data
        assert t.get("employee_count", 0) > 0, "employee_count should be > 0 after seeding"

    def test_seeded_employees_use_retail_departments(self, admin_session, perakende_tenant):
        slug = perakende_tenant["slug"]
        r = admin_session.get(f"{BASE_URL}/api/dashboard/overview?tenant={slug}",
                              timeout=30)
        assert r.status_code == 200
        data = r.json()
        depts = {d["name"] for d in data.get("department_distribution", [])}
        assert depts, "No department_distribution returned"
        # Every department in distribution must be a retail department
        unknown = depts - RETAIL_DEPARTMENTS
        assert not unknown, f"Non-retail departments leaked into Perakende tenant: {unknown}"
        # Must NOT contain banking departments
        leaked_banking = depts & BANKING_DEPARTMENTS
        assert not leaked_banking, f"Banking depts leaked: {leaked_banking}"
        # Headcount sanity
        assert data["kpis"]["headcount"] > 0


# ───────────────────── Retail-specific endpoint contracts ─────────────────────
class TestRetailEndpoints:
    def test_skills_map_v2_retail_clusters(self, admin_session, perakende_tenant):
        slug = perakende_tenant["slug"]
        r = admin_session.get(f"{BASE_URL}/api/dashboard/skills-map-v2?tenant={slug}",
                              timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        # Discover cluster structure (key likely 'clusters' or similar)
        clusters = data.get("clusters") or data.get("cluster_summary") or data.get("kumeler") or []
        # Try to extract IDs/names from any shape
        cluster_blob = str(clusters) + str(data)
        # Retail cluster names
        retail_keywords = ["Çekirdek", "Perakende", "Üretim", "Merkez Ofis", "core", "retail", "prod", "hq"]
        hits = sum(1 for kw in retail_keywords if kw in cluster_blob)
        assert hits >= 3, f"Expected retail clusters in skills-map-v2, found ~{hits} keywords. Keys: {list(data.keys())}"
        # Should NOT contain banking-only clusters
        assert "kredi-risk-yonetimi" not in cluster_blob, "Banking cluster leaked into Perakende skills-map-v2"
        assert "hazine-sermaye-piyasalari" not in cluster_blob

    def test_career_paths_returns_10_retail_paths(self, admin_session, perakende_tenant):
        slug = perakende_tenant["slug"]
        r = admin_session.get(f"{BASE_URL}/api/career-paths?tenant={slug}", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        paths = data.get("paths") or data.get("career_paths") or data.get("kariyer_yollari") or data
        if isinstance(paths, dict):
            paths = paths.get("paths", [])
        assert isinstance(paths, list), f"Expected list of paths, got {type(paths)}"
        # Retail taxonomy defines 10 ladders (RL1-3, PL1-3, HL1-4)
        assert len(paths) == 10, f"Expected 10 retail career paths, got {len(paths)}"
        # Verify path IDs are retail (RL/PL/HL prefix)
        ids = [p.get("id", "") for p in paths]
        retail_prefixed = [i for i in ids if i.startswith(("RL", "PL", "HL"))]
        assert len(retail_prefixed) == 10, f"Expected RL/PL/HL prefixed ids, got {ids}"

    def test_internal_mobility_uses_retail_depts(self, admin_session, perakende_tenant):
        slug = perakende_tenant["slug"]
        r = admin_session.get(f"{BASE_URL}/api/dashboard/internal-mobility?tenant={slug}",
                              timeout=30)
        assert r.status_code == 200, r.text
        blob = str(r.json())
        # Must contain at least one retail dept and zero banking depts
        retail_hits = sum(1 for d in RETAIL_DEPARTMENTS if d in blob)
        banking_hits = sum(1 for d in BANKING_DEPARTMENTS if d in blob)
        assert retail_hits >= 1, f"No retail departments in internal-mobility response"
        assert banking_hits == 0, f"Banking departments leaked: {banking_hits}"

    def test_workforce_alignment_retail_strategic_objectives(self, admin_session, perakende_tenant):
        slug = perakende_tenant["slug"]
        r = admin_session.get(f"{BASE_URL}/api/dashboard/workforce-alignment?tenant={slug}",
                              timeout=30)
        assert r.status_code == 200, r.text
        blob = str(r.json())
        retail_hits = sum(1 for sid in RETAIL_STRATEGIC_IDS if sid in blob)
        assert retail_hits >= 3, f"Expected retail strategic objective IDs, got {retail_hits} hits"
        # Banking objective IDs should not appear
        assert "dijital_donusum" not in blob
        assert "risk_yonetimi" not in blob

    def test_headcount_plan_retail_targets(self, admin_session, perakende_tenant):
        slug = perakende_tenant["slug"]
        r = admin_session.get(f"{BASE_URL}/api/dashboard/headcount-plan?tenant={slug}",
                              timeout=30)
        assert r.status_code == 200, r.text
        blob = str(r.json())
        retail_hits = sum(1 for d in RETAIL_DEPARTMENTS if d in blob)
        banking_hits = sum(1 for d in BANKING_DEPARTMENTS if d in blob)
        assert retail_hits >= 5, f"Few retail depts in headcount-plan: {retail_hits}"
        assert banking_hits == 0, f"Banking depts in headcount-plan: {banking_hits}"

    def test_positions_uses_retail_band_titles(self, admin_session, perakende_tenant):
        slug = perakende_tenant["slug"]
        r = admin_session.get(f"{BASE_URL}/api/dashboard/positions?tenant={slug}",
                              timeout=30)
        assert r.status_code == 200, r.text
        blob = str(r.json())
        # Retail-specific position titles
        retail_titles = [
            "Mağaza Müdürü", "Satış Danışmanı", "Üretim Operatörü", "Vardiya Amiri",
            "Kalite Müdürü", "Bölge Müdürü", "Üretim Müdürü",
        ]
        hits = sum(1 for t in retail_titles if t in blob)
        assert hits >= 2, f"Expected retail position titles, hits={hits}"

    def test_alerts_endpoint_no_error(self, admin_session, perakende_tenant):
        slug = perakende_tenant["slug"]
        r = admin_session.get(f"{BASE_URL}/api/dashboard/alerts?tenant={slug}",
                              timeout=30)
        assert r.status_code == 200, f"Alerts failed: {r.status_code} {r.text[:300]}"


# ───────────────────── Banking tenant regression ─────────────────────
class TestBankingRegression:
    def test_banking_overview_still_banking_depts(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/dashboard/overview?tenant={BANKING_SLUG}",
                              timeout=30)
        assert r.status_code == 200
        depts = {d["name"] for d in r.json().get("department_distribution", [])}
        # Most depts must be banking
        banking_overlap = depts & BANKING_DEPARTMENTS
        retail_overlap = depts & RETAIL_DEPARTMENTS
        assert len(banking_overlap) >= 5, f"Banking tenant lost banking depts: {depts}"
        assert not retail_overlap, f"Retail depts leaked into banking: {retail_overlap}"

    def test_banking_career_paths_not_retail(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/career-paths?tenant={BANKING_SLUG}",
                              timeout=30)
        assert r.status_code == 200
        data = r.json()
        paths = data.get("paths") or data.get("career_paths") or data.get("kariyer_yollari") or data
        if isinstance(paths, dict):
            paths = paths.get("paths", [])
        assert isinstance(paths, list) and len(paths) > 0
        ids = [p.get("id", "") for p in paths]
        # No retail prefixes (RL/PL/HL) -- those are retail-specific
        retail_prefixed = [i for i in ids if i.startswith(("RL", "PL", "HL"))]
        assert not retail_prefixed, f"Retail paths leaked into banking: {retail_prefixed}"


# ───────────────────── Cleanup verification ─────────────────────
class TestCleanup:
    def test_delete_tenant_removes_data(self, admin_session):
        # Create + delete a throwaway tenant explicitly to verify cleanup
        slug = f"test-cleanup-{uuid.uuid4().hex[:6]}"
        r = admin_session.post(f"{BASE_URL}/api/tenants", json={
            "name": "TEST Cleanup", "slug": slug, "sector": "Perakende",
            "access_password": "x",
        }, timeout=15)
        assert r.status_code == 200
        tid = r.json()["id"]
        # Delete
        d = admin_session.delete(f"{BASE_URL}/api/tenants/{tid}", timeout=15)
        assert d.status_code == 200
        # Verify gone
        g = admin_session.get(f"{BASE_URL}/api/tenants/{tid}", timeout=15)
        assert g.status_code == 404
