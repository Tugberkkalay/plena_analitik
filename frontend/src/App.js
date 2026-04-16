import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarBlank, FunnelSimple } from "@phosphor-icons/react";
import OverviewPage from "@/pages/OverviewPage";
import HeadcountPage from "@/pages/HeadcountPage";
import HiresLeavesPage from "@/pages/HiresLeavesPage";
import TurnoverPage from "@/pages/TurnoverPage";
import MovementPage from "@/pages/MovementPage";
import AIForecastPage from "@/pages/AIForecastPage";
import DataUploadPage from "@/pages/DataUploadPage";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PAGE_TITLES = {
  "/": "Executive Overview",
  "/headcount": "Headcount Analytics",
  "/hires-leaves": "Hires & Leaves",
  "/turnover": "Turnover Analysis",
  "/movement": "Workforce Movement",
  "/ai-forecast": "AI Forecast",
  "/data-upload": "Data Management",
};

function TopBar({ year, setYear, years }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "Dashboard";

  return (
    <div data-testid="top-bar" className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div>
        <h1 data-testid="page-title" className="text-2xl font-semibold text-slate-50 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800">
          <CalendarBlank size={16} className="text-slate-400" />
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger data-testid="year-selector" className="w-[90px] border-0 bg-transparent h-7 text-sm text-slate-200 p-0 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-slate-200 focus:bg-slate-800 focus:text-slate-100">
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
