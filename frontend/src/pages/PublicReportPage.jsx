import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Lock, FileText } from "@phosphor-icons/react";
import { setActiveTenant, setActiveSegment, setActiveDepartment, setActiveHrbp } from "@/lib/tenantInterceptor";
import { NAV_SECTIONS } from "@/components/Sidebar";
import PdfExportButton from "@/components/PdfExportButton";

// Import all dashboard pages
import OverviewPage from "@/pages/OverviewPage";
import HeadcountPage from "@/pages/HeadcountPage";
import HiresLeavesPage from "@/pages/HiresLeavesPage";
import TurnoverPage from "@/pages/TurnoverPage";
import MovementPage from "@/pages/MovementPage";
import RecruitmentPage from "@/pages/RecruitmentPage";
import PerformancePage from "@/pages/PerformancePage";
import LearningPage from "@/pages/LearningPage";
import CompensationPage from "@/pages/CompensationPage";
import EngagementPage from "@/pages/EngagementPage";
import CareerTalentPage from "@/pages/CareerTalentPage";
import SkillsMapV2Page from "@/pages/SkillsMapV2Page";
import SkillsMapPage from "@/pages/SkillsMapPage";
import SuccessionPage from "@/pages/SuccessionPage";
import BurnoutPage from "@/pages/BurnoutPage";
import HeadcountPlanPage from "@/pages/HeadcountPlanPage";
import WorkforceAlignmentPage from "@/pages/WorkforceAlignmentPage";
import OrgHealthPage from "@/pages/OrgHealthPage";
import InternalMobilityPage from "@/pages/InternalMobilityPage";
import ActionCenterPage from "@/pages/ActionCenterPage";
import BranchPerformancePage from "@/pages/BranchPerformancePage";
import CommissionTargetsPage from "@/pages/CommissionTargetsPage";
import BranchStaffingPage from "@/pages/BranchStaffingPage";
import BranchMapPage from "@/pages/BranchMapPage";
import CareerDevPage from "@/pages/CareerDevPage";
import AIForecastPage from "@/pages/AIForecastPage";
import CapabilityForecastPage from "@/pages/CapabilityForecastPage";
import HROperationsPage from "@/pages/HROperationsPage";
import ScenarioSimulatorPage from "@/pages/ScenarioSimulatorPage";
import NormKadroPage from "@/pages/NormKadroPage";
import EkKadroPage from "@/pages/EkKadroPage";
import TeklifAnaliziPage from "@/pages/TeklifAnaliziPage";
import UcretBenchmarkPage from "@/pages/UcretBenchmarkPage";
import KaynakAnaliziPage from "@/pages/KaynakAnaliziPage";
import UniversiteAnaliziPage from "@/pages/UniversiteAnaliziPage";
import MaliyetAnaliziPage from "@/pages/MaliyetAnaliziPage";
import AdayHunisiPage from "@/pages/AdayHunisiPage";
import YetenekProgramlariPage from "@/pages/YetenekProgramlariPage";
import GuvenlikSoruPage from "@/pages/GuvenlikSoruPage";
import ReportDesignerPage from "@/pages/ReportDesignerPage";

const API = process.env.REACT_APP_BACKEND_URL;

// Map path to component
const PAGE_MAP = {
  "/": OverviewPage,
  "/headcount": HeadcountPage,
  "/hires-leaves": HiresLeavesPage,
  "/norm-kadro": NormKadroPage,
  "/ek-kadro": EkKadroPage,
  "/teklif-analizi": TeklifAnaliziPage,
  "/ucret-benchmark": UcretBenchmarkPage,
  "/kaynak-analizi": KaynakAnaliziPage,
  "/universite-analizi": UniversiteAnaliziPage,
  "/maliyet-analizi": MaliyetAnaliziPage,
  "/aday-hunisi": AdayHunisiPage,
  "/yetenek-programlari": YetenekProgramlariPage,
  "/guvenlik-sorusturmasi": GuvenlikSoruPage,
  "/rapor-tasarimcisi": ReportDesignerPage,
  "/turnover": TurnoverPage,
  "/movement": MovementPage,
  "/headcount-plan": HeadcountPlanPage,
  "/workforce-alignment": WorkforceAlignmentPage,
  "/org-health": OrgHealthPage,
  "/skills-map-v2": SkillsMapV2Page,
  "/skills-map": SkillsMapPage,
  "/scenario-sim": ScenarioSimulatorPage,
  "/succession": SuccessionPage,
  "/branch-performance": BranchPerformancePage,
  "/commission-targets": CommissionTargetsPage,
  "/branch-staffing": BranchStaffingPage,
  "/branch-map": BranchMapPage,
  "/internal-mobility": InternalMobilityPage,
  "/recruitment": RecruitmentPage,
  "/performance": PerformancePage,
  "/learning": LearningPage,
  "/compensation": CompensationPage,
  "/engagement": EngagementPage,
  "/career-talent": CareerTalentPage,
  "/career-dev": CareerDevPage,
  "/action-center": ActionCenterPage,
  "/ai-forecast": AIForecastPage,
  "/capability-forecast": CapabilityForecastPage,
  "/burnout": BurnoutPage,
  "/hr-operations": HROperationsPage,
};

const COUNTRY_PAGES = new Set(["/", "/headcount", "/hires-leaves", "/turnover", "/headcount-plan", "/org-health"]);

// Filter out "Veri Yönetimi" section from nav
const REPORT_NAV = NAV_SECTIONS.filter(s => s.label !== "Ayarlar");

function PasswordGate({ slug, tenantInfo, onAccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const color = tenantInfo?.primary_color || "#0D9488";
  const API_BASE = process.env.REACT_APP_BACKEND_URL;
  const logoSrc = tenantInfo?.logo_url ? (tenantInfo.logo_url.startsWith("http") ? tenantInfo.logo_url : `${API_BASE}${tenantInfo.logo_url}`) : null;

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
            {logoSrc ? (
              <img src={logoSrc} alt={tenantInfo?.name} className="w-16 h-16 rounded-xl object-contain mb-3 border border-slate-100 p-1" />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: color }}>
                <FileText size={24} weight="bold" className="text-white" />
              </div>
            )}
            <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {tenantInfo?.report_title || tenantInfo?.name || "Rapor"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Erişim şifresi gerekli</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Şifre</label>
              <input data-testid="report-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2"
                placeholder="••••••••" required autoFocus />
            </div>
            <button data-testid="report-access-btn" type="submit" disabled={loading}
              className="w-full py-2.5 rounded-md text-white text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: color }}>
              {loading ? "Doğrulanıyor..." : "Raporlara Eriş"}
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-6">Powered by Plenalitik</p>
        </div>
      </div>
    </div>
  );
}

function ReportDashboard({ slug, tenant }) {
  const [activePath, setActivePath] = useState("/");
  const [segment, setSegment] = useState(null);
  const [segments, setSegments] = useState([]);
  const [department, setDepartment] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [hrbp, setHrbp] = useState(null);
  const [hrbps, setHrbps] = useState([]);
  const year = 2025;
  const color = tenant.primary_color || "#0D9488";
  const API_BASE = process.env.REACT_APP_BACKEND_URL;
  const isRetail = tenant.sector === "Perakende";

  useEffect(() => {
    setActiveTenant(slug);
    // Fetch segments, departments, hrbps
    axios.get(`${API_BASE}/api/dashboard/segments?tenant=${slug}`)
      .then(r => {
        setSegments(r.data.segments || []);
        setDepartments(r.data.departments || []);
        setHrbps(r.data.hrbps || []);
      })
      .catch(() => {});
    return () => { setActiveTenant(null); setActiveSegment(null); setActiveDepartment(null); setActiveHrbp(null); };
  }, [slug, API_BASE]);

  useEffect(() => {
    setActiveSegment(segment);
  }, [segment]);

  useEffect(() => {
    setActiveDepartment(department);
  }, [department]);

  useEffect(() => {
    setActiveHrbp(hrbp);
  }, [hrbp]);

  const Component = PAGE_MAP[activePath] || OverviewPage;
  const props = { year };
  if (COUNTRY_PAGES.has(activePath)) props.country = null;

  const logoSrc = tenant.logo_url ? (tenant.logo_url.startsWith("http") ? tenant.logo_url : `${API_BASE}${tenant.logo_url}`) : null;

  // Find current label
  let currentLabel = "Genel Bakış";
  for (const section of REPORT_NAV) {
    const item = section.items.find(i => i.path === activePath);
    if (item) { currentLabel = item.label; break; }
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="report-dashboard">
      {/* Inject tenant brand colors */}
      <style>{`
        [data-testid="report-dashboard"] .bg-teal-600,
        [data-testid="report-dashboard"] .bg-teal-700 { background-color: ${color} !important; }
        [data-testid="report-dashboard"] .bg-teal-50 { background-color: ${color}12 !important; }
        [data-testid="report-dashboard"] .text-teal-600,
        [data-testid="report-dashboard"] .text-teal-700,
        [data-testid="report-dashboard"] .text-teal-800 { color: ${color} !important; }
        [data-testid="report-dashboard"] .border-teal-200,
        [data-testid="report-dashboard"] .border-teal-300 { border-color: ${color}40 !important; }
        [data-testid="report-dashboard"] .hover\\:bg-teal-700:hover { background-color: ${color} !important; filter: brightness(0.9); }
      `}</style>

      <div className="flex h-screen">
        {/* Sidebar - same structure as admin */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 print:hidden">
          {/* Logo/Brand */}
          <div className="px-5 py-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              {logoSrc ? (
                <img src={logoSrc} alt={tenant.name} className="w-9 h-9 rounded-lg object-contain border border-slate-100 p-0.5" />
              ) : (
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color }}>
                  <FileText size={18} weight="bold" className="text-white" />
                </div>
              )}
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {tenant.report_title || tenant.name}
                </h2>
                <p className="text-[9px] tracking-[0.15em] uppercase text-slate-400">Plenalitik Raporu</p>
              </div>
            </div>
          </div>

          {/* Nav sections */}
          <div className="flex-1 overflow-y-auto py-3 px-3">
            {REPORT_NAV.map((section) => (
              <div key={section.label} className="mb-3">
                <p className="px-3 mb-1.5 text-[9px] tracking-[0.15em] uppercase font-semibold text-slate-400">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePath === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => setActivePath(item.path)}
                      data-testid={`report-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all mb-0.5 ${
                        isActive ? "text-white" : "text-slate-600 hover:bg-slate-50"
                      }`}
                      style={isActive ? { backgroundColor: color } : {}}
                    >
                      <Icon size={16} weight={isActive ? "bold" : "regular"} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-[9px] text-slate-400 text-center">Powered by Plenalitik</p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md print:hidden">
            <h1 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {currentLabel}
            </h1>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {isRetail && segments.length > 0 && (
                <select
                  data-testid="report-segment-selector"
                  value={segment || ""}
                  onChange={(e) => setSegment(e.target.value || null)}
                  className="px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1"
                >
                  <option value="">Tüm Segmentler</option>
                  {segments.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              {departments.length > 0 && (
                <select
                  data-testid="report-department-selector"
                  value={department || ""}
                  onChange={(e) => setDepartment(e.target.value || null)}
                  className="px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1"
                >
                  <option value="">Tüm Departmanlar</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
              {hrbps.length > 0 && (
                <select
                  data-testid="report-hrbp-selector"
                  value={hrbp || ""}
                  onChange={(e) => setHrbp(e.target.value || null)}
                  className="px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1"
                >
                  <option value="">Tüm HRBP</option>
                  {hrbps.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              )}
              <PdfExportButton tenantName={tenant.name} sectionLabel={currentLabel} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6" data-testid="report-content" key={`seg-${segment || 'all'}-dept-${department || 'all'}-hrbp-${hrbp || 'all'}`}>
            <Component {...props} />
          </div>
        </div>
      </div>
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
    return <ReportDashboard slug={slug} tenant={tenant} />;
  }

  return (
    <PasswordGate slug={slug} tenantInfo={tenantInfo}
      onAccess={(token, t) => { setAccessToken(token); setTenant(t); }} />
  );
}
