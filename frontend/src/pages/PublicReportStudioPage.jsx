import { useState } from "react";
import { ChartBar, GridFour, ShieldCheck } from "@phosphor-icons/react";
import ReportDesignerPage from "@/pages/ReportDesignerPage";
import DashboardManagerPage from "@/pages/DashboardManagerPage";

export default function PublicReportStudioPage() {
  const [tab, setTab] = useState("visuals");

  return (
    <div className="space-y-4" data-testid="public-report-studio">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
        <ShieldCheck size={20} weight="duotone" className="text-blue-700 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Güvenli Rapor Stüdyosu</p>
          <p className="text-xs text-blue-700 mt-0.5">Buradaki işlemler yalnızca rapor tanımı ve sayfa yerleşimi kaydeder. Seed veri okunur, değiştirilmez veya silinmez.</p>
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        <button type="button" onClick={() => setTab("visuals")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "visuals" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
          <ChartBar size={16} /> 1. KPI & Grafik Oluştur
        </button>
        <button type="button" onClick={() => setTab("layout")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "layout" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
          <GridFour size={16} /> 2. Sayfayı Tasarla
        </button>
      </div>

      {tab === "visuals" ? <ReportDesignerPage publicMode /> : <DashboardManagerPage publicMode />}
    </div>
  );
}
