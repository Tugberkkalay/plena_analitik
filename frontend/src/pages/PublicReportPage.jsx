import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Lock, FileText } from "@phosphor-icons/react";

const API = process.env.REACT_APP_BACKEND_URL;

function PasswordGate({ slug, tenantInfo, onAccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/api/tenants/public/${slug}/verify`, { password });
      onAccess(res.data.token, res.data.tenant);
    } catch (err) {
      setError(err.response?.data?.detail || "Şifre hatalı");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="report-password-gate">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mb-3">
              <FileText size={24} weight="bold" className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {tenantInfo?.name || "Rapor"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Erişim şifresi gerekli</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Şifre</label>
              <input data-testid="report-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="••••••••" required autoFocus />
            </div>
            <button data-testid="report-access-btn" type="submit" disabled={loading}
              className="w-full py-2.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? "Doğrulanıyor..." : "Raporlara Eriş"}
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-6">Powered by Plenalitik</p>
        </div>
      </div>
    </div>
  );
}

function ReportViewer({ slug, token, tenant }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Small delay to show loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Raporlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Embed the full dashboard in an iframe pointing to the tenant's report view
  const reportUrl = `${window.location.origin}/admin/rapor/${slug}?token=${token}&embed=true`;

  return (
    <div className="min-h-screen bg-white" data-testid="report-viewer">
      {/* Minimal header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <FileText size={14} weight="bold" className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">{tenant.name}</h1>
            <p className="text-[10px] text-slate-400">{tenant.sector} · Plenalitik Raporu</p>
          </div>
        </div>
        <button onClick={() => window.print()}
          className="px-3 py-1.5 rounded-md bg-teal-600 text-white text-xs font-medium hover:bg-teal-700">
          PDF Dışa Aktar
        </button>
      </div>
      <iframe src={reportUrl} className="w-full border-0" style={{ height: "calc(100vh - 52px)" }} title="Report" />
    </div>
  );
}

export default function PublicReportPage() {
  const { slug } = useParams();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/tenants/public/${slug}/check`)
      .then((r) => setTenantInfo(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setChecking(false));
  }, [slug]);

  if (checking) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;

  if (notFound) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Lock size={40} className="text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-700">Rapor Bulunamadı</h2>
        <p className="text-sm text-slate-500 mt-1">Bu adres için yayında bir rapor bulunmuyor.</p>
      </div>
    </div>
  );

  if (accessToken && tenant) {
    return <ReportViewer slug={slug} token={accessToken} tenant={tenant} />;
  }

  return (
    <PasswordGate slug={slug} tenantInfo={tenantInfo}
      onAccess={(token, t) => { setAccessToken(token); setTenant(t); }} />
  );
}
