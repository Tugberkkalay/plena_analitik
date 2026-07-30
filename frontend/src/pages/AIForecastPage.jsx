import { useState, useEffect } from "react";
import axios from "axios";
import { Brain, Warning, Lightning, TrendUp, ShieldWarning, Heartbeat } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RiskGauge = ({ score, level, label }) => {
  const pct = Math.round(score * 100);
  const color = level === "Düşük" ? "#22C55E" : level === "Orta" ? "#F59E0B" : "#EF4444";
  const bgColor = level === "Düşük" ? "bg-emerald-50" : level === "Orta" ? "bg-amber-50" : "bg-red-50";
  const textColor = level === "Düşük" ? "text-emerald-700" : level === "Orta" ? "text-amber-700" : "text-red-700";

  return (
    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm flex flex-col items-center">
      <p className="text-xs tracking-[0.15em] uppercase text-slate-500 font-medium mb-4">{label}</p>
      <div className="relative w-32 h-16 mb-3">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="#E2E8F0" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${pct * 1.57} 157`} />
        </svg>
      </div>
      <p className={`text-3xl font-bold ${textColor}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{pct}%</p>
      <span className={`mt-1 px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>{level} Risk</span>
    </div>
  );
};

export default function AIForecastPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const runForecast = () => {
    setLoading(true);
    axios.post(`${API}/ai/forecast`, { year })
      .then((r) => { setData(r.data); setGenerated(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (!generated) {
    return (
      <div data-testid="ai-forecast-page" className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center">
          <Brain size={40} weight="duotone" className="text-teal-600" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Plena AI İşgücü Tahmini</h2>
          <p className="text-slate-600 text-sm">Plena AI ile işgücü verilerinizi analiz edin: devir riski, kadro tahminleri ve uygulanabilir öneriler.</p>
        </div>
        <Button data-testid="run-forecast-btn" onClick={runForecast} disabled={loading}
          className="bg-teal-700 hover:bg-teal-600 text-white px-6 py-3 text-sm font-medium rounded-md">
          {loading ? (
            <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Analyzing...</span>
          ) : (
            <span className="flex items-center gap-2"><Lightning size={18} weight="bold" />Tahmin Oluştur</span>
          )}
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div data-testid="ai-forecast-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RiskGauge score={data.attrition_risk.score} level={data.attrition_risk.level} label="Devir Riski" />
        <RiskGauge score={data.burnout_risk.score} level={data.burnout_risk.level} label="Tükenmişlik Riski" />
        <div className="bg-white border border-slate-200 rounded-md p-5">
          <p className="text-xs tracking-[0.15em] uppercase text-slate-500 font-medium mb-3">Plena AI Önerileri</p>
          <ul className="space-y-2">
            {data.recommendations?.map((r, i) => (
              <li key={`rec-${i}`} className="flex items-start gap-2 text-sm text-slate-600">
                <TrendUp size={14} weight="bold" className="text-teal-600 mt-0.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Kadro Tahmini (6 Ay)" subtitle="Güven aralığıyla tahmin" testId="chart-hc-forecast">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.headcount_forecast}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0E7490" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0E7490" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confGrad)" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" />
              <Area type="monotone" dataKey="predicted" stroke="#0E7490" strokeWidth={2.5} fill="url(#forecastGrad)" dot={{ fill: "#0E7490", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Departman Risk Analizi" subtitle="Departman bazlı devir riski" testId="chart-dept-risk">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.department_risks}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
              <Bar dataKey="risk" name="Risk %" radius={[3, 3, 0, 0]}>
                {data.department_risks?.map((entry, i) => (
                  <rect key={i} fill={entry.risk > 20 ? "#EF4444" : entry.risk > 10 ? "#F59E0B" : "#22C55E"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {data.ai_summary && (
        <div className="bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} weight="duotone" className="text-teal-600" />
            <h3 className="text-sm font-medium text-slate-800">Plena AI Analiz Özeti</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{data.ai_summary}</p>
        </div>
      )}

      {data.at_risk_employees?.length > 0 && (
        <ChartCard title="Risk Altındaki Çalışanlar" subtitle="Yüksek ayrılma veya performans riski olan çalışanlar" testId="chart-at-risk"
          headerRight={<ExcelExportButton data={data.at_risk_employees} filename="risk-calisanlar" sheetName="Risk Listesi" />}>
          <div className="overflow-x-auto px-2">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs">Name</TableHead>
                  <TableHead className="text-slate-400 text-xs">Departman</TableHead>
                  <TableHead className="text-slate-400 text-xs">Performans</TableHead>
                  <TableHead className="text-slate-400 text-xs">Kıdem</TableHead>
                  <TableHead className="text-slate-400 text-xs">Risk Seviyesi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.at_risk_employees.map((e, i) => (
                  <TableRow key={`risk-${e.name}`} className="border-slate-100 hover:bg-slate-50">
                    <TableCell className="text-slate-800 text-sm font-medium">{e.name}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{e.department}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{e.performance}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{e.seniority} yıl</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        e.risk_level === "Yüksek" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                      }`}>{e.risk_level}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      )}

      <div className="flex justify-center">
        <Button data-testid="regenerate-forecast-btn" onClick={runForecast} disabled={loading} variant="outline"
          className="border-slate-700 text-slate-600 hover:bg-slate-800 hover:text-slate-100">
          {loading ? "Yeniden oluşturuluyor..." : "Tahmini Yenile"}
        </Button>
      </div>
    </div>
  );
}
