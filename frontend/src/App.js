import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from "react-router-dom";
import axios from "axios";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { setActiveTenant, setActiveSegment } from "@/lib/tenantInterceptor";
import Sidebar from "@/components/Sidebar";
import PdfExportButton from "@/components/PdfExportButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarBlank, GlobeHemisphereWest, Funnel } from "@phosphor-icons/react";
import OverviewPage from "@/pages/OverviewPage";
import HeadcountPage from "@/pages/HeadcountPage";
import HiresLeavesPage from "@/pages/HiresLeavesPage";
import TurnoverPage from "@/pages/TurnoverPage";
import MovementPage from "@/pages/MovementPage";
import AIForecastPage from "@/pages/AIForecastPage";
import DataUploadPage from "@/pages/DataUploadPage";

import RecruitmentPage from "@/pages/RecruitmentPage";
import PerformancePage from "@/pages/PerformancePage";
import LearningPage from "@/pages/LearningPage";
import CompensationPage from "@/pages/CompensationPage";
import EngagementPage from "@/pages/EngagementPage";
import CareerTalentPage from "@/pages/CareerTalentPage";
import HROperationsPage from "@/pages/HROperationsPage";
import SkillsMapPage from "@/pages/SkillsMapPage";
import CareerDevPage from "@/pages/CareerDevPage";
import ScenarioSimulatorPage from "@/pages/ScenarioSimulatorPage";
import CapabilityForecastPage from "@/pages/CapabilityForecastPage";
import SuccessionPage from "@/pages/SuccessionPage";
import BurnoutPage from "@/pages/BurnoutPage";
import HeadcountPlanPage from "@/pages/HeadcountPlanPage";
import WorkforceAlignmentPage from "@/pages/WorkforceAlignmentPage";
import OrgHealthPage from "@/pages/OrgHealthPage";
import SkillsMapV2Page from "@/pages/SkillsMapV2Page";
import InternalMobilityPage from "@/pages/InternalMobilityPage";
import ActionCenterPage from "@/pages/ActionCenterPage";
import BranchPerformancePage from "@/pages/BranchPerformancePage";
import CommissionTargetsPage from "@/pages/CommissionTargetsPage";
import BranchStaffingPage from "@/pages/BranchStaffingPage";
import BranchMapPage from "@/pages/BranchMapPage";
import NormKadroPage from "@/pages/NormKadroPage";
import EkKadroPage from "@/pages/EkKadroPage";
import TeklifAnaliziPage from "@/pages/TeklifAnaliziPage";
import UcretBenchmarkPage from "@/pages/UcretBenchmarkPage";
import KaynakAnaliziPage from "@/pages/KaynakAnaliziPage";
import UniversiteAnaliziPage from "@/pages/UniversiteAnaliziPage";
import MaliyetAnaliziPage from "@/pages/MaliyetAnaliziPage";
import AdayHunisiPage from "@/pages/AdayHunisiPage";

import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import PublicReportPage from "@/pages/PublicReportPage";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PAGE_TITLES = {
  "/": "Yönetim Özeti",
  "/headcount": "Kadro Analizi",
  "/hires-leaves": "İşe Alım & Ayrılma",
  "/norm-kadro": "Norm Kadro Takip",
  "/ek-kadro": "Ek Kadro Talepleri",
  "/teklif-analizi": "Teklif Analizi",
  "/ucret-benchmark": "Ücret Benchmark",
  "/kaynak-analizi": "Kaynak Analizi",
  "/universite-analizi": "Üniversite Analizi",
  "/maliyet-analizi": "İşe Alım Maliyeti",
  "/aday-hunisi": "Aday Hunisi",
  "/turnover": "Personel Devir Analizi",
  "/movement": "İşgücü Hareketi",
  "/ai-forecast": "Plena AI Tahminleme",
  "/data-upload": "Veri Yönetimi",
  "/recruitment": "İşe Alım Süreci",
  "/performance": "Performans Yönetimi",
  "/learning": "Eğitim & Gelişim",
  "/compensation": "Ücret & Yan Haklar",
  "/engagement": "Çalışan Bağlılığı",
  "/career-talent": "Kariyer & Yetenek",
  "/skills-map": "Yetkinlik Haritası",
  "/career-dev": "Plena AI Kariyer Gelişimi",
  "/scenario-sim": "Senaryo Simülatörü",
  "/capability-forecast": "Yetkinlik Tahmini",
  "/succession": "Yedekleme Planlaması",
  "/burnout": "Tükenmişlik Uyarısı",
  "/hr-operations": "İK Operasyonları",
  "/headcount-plan": "Kadro Planlama",
  "/workforce-alignment": "Strateji-Kadro Hizalaması",
  "/org-health": "Organizasyon Sağlığı",
  "/skills-map-v2": "Yetkinlik & Açık Analizi",
  "/internal-mobility": "İç Mobilite",
  "/action-center": "Aksiyon Merkezi",
  "/branch-performance": "Şube Performansı",
  "/commission-targets": "Prim & Hedef",
  "/branch-staffing": "Şube Kadro Planlama",
  "/branch-map": "Şube Haritası",
};

function TopBar({ year, setYear, years, country, setCountry, segment, setSegment, segments, sector }) {
  const location = useLocation();
  const cleanPath = location.pathname.replace(/^\/admin\/rapor\/[^/]+/, "");
  const title = PAGE_TITLES[cleanPath || "/"] || PAGE_TITLES[location.pathname] || "Dashboard";
  const isRetail = sector === "Perakende";

  return (
    <div data-testid="top-bar" className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div>
        <h1 data-testid="page-title" className="text-2xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <PdfExportButton tenantName="Plenalitik" sectionLabel={title} />
        {isRetail && segments.length > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200">
            <Funnel size={16} className="text-slate-500" />
            <Select value={segment || "all"} onValueChange={(v) => setSegment(v === "all" ? null : v)}>
              <SelectTrigger data-testid="segment-selector" className="w-[150px] border-0 bg-transparent h-7 text-sm text-slate-700 p-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-700 focus:bg-slate-100">Tüm Segmentler</SelectItem>
                {segments.map((s) => (
                  <SelectItem key={s} value={s} className="text-slate-700 focus:bg-slate-100">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200">
            <GlobeHemisphereWest size={16} className="text-slate-500" />
            <Select value={country || "all"} onValueChange={(v) => setCountry(v === "all" ? null : v)}>
              <SelectTrigger data-testid="country-selector" className="w-[90px] border-0 bg-transparent h-7 text-sm text-slate-700 p-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-700 focus:bg-slate-100">Tümü</SelectItem>
                <SelectItem value="Turkey" className="text-slate-700 focus:bg-slate-100">Türkiye</SelectItem>
                <SelectItem value="Italy" className="text-slate-700 focus:bg-slate-100">İtalya</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200">
          <CalendarBlank size={16} className="text-slate-500" />
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger data-testid="year-selector" className="w-[90px] border-0 bg-transparent h-7 text-sm text-slate-700 p-0 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function DashboardRoutes({ year, country, segment }) {
  return (
    <div key={`seg-${segment || 'all'}`}>
    <Routes>
      <Route path="/" element={<OverviewPage year={year} country={country} />} />
      <Route path="/headcount" element={<HeadcountPage year={year} country={country} />} />
      <Route path="/hires-leaves" element={<HiresLeavesPage year={year} country={country} />} />
      <Route path="/norm-kadro" element={<NormKadroPage year={year} />} />
      <Route path="/ek-kadro" element={<EkKadroPage year={year} />} />
      <Route path="/teklif-analizi" element={<TeklifAnaliziPage year={year} />} />
      <Route path="/ucret-benchmark" element={<UcretBenchmarkPage year={year} />} />
      <Route path="/kaynak-analizi" element={<KaynakAnaliziPage year={year} />} />
      <Route path="/universite-analizi" element={<UniversiteAnaliziPage year={year} />} />
      <Route path="/maliyet-analizi" element={<MaliyetAnaliziPage year={year} />} />
      <Route path="/aday-hunisi" element={<AdayHunisiPage year={year} />} />
      <Route path="/turnover" element={<TurnoverPage year={year} country={country} />} />
      <Route path="/movement" element={<MovementPage year={year} country={country} />} />
      <Route path="/recruitment" element={<RecruitmentPage year={year} />} />
      <Route path="/performance" element={<PerformancePage year={year} />} />
      <Route path="/learning" element={<LearningPage year={year} />} />
      <Route path="/compensation" element={<CompensationPage year={year} />} />
      <Route path="/engagement" element={<EngagementPage year={year} />} />
      <Route path="/career-talent" element={<CareerTalentPage year={year} />} />
      <Route path="/skills-map" element={<SkillsMapPage year={year} />} />
      <Route path="/career-dev" element={<CareerDevPage year={year} />} />
      <Route path="/scenario-sim" element={<ScenarioSimulatorPage year={year} />} />
      <Route path="/capability-forecast" element={<CapabilityForecastPage year={year} />} />
      <Route path="/succession" element={<SuccessionPage year={year} />} />
      <Route path="/burnout" element={<BurnoutPage year={year} />} />
      <Route path="/hr-operations" element={<HROperationsPage year={year} />} />
      <Route path="/headcount-plan" element={<HeadcountPlanPage year={year} country={country} />} />
      <Route path="/workforce-alignment" element={<WorkforceAlignmentPage year={year} />} />
      <Route path="/org-health" element={<OrgHealthPage year={year} country={country} />} />
      <Route path="/skills-map-v2" element={<SkillsMapV2Page year={year} />} />
      <Route path="/internal-mobility" element={<InternalMobilityPage year={year} />} />
      <Route path="/action-center" element={<ActionCenterPage year={year} />} />
      <Route path="/branch-performance" element={<BranchPerformancePage year={year} />} />
      <Route path="/commission-targets" element={<CommissionTargetsPage year={year} />} />
      <Route path="/branch-staffing" element={<BranchStaffingPage year={year} />} />
      <Route path="/branch-map" element={<BranchMapPage year={year} />} />
      <Route path="/ai-forecast" element={<AIForecastPage year={year} />} />
      <Route path="/data-upload" element={<DataUploadPage />} />
    </Routes>
    </div>
  );
}

function ProtectedDashboard() {
  const { user, checking } = useAuth();
  const { slug } = useParams();
  const [year, setYear] = useState(2025);
  const [years, setYears] = useState([2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [country, setCountry] = useState(null);
  const [segment, setSegment] = useState(null);
  const [segments, setSegments] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);

  // Set tenant context for all API calls
  useEffect(() => {
    if (slug && slug !== "default") {
      setActiveTenant(slug);
      // Fetch tenant branding info
      axios.get(`${API}/tenants/public/${slug}/check`).then(r => {
        setTenantInfo(r.data);
      }).catch(() => {
        // For draft tenants not yet published, try getting info from admin endpoint
        axios.get(`${API}/tenants`, { withCredentials: true }).then(r2 => {
          const t = (r2.data.tenants || []).find(t => t.slug === slug);
          if (t) setTenantInfo({ name: t.name, slug: t.slug, logo_url: t.logo_url, primary_color: t.primary_color, report_title: t.report_title, sector: t.sector });
        }).catch(() => {});
      });
      // Fetch segments for this tenant
      axios.get(`${API}/dashboard/segments`).then(r => {
        const segs = r.data.segments || [];
        const sec = r.data.sector || "Bankacılık";
        setSegments(segs);
        // Also set sector on tenantInfo if not set
        setTenantInfo(prev => prev ? { ...prev, sector: prev.sector || sec } : { sector: sec });
      }).catch(() => {});
    } else {
      setActiveTenant(null);
      setTenantInfo(null);
      setSegments([]);
    }
    return () => { setActiveTenant(null); setActiveSegment(null); };
  }, [slug]);

  // Sync segment to interceptor
  useEffect(() => {
    setActiveSegment(segment);
  }, [segment]);

  useEffect(() => {
    axios.get(`${API}/dashboard/years`).then((res) => {
      if (res.data.years && res.data.years.length > 0) setYears(res.data.years);
    }).catch(() => {});
  }, []);

  if (checking) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const basePath = `/admin/rapor/${slug || "default"}`;
  const brandColor = tenantInfo?.primary_color || null;
  const brandLogo = tenantInfo?.logo_url || null;

  return (
    <div className="hrlytic-layout">
      {brandColor && (
        <style>{`
          .hrlytic-layout .bg-teal-600, .hrlytic-layout .bg-teal-700 { background-color: ${brandColor} !important; }
          .hrlytic-layout .bg-teal-50 { background-color: ${brandColor}12 !important; }
          .hrlytic-layout .text-teal-600, .hrlytic-layout .text-teal-700, .hrlytic-layout .text-teal-800 { color: ${brandColor} !important; }
          .hrlytic-layout .border-teal-200, .hrlytic-layout .border-teal-300 { border-color: ${brandColor}40 !important; }
          .hrlytic-layout .hover\\:bg-teal-700:hover { background-color: ${brandColor} !important; filter: brightness(0.9); }
        `}</style>
      )}
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} basePath={basePath} brandColor={brandColor} brandLogo={brandLogo} brandName={tenantInfo?.report_title || tenantInfo?.name} />
      <div className="hrlytic-main">
        <TopBar year={year} setYear={setYear} years={years} country={country} setCountry={setCountry}
          segment={segment} setSegment={setSegment} segments={segments} sector={tenantInfo?.sector} />
        <div className="hrlytic-content">
          <DashboardRoutes year={year} country={country} segment={segment} />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/rapor/:slug/*" element={<ProtectedDashboard />} />
          <Route path="/raporlar/:slug" element={<PublicReportPage />} />
          {/* Default: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
