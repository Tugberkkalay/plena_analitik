import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Buildings, Plus, SignOut, Eye, Trash, Database, Globe, PencilSimple, Check, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = process.env.REACT_APP_BACKEND_URL;

function CreateTenantModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sector, setSector] = useState("Bankacılık");
  const [password, setPassword] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0D9488");
  const [reportTitle, setReportTitle] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoData, setLogoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      setLogoData(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/api/tenants`, {
        name, slug, sector, access_password: password,
        primary_color: primaryColor, report_title: reportTitle || `${name} İK Analitik Raporu`,
      }, { withCredentials: true });
      // Upload logo if selected
      if (logoData && res.data.id) {
        await axios.post(`${API}/api/tenants/${res.data.id}/upload-logo`, { logo_url: logoData }, { withCredentials: true });
      }
      onCreated(res.data);
      setName(""); setSlug(""); setPassword(""); setPrimaryColor("#0D9488"); setReportTitle(""); setLogoPreview(null); setLogoData(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Hata oluştu");
    }
    setLoading(false);
  };

  const COLOR_PRESETS = [
    { label: "Teal", value: "#0D9488" },
    { label: "Mavi", value: "#2563EB" },
    { label: "Lacivert", value: "#1E3A5F" },
    { label: "Kırmızı", value: "#DC2626" },
    { label: "Turuncu", value: "#EA580C" },
    { label: "Mor", value: "#7C3AED" },
    { label: "Yeşil", value: "#059669" },
    { label: "Siyah", value: "#18181B" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" data-testid="create-tenant-modal">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Yeni Müşteri Oluştur</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="p-2 rounded bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

          {/* Logo Upload */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Müşteri Logosu</label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">Logo</span>
                )}
              </div>
              <div>
                <label className="cursor-pointer px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors inline-block">
                  Dosya Seç
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" data-testid="logo-upload" />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG · Max 2MB</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Müşteri Adı</label>
            <Input data-testid="tenant-name" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }}
              placeholder="Yapı Kredi" required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">URL Slug</label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">plenalitik.com/raporlar/</span>
              <Input data-testid="tenant-slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
                placeholder="yapikredi" className="flex-1" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Sektör</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
                <option>Bankacılık</option>
                <option>Sigorta</option>
                <option>Perakende</option>
                <option>Teknoloji</option>
                <option>Üretim</option>
                <option>Diğer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Erişim Şifresi</label>
              <Input data-testid="tenant-password" type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="ör: yk2025" required />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Kurumsal Renk</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c.value} type="button" onClick={() => setPrimaryColor(c.value)} title={c.label}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${primaryColor === c.value ? "border-slate-900 scale-110" : "border-transparent hover:border-slate-300"}`}
                  style={{ backgroundColor: c.value }} />
              ))}
              <div className="flex items-center gap-1.5 ml-1">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0" data-testid="color-picker" />
                <span className="text-[10px] text-slate-400 font-mono">{primaryColor}</span>
              </div>
            </div>
          </div>

          {/* Report Title */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Rapor Başlığı</label>
            <Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)}
              placeholder={`${name || "Müşteri"} İK Analitik Raporu`} data-testid="report-title" />
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-2">Önizleme</p>
            <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: primaryColor + "15", borderLeft: `3px solid ${primaryColor}` }}>
              {logoPreview && <img src={logoPreview} alt="" className="w-6 h-6 rounded object-contain" />}
              <span className="text-sm font-semibold" style={{ color: primaryColor }}>{reportTitle || `${name || "Müşteri"} İK Analitik Raporu`}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">İptal</Button>
            <Button type="submit" disabled={loading} className="flex-1 text-white" style={{ backgroundColor: primaryColor }} data-testid="create-tenant-submit">
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLOR_PRESETS = [
  { label: "Teal", value: "#0D9488" },
  { label: "Mavi", value: "#2563EB" },
  { label: "Lacivert", value: "#1E3A5F" },
  { label: "Kırmızı", value: "#DC2626" },
  { label: "Turuncu", value: "#EA580C" },
  { label: "Mor", value: "#7C3AED" },
  { label: "Yeşil", value: "#059669" },
  { label: "Siyah", value: "#18181B" },
];

function EditTenantModal({ tenant, onClose, onSaved }) {
  const [primaryColor, setPrimaryColor] = useState(tenant.primary_color || "#0D9488");
  const [reportTitle, setReportTitle] = useState(tenant.report_title || "");
  const [logoPreview, setLogoPreview] = useState(tenant.logo_url ? (tenant.logo_url.startsWith("http") ? tenant.logo_url : `${API}${tenant.logo_url}`) : null);
  const [logoData, setLogoData] = useState(null);
  const [name, setName] = useState(tenant.name || "");
  const [sector, setSector] = useState(tenant.sector || "Bankacılık");
  const [saving, setSaving] = useState(false);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setLogoPreview(ev.target.result); setLogoData(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/tenants/${tenant.id}`, {
        name, sector, primary_color: primaryColor, report_title: reportTitle || `${name} İK Analitik Raporu`,
      }, { withCredentials: true });
      if (logoData) {
        await axios.post(`${API}/api/tenants/${tenant.id}/upload-logo`, { logo_url: logoData }, { withCredentials: true });
      }
      onSaved();
    } catch (err) {
      alert(err.response?.data?.detail || "Hata");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" data-testid="edit-tenant-modal">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{tenant.name} — Düzenle</h2>

        <div className="space-y-3">
          {/* Logo */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-xs text-slate-400">Logo</span>}
              </div>
              <label className="cursor-pointer px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors inline-block">
                Dosya Seç
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Müşteri Adı</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Sektör</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
                <option>Bankacılık</option><option>Sigorta</option><option>Perakende</option><option>Teknoloji</option><option>Üretim</option><option>Diğer</option>
              </select>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Kurumsal Renk</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c.value} type="button" onClick={() => setPrimaryColor(c.value)} title={c.label}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${primaryColor === c.value ? "border-slate-900 scale-110" : "border-transparent hover:border-slate-300"}`}
                  style={{ backgroundColor: c.value }} />
              ))}
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" />
              <span className="text-[10px] text-slate-400 font-mono">{primaryColor}</span>
            </div>
          </div>

          {/* Report Title */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Rapor Başlığı</label>
            <Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder={`${name} İK Analitik Raporu`} />
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-2">Önizleme</p>
            <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: primaryColor, color: "white" }}>
              {logoPreview && <img src={logoPreview} alt="" className="w-6 h-6 rounded object-contain bg-white p-0.5" />}
              <span className="text-sm font-semibold">{reportTitle || `${name} İK Analitik Raporu`}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">İptal</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 text-white" style={{ backgroundColor: primaryColor }} data-testid="save-tenant-btn">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, checking, logout } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [seedingId, setSeedingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/tenants`, { withCredentials: true });
      setTenants(res.data.tenants || []);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  if (checking) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const handleSeed = async (tenantId) => {
    setSeedingId(tenantId);
    try {
      await axios.post(`${API}/api/tenants/${tenantId}/seed`, {}, { withCredentials: true, timeout: 120000 });
      fetchTenants();
    } catch (err) {
      alert("Seed hatası: " + (err.response?.data?.detail || err.message));
    }
    setSeedingId(null);
  };

  const handlePublish = async (tenantId) => {
    setPublishingId(tenantId);
    try {
      await axios.post(`${API}/api/tenants/${tenantId}/publish`, {}, { withCredentials: true });
      fetchTenants();
    } catch { }
    setPublishingId(null);
  };

  const handleDelete = async (tenantId, name) => {
    if (!window.confirm(`"${name}" müşterisini ve tüm verilerini silmek istediğinize emin misiniz?`)) return;
    try {
      await axios.delete(`${API}/api/tenants/${tenantId}`, { withCredentials: true });
      fetchTenants();
    } catch { }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
            <Buildings size={20} weight="bold" className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Plenalitik Admin</h1>
            <p className="text-[10px] text-slate-500">Müşteri Rapor Yönetimi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{user.email}</span>
          <button onClick={() => { logout(); navigate("/login"); }} data-testid="logout-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            <SignOut size={14} /> Çıkış
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Toplam Müşteri</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{tenants.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Yayında</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{tenants.filter(t => t.status === "published").length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Taslak</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{tenants.filter(t => t.status === "draft").length}</p>
          </div>
        </div>

        {/* Tenant List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Müşteriler</h2>
          <Button onClick={() => setShowCreate(true)} data-testid="new-tenant-btn"
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm flex items-center gap-1.5">
            <Plus size={14} weight="bold" /> Yeni Müşteri
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" /></div>
        ) : tenants.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
            <Buildings size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Henüz müşteri yok</p>
            <p className="text-xs text-slate-400 mt-1">Yukarıdaki "Yeni Müşteri" butonuyla başlayın</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tenants.map((t) => {
              const logoSrc = t.logo_url ? (t.logo_url.startsWith("http") ? t.logo_url : `${API}${t.logo_url}`) : null;
              const tColor = t.primary_color || "#0D9488";
              return (
              <div key={t.id} data-testid={`tenant-${t.slug}`}
                className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {logoSrc ? (
                      <img src={logoSrc} alt={t.name} className="w-10 h-10 rounded-lg object-contain border border-slate-100 p-0.5" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: tColor }}>
                        {t.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{t.name}</h3>
                        <span className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: tColor }} title={tColor} />
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${t.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {t.status === "published" ? "Yayında" : "Taslak"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        /raporlar/{t.slug} · {t.sector} · {t.employee_count || 0} çalışan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Edit */}
                    <button onClick={() => setEditTenant(t)} data-testid={`edit-${t.slug}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                      <PencilSimple size={12} /> Düzenle
                    </button>
                    {/* Seed Data */}
                    <button onClick={() => handleSeed(t.id)} disabled={seedingId === t.id} data-testid={`seed-${t.slug}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50">
                      {seedingId === t.id ? (
                        <><div className="animate-spin rounded-full h-3 w-3 border-b border-slate-600" /> Oluşturuluyor...</>
                      ) : (
                        <><Database size={12} /> Veri Oluştur</>
                      )}
                    </button>
                    {/* View Report */}
                    <button onClick={() => navigate(`/admin/rapor/${t.slug}`)} data-testid={`view-${t.slug}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
                      <Eye size={12} /> Raporları Gör
                    </button>
                    {/* Publish */}
                    {t.status !== "published" && t.employee_count > 0 && (
                      <button onClick={() => handlePublish(t.id)} disabled={publishingId === t.id} data-testid={`publish-${t.slug}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                        <Globe size={12} /> Yayınla
                      </button>
                    )}
                    {/* Public link */}
                    {t.status === "published" && (
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/raporlar/${t.slug}`); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                        <Globe size={12} /> Link Kopyala
                      </button>
                    )}
                    {/* Delete */}
                    <button onClick={() => handleDelete(t.id, t.name)} data-testid={`delete-${t.slug}`}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-red-500 hover:bg-red-50 transition-colors">
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateTenantModal open={showCreate} onClose={() => setShowCreate(false)}
        onCreated={(t) => { setTenants([...tenants, t]); setShowCreate(false); }} />

      {/* Edit Tenant Modal */}
      {editTenant && (
        <EditTenantModal tenant={editTenant} onClose={() => setEditTenant(null)} onSaved={() => { setEditTenant(null); fetchTenants(); }} />
      )}
    </div>
  );
}
