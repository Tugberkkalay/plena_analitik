import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from "react-router-dom";
import axios from "axios";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { setActiveTenant } from "@/lib/tenantInterceptor";
import Sidebar from "@/components/Sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarBlank, Printer, GlobeHemisphereWest } from "@phosphor-icons/react";
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

import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import PublicReportPage from "@/pages/PublicReportPage";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PAGE_TITLES = {
  "/": "Yönetim Özeti",
  "/headcount": "Kadro Analizi",
  "/hires-leaves": "İşe Alım & Ayrılma",
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

function TopBar({ year, setYear, years, country, setCountry }) {
  const location = useLocation();
  const cleanPath = location.pathname.replace(/^\/admin\/rapor\/[^/]+/, "");
  const title = PAGE_TITLES[cleanPath || "/"] || PAGE_TITLES[location.pathname] || "Dashboard";

  const handlePrint = () => { window.print(); };

  return (
    <div data-testid="top-bar" className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div>
        <h1 data-testid="page-title" className="text-2xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button data-testid="pdf-export-btn" onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors">
          <Printer size={16} weight="bold" />
          <span>PDF Dışa Aktar</span>
        </button>
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

function DashboardRoutes({ year, country }) {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage year={year} country={country} />} />
      <Route path="/headcount" element={<HeadcountPage year={year} country={country} />} />
      <Route path="/hires-leaves" element={<HiresLeavesPage year={year} country={country} />} />
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
  );
}

function ProtectedDashboard() {
  const { user, checking } = useAuth();
  const { slug } = useParams();
  const [year, setYear] = useState(2025);
  const [years, setYears] = useState([2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [country, setCountry] = useState(null);

  // Set tenant context for all API calls
  useEffect(() => {
    if (slug && slug !== "default") {
      setActiveTenant(slug);
    } else {
      setActiveTenant(null);
    }
    return () => setActiveTenant(null);
  }, [slug]);

  useEffect(() => {
    axios.get(`${API}/dashboard/years`).then((res) => {
      if (res.data.years && res.data.years.length > 0) setYears(res.data.years);
    }).catch(() => {});
  }, []);

  if (checking) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const basePath = `/admin/rapor/${slug || "default"}`;

  return (
    <div className="hrlytic-layout">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} basePath={basePath} />
      <div className="hrlytic-main">
        <TopBar year={year} setYear={setYear} years={years} country={country} setCountry={setCountry} />
        <div className="hrlytic-content">
          <DashboardRoutes year={year} country={country} />
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
