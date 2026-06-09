import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Target, Warning, ChartLineUp, Crosshair, Buildings } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ComposedChart, Line, Area } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_STYLE = {
  "Critical Gap": "bg-red-50 text-red-700 border-red-200",
  "Under": "bg-amber-50 text-amber-700 border-amber-200",
  "On Track": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Over": "bg-blue-50 text-blue-700 border-blue-200",
};

const GAP_COLOR = (gap) => gap > 8 ? "#EF4444" : gap > 3 ? "#F59E0B" : gap > 0 ? "#14B8A6" : "#6366F1";

export default function HeadcountPlanPage({ year, country }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ year });
    if (country) params.append("country", country);
    axios.get(`${API}/dashboard/headcount-plan?${params}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year, country]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">No data available.</p>;

  const { kpis } = data;

  return (
    <div data-testid="headcount-plan-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Current HC" value={kpis.total_headcount} icon={Users} color="blue" />
        <KPICard title="Target HC" value={kpis.target_headcount} icon={Target} color="green" />
        <KPICard title="Total Gap" value={kpis.total_gap} icon={Warning} color="red" />
        <KPICard title="Fill Rate" value={kpis.fill_rate} icon={ChartLineUp} color="amber" format="percent" />
        <KPICard title="Critical Gaps" value={kpis.critical_gaps_count} icon={Crosshair} color="red" />
        <KPICard title="Depts Under" value={kpis.depts_under} icon={Buildings} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Target vs Current by Department" testId="chart-target-vs-current">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.department_plan} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="department" type="category" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="current" name="Current" fill="#0E7490" radius={[0, 3, 3, 0]} barSize={12} />
              <Bar dataKey="target" name="Target" fill="#E2E8F0" radius={[0, 3, 3, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Current</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />Target</span>
          </div>
        </ChartCard>

        <ChartCard title="Gap Analysis by Department" testId="chart-gap-analysis">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.department_plan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => [`${v} positions`, "Gap"]} />
              <Bar dataKey="gap" name="Gap" radius={[3, 3, 0, 0]}>
                {data.department_plan.map((d, i) => (
                  <Cell key={d.department} fill={GAP_COLOR(d.gap)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-red-500" />Critical (&gt;8)</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-500" />Moderate (4-8)</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-teal-500" />Low (1-3)</span>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Hiring Plan Timeline" subtitle="Monthly planned hires to close gaps" testId="chart-hiring-plan">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data.monthly_hiring_plan}>
            <defs>
              <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...DARK_TOOLTIP} />
            <Bar yAxisId="left" dataKey="planned_hires" name="Planned Hires" fill="#14B8A6" radius={[3, 3, 0, 0]} />
            <Area yAxisId="right" type="monotone" dataKey="cumulative_gap" name="Remaining Gap" stroke="#EF4444" fill="url(#gapGrad)" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Department Fill Rate" testId="chart-dept-status">
          <div className="space-y-2 px-3 pb-2 max-h-[400px] overflow-y-auto">
            {data.department_plan.map((dept) => (
              <div key={dept.department} className="flex items-center gap-3 p-2.5 border border-slate-100 rounded-md hover:bg-slate-50 transition-colors">
                <div className="w-12 text-right">
                  <span className="text-sm font-bold text-slate-800">{dept.fill_rate}%</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{dept.department}</span>
                    <span data-testid={`dept-status-${dept.department.toLowerCase()}`}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_STYLE[dept.status] || "bg-slate-50 text-slate-600"}`}>
                      {dept.status}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, dept.fill_rate)}%`, backgroundColor: dept.fill_rate >= 90 ? "#14B8A6" : dept.fill_rate >= 70 ? "#F59E0B" : "#EF4444" }} />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-slate-400">{dept.current} current</span>
                    <span className="text-[10px] text-slate-400">{dept.target} target</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Critical Role Gaps" subtitle="Roles requiring immediate hiring" testId="chart-critical-gaps">
          <div className="space-y-1.5 px-3 pb-2 max-h-[400px] overflow-y-auto">
            {data.critical_gaps.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No critical gaps identified</p>}
            {data.critical_gaps.map((gap, i) => (
              <div key={i} data-testid={`critical-gap-${i}`}
                className="flex items-center justify-between p-2.5 border border-slate-100 rounded-md hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${gap.urgency === "High" ? "bg-red-500" : "bg-amber-500"}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{gap.role}</p>
                    <p className="text-[10px] text-slate-400">{gap.department}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${gap.urgency === "High" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  {gap.urgency}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
