"""Jolly Tur module backend API tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api/jolly"
TENANT = "jollytur"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ── Filters
def test_filters(s):
    r = s.get(f"{API}/filters", params={"tenant": TENANT}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    for k in ["bolgeler", "subeler", "roller"]:
        assert k in d and isinstance(d[k], list) and len(d[k]) > 0, f"{k} empty"
    print("Filters:", {k: len(v) for k, v in d.items()})


# ── Overview
def test_overview(s):
    r = s.get(f"{API}/overview", params={"tenant": TENANT}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    kpis = d.get("kpis", {})
    assert kpis.get("calisan_sayisi") == 55, f"Expected 55 got {kpis.get('calisan_sayisi')}"
    assert kpis.get("ort_toplam_skor") is not None
    assert kpis.get("yildiz_orani") is not None
    assert len(d["segment_dist"]) > 0
    assert len(d["skor_histogram"]) > 0
    assert len(d["bolge_skor"]) > 0


def test_overview_filter_bolge(s):
    r_all = s.get(f"{API}/overview", params={"tenant": TENANT}, timeout=30).json()
    r = s.get(f"{API}/overview", params={"tenant": TENANT, "bolge": "Ege"}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["kpis"]["calisan_sayisi"] < r_all["kpis"]["calisan_sayisi"]


# ── Hedef Analizi
def test_hedef_analizi(s):
    r = s.get(f"{API}/hedef-analizi", params={"tenant": TENANT}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert len(d["hedef_ort"]) == 18, f"Expected 18 targets got {len(d['hedef_ort'])}"
    assert len(d["sube_siralama"]) == 12, f"Expected 12 branches got {len(d['sube_siralama'])}"
    assert len(d["bolge_hedef_heatmap"]) > 0
    assert isinstance(d["scatter"], list)


# ── Yetkinlik Analizi
def test_yetkinlik_analizi(s):
    r = s.get(f"{API}/yetkinlik-analizi", params={"tenant": TENANT}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert len(d["kategori_radar"]) > 0
    assert len(d["en_guclu"]) == 3
    assert len(d["en_zayif"]) == 3
    assert len(d["rol_karsilastirma"]) > 0


# ── Kalibrasyon
def test_kalibrasyon(s):
    r = s.get(f"{API}/kalibrasyon", params={"tenant": TENANT}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert len(d["sube_karsilastirma"]) > 0
    assert len(d["degerlendirici_sapma"]) > 0
    for e in d["degerlendirici_sapma"]:
        assert e["tip"] in ("Sert", "Normal", "Cömert"), f"Unknown tip: {e['tip']}"
    assert len(d["fark_top10"]) <= 10


# ── Yetenek Matrisi
def test_yetenek_matrisi(s):
    r = s.get(f"{API}/yetenek-matrisi", params={"tenant": TENANT}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert len(d["matrix"]) == 9
    for m in d["matrix"]:
        assert "hedef_dilim" in m and "yetkinlik_dilim" in m
        assert "label" in m and "count" in m
    assert "thresholds" in d
    for k in ["hedef_low", "hedef_high", "yetkinlik_low", "yetkinlik_high"]:
        assert k in d["thresholds"]
    assert isinstance(d["high_potential"], list)
    assert isinstance(d["risk_list"], list)
    total = sum(m["count"] for m in d["matrix"])
    assert total == 55, f"Matrix total {total} != 55"


# ── Employee list
def test_calisan_listesi(s):
    r = s.get(f"{API}/calisan-listesi", params={"tenant": TENANT}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert len(d["calisanlar"]) == 55
    scores = [c["toplam_skor"] for c in d["calisanlar"]]
    assert scores == sorted(scores, reverse=True), "Not sorted by toplam_skor desc"


# ── Employee report card
def test_calisan_karnesi(s):
    r = s.get(f"{API}/calisan-karnesi/JT1001", params={"tenant": TENANT}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert "karne" in d and d["karne"].get("sicil_no") == "JT1001"
    assert "hedefler" in d and isinstance(d["hedefler"], list)
    assert "yetkinlik_radar" in d and isinstance(d["yetkinlik_radar"], list)
    assert "karsilastirma" in d
    for k in ["sirket", "sube", "bolge", "kisi"]:
        assert k in d["karsilastirma"]


def test_calisan_karnesi_404(s):
    r = s.get(f"{API}/calisan-karnesi/NOPE9999", params={"tenant": TENANT}, timeout=30)
    assert r.status_code == 404
