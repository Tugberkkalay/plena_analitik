import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarBlank, Printer } from "@phosphor-icons/react";
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PAGE_TITLES = {
  "/": "Executive Overview",
  "/headcount": "Headcount Analytics",
  "/hires-leaves": "Hires & Leaves",
  "/turnover": "Turnover Analysis",
  "/movement": "Workforce Movement",
  "/ai-forecast": "AI Forecast",
  "/data-upload": "Data Management",
  "/recruitment": "Recruitment Analytics",
  "/performance": "Performance Management",
  "/learning": "Learning & Development",
  "/compensation": "Compensation & Benefits",
  "/engagement": "Engagement & Experience",
  "/career-talent": "Career & Talent",
  "/skills-map": "Skills & Competency Map",
  "/career-dev": "AI Career Development",
  "/scenario-sim": "Scenario Simulator",
  "/capability-forecast": "Capability Forecasting",
  "/succession": "Succession & Knowledge Risk",
  "/burnout": "Burnout Early Warning",
  "/hr-operations": "HR Operations",
  "/headcount-plan": "Headcount Planning",
  "/workforce-alignment": "Workforce Alignment",
  "/org-health": "Organization Health",
};

function TopBar({ year, setYear, years }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "Dashboard";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div data-testid="top-bar" className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div>
        <h1 data-testid="page-title" className="text-2xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          data-testid="pdf-export-btn"
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
          title="Export to PDF"
        >
          <Printer size={16} weight="bold" />
          <span>Export PDF</span>
        </button>
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

function AppContent() {
  const [year, setYear] = useState(2025);
  const [years, setYears] = useState([2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    axios.get(`${API}/dashboard/years`).then((res) => {
      if (res.data.years && res.data.years.length > 0) setYears(res.data.years);
    }).catch(() => {});
  }, []);

  return (
    <div className="hrlytic-layout">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="hrlytic-main">
        <TopBar year={year} setYear={setYear} years={years} />
        <div className="hrlytic-content">
          <Routes>
            <Route path="/" element={<OverviewPage year={year} />} />
            <Route path="/headcount" element={<HeadcountPage year={year} />} />
            <Route path="/hires-leaves" element={<HiresLeavesPage year={year} />} />
            <Route path="/turnover" element={<TurnoverPage year={year} />} />
            <Route path="/movement" element={<MovementPage year={year} />} />
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
            <Route path="/headcount-plan" element={<HeadcountPlanPage year={year} />} />
            <Route path="/workforce-alignment" element={<WorkforceAlignmentPage year={year} />} />
            <Route path="/org-health" element={<OrgHealthPage year={year} />} />
            <Route path="/ai-forecast" element={<AIForecastPage year={year} />} />
            <Route path="/data-upload" element={<DataUploadPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
