import { useState, useEffect } from "react";
import axios from "axios";
import { Heartbeat, Warning, Lightning, Smiley, CalendarBlank } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const RISK_COLOR = { Critical: "#EF4444", High: "#F97316", Medium: "#F59E0B", Low: "#14B8A6" };
const RISK_BG = { Critical: "bg-red-50", High: "bg-orange-50", Medium: "bg-amber-50", Low: "bg-emerald-50" };

export default function BurnoutPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/burnout?year=${year}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-500">Veri bulunamadı.</p>;

  const { kpis } = data;
  return (
    <div data-testid="burnout-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="At Risk" value={kpis.total_at_risk} icon={Warning} color="red" subtitle="Critical+Yüksek" />
        <KPICard title="Critical" value={kpis.critical_count} icon={Lightning} color="red" />
        <KPICard title="Avg Risk Score" value={kpis.avg_risk_score} icon={Heartbeat} color="amber" format="decimal" subtitle="/100" />
        <KPICard title="Avg Engagement" value={kpis.avg_engagement} icon={Smiley} color="green" format="decimal" subtitle="/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Risk Distribution" testId="chart-burnout-dist">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.risk_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="level" strokeWidth={0}>
                {data.risk_distribution?.map((e) => <Cell key={e.level} fill={RISK_COLOR[e.level]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#FFF", border: "1px solid #E2E8F0", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 -mt-2">
            {data.risk_distribution?.map((r) => (
              <span key={r.level} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLOR[r.level] }} />{r.level}: {r.count}
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Department Risk Heatmap" className="lg:col-span-2" testId="chart-burnout-dept">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.department_risk}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs">
                    <p className="font-semibold text-slate-800 mb-1">{d.department} ({d.count} employees)</p>
                    <p className="text-red-600">Critical: {d.critical} · High: {d.high}</p>
                    <p className="text-slate-600">Avg Risk: {d.avg_risk}</p>
                  </div>
                );
              }} />
              <Bar dataKey="avg_risk" name="Avg Risk Score" radius={[3, 3, 0, 0]}>
                {data.department_risk?.map((d, i) => (
                  <Cell key={i} fill={d.avg_risk >= 40 ? "#EF4444" : d.avg_risk >= 30 ? "#F59E0B" : "#14B8A6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="High Risk Employees" subtitle="Employees with critical or high burnout risk - immediate attention needed" testId="chart-burnout-list">
        <div className="space-y-2 px-3 pb-2 max-h-[450px] overflow-y-auto">
          {data.top_risk?.slice(0, 12).map((emp, i) => (
            <div key={`burn-${emp.name}`} className={`flex items-center gap-4 p-3 border rounded-md ${RISK_BG[emp.risk_level]}`}>
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                {emp.name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{emp.name}</p>
                <p className="text-[10px] text-slate-500">{emp.department} · {emp.job_title} · Band {emp.band}</p>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div><p className="text-[9px] text-slate-400">Engagement</p><p className="text-xs font-bold text-slate-700">{emp.engagement}/10</p></div>
                <div><p className="text-[9px] text-slate-400">Absent</p><p className="text-xs font-bold text-slate-700">{emp.absenteeism}d</p></div>
                <div><p className="text-[9px] text-slate-400">WLB</p><p className="text-xs font-bold text-slate-700">{emp.work_life_balance}/5</p></div>
                <div><p className="text-[9px] text-slate-400">Perf</p><p className="text-xs font-bold text-slate-700">{emp.performance}/5</p></div>
              </div>
              <div className="text-right min-w-[60px]">
                <p className="text-lg font-bold" style={{ color: RISK_COLOR[emp.risk_level] }}>{emp.risk_score}</p>
                <p className="text-[9px] font-medium" style={{ color: RISK_COLOR[emp.risk_level] }}>{emp.risk_level}</p>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
