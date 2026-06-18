import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Lock, FileText } from "@phosphor-icons/react";
import { setActiveTenant } from "@/lib/tenantInterceptor";
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

const API = process.env.REACT_APP_BACKEND_URL;

const REPORT_SECTIONS = [
  { id: "overview", label: "Genel Bakış", Component: OverviewPage, passCountry: true },
  { id: "headcount", label: "Kadro Analizi", Component: HeadcountPage, passCountry: true },
  { id: "hires-leaves", label: "İşe Alım & Ayrılma", Component: HiresLeavesPage, passCountry: true },
  { id: "turnover", label: "Personel Devir", Component: TurnoverPage, passCountry: true },
  { id: "movement", label: "İşgücü Hareketi", Component: MovementPage },
  { id: "performance", label: "Performans", Component: PerformancePage },
  { id: "recruitment", label: "İşe Alım Süreci", Component: RecruitmentPage },
  { id: "learning", label: "Eğitim & Gelişim", Component: LearningPage },
  { id: "compensation", label: "Ücret & Yan Haklar", Component: CompensationPage },
  { id: "engagement", label: "Çalışan Bağlılığı", Component: EngagementPage },
  { id: "skills-map", label: "Yetkinlik Haritası", Component: SkillsMapV2Page },
  { id: "succession", label: "Yedekleme Planı", Component: SuccessionPage },
  { id: "headcount-plan", label: "Kadro Planlama", Component: HeadcountPlanPage, passCountry: true },
  { id: "workforce-alignment", label: "Strateji Hizalama", Component: WorkforceAlignmentPage },
  { id: "org-health", label: "Org. Sağlığı", Component: OrgHealthPage, passCountry: true },
  { id: "internal-mobility", label: "İç Mobilite", Component: InternalMobilityPage },
  { id: "action-center", label: "Aksiyon Merkezi", Component: ActionCenterPage },
  { id: "burnout", label: "Tükenmişlik", Component: BurnoutPage },
  { id: "branch-performance", label: "Şube Performansı", Component: BranchPerformancePage },
  { id: "commission-targets", label: "Prim & Hedef", Component: CommissionTargetsPage },
  { id: "branch-staffing", label: "Şube Kadro", Component: BranchStaffingPage },
  { id: "branch-map", label: "Şube Haritası", Component: BranchMapPage },
];

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

function ReportDashboard({ slug, tenant }) {
  const [activeSection, setActiveSection] = useState("overview");
  const year = 2025;

  // Set tenant context for API calls
  useEffect(() => {
    setActiveTenant(slug);
    return () => setActiveTenant(null);
  }, [slug]);

  const currentSection = REPORT_SECTIONS.find((s) => s.id === activeSection);
  const Component = currentSection?.Component || OverviewPage;
  const props = { year };
  if (currentSection?.passCountry) props.country = null;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="report-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between print:hidden sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <FileText size={14} weight="bold" className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">{tenant.name}</h1>
            <p className="text-[10px] text-slate-400">{tenant.sector} · Plenalitik Raporu</p>
          </div>
        </div>
        <PdfExportButton tenantName={tenant.name} sectionLabel={currentSection?.label || "rapor"} />
      </div>

      <div className="flex">
        {/* Section Nav */}
        <div className="w-56 bg-white border-r border-slate-200 min-h-[calc(100vh-52px)] sticky top-[52px] overflow-y-auto print:hidden flex-shrink-0">
          <div className="p-3 space-y-0.5">
            {REPORT_SECTIONS.map((s) => (
              <button
                key={s.id}
                data-testid={`report-nav-${s.id}`}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeSection === s.id
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 max-w-[1400px]">
          <h2 className="text-xl font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {currentSection?.label}
          </h2>
          <Component {...props} />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-slate-200 text-[10px] text-slate-400 print:hidden">
        Powered by Plenalitik · {new Date().getFullYear()}
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
