import { useState, useEffect } from "react";
import axios from "axios";
import { TreeStructure, Users, UsersFour, Gauge, CheckCircle, Warning, ArrowsOutSimple } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Line, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HEALTH_COLOR = { Healthy: "#14B8A6", Attention: "#F59E0B", Restructure: "#EF4444" };
const HEALTH_BG = { Healthy: "bg-emerald-50 border-emerald-200 text-emerald-700", Attention: "bg-amber-50 border-amber-200 text-amber-700", Restructure: "bg-red-50 border-red-200 text-red-700" };

export default function OrgHealthPage({ year, country }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ year });
    if (country) params.append("country", country);
    axios.get(`${API}/dashboard/org-health?${params}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year, country]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis } = data;

  const pyramidData = data.band_pyramid.map(b => ({
    ...b,
    label: `Band ${b.band}`,
    barColor: b.deviation > 3 ? "#EF4444" : b.deviation < -3 ? "#F59E0B" : "#14B8A6",
  }));

  return (
    <div data-testid="org-health-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <KPICard title="Kadro" value={kpis.total_headcount} icon={Users} color="blue" />
        <KPICard title="Kontrol Aralığı" value={kpis.overall_span} icon={ArrowsOutSimple} color="amber" format="decimal" />
        <KPICard title="Yönetici Oranı" value={kpis.manager_ratio} icon={UsersFour} color="orange" format="percent" />
        <KPICard title="Hiyerarşi Derinliği" value={kpis.hierarchy_depth} icon={TreeStructure} color="blue" />
        <KPICard title="Sağlıklı" value={kpis.healthy_depts} icon={CheckCircle} color="green" />
        <KPICard title="Dikkat" value={kpis.attention_depts} icon={Warning} color="amber" />
        <KPICard title="Yeniden Yapılanma" value={kpis.restructure_depts} icon={Warning} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Departman Kontrol Aralığı" subtitle="Yönetici başına çalışan (ideal: 5-10)" testId="chart-span-control">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.department_health}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="span_of_control" name="Span of Control" radius={[3, 3, 0, 0]}>
                {data.department_health.map((d) => (
                  <Cell key={d.department} fill={d.span_of_control < 3 ? "#EF4444" : d.span_of_control > 12 ? "#F59E0B" : "#0E7490"} />
                ))}
              </Bar>
              <Line type="monotone" dataKey={() => 5} name="Min Ideal" stroke="#14B8A6" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey={() => 10} name="Max Ideal" stroke="#F59E0B" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-5 h-px bg-teal-500 inline-block" style={{borderTop: "2px dashed #14B8A6"}} />Min Ideal (5)</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-5 h-px bg-amber-500 inline-block" style={{borderTop: "2px dashed #F59E0B"}} />Max Ideal (10)</span>
          </div>
        </ChartCard>

        <ChartCard title="Band Pyramid" subtitle="Actual vs Ideal distribution" testId="chart-band-pyramid">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pyramidData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v, name) => [`${v}%`, name]} />
              <Bar dataKey="pct" name="Actual %" fill="#0E7490" radius={[3, 3, 0, 0]} barSize={28} />
              <Bar dataKey="ideal_pct" name="Ideal %" fill="#E2E8F0" radius={[3, 3, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Actual</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />Ideal</span>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Departman Yapı Sağlığı" subtitle="Kontrol aralığı, yönetici oranı ve performansa dayalı sağlık skoru" testId="chart-dept-health">
        <div className="space-y-2 px-3 pb-2">
          {data.department_health.map((dept) => (
            <div key={dept.department} data-testid={`dept-health-${dept.department.toLowerCase()}`}
              className="p-3 border border-slate-200 rounded-md hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-600">{dept.department}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{dept.department}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${HEALTH_BG[dept.health_status]}`}>
                        {dept.health_status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{dept.headcount} people · {dept.managers} managers · {dept.individual_contributors} ICs</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400">Span</p>
                    <p className={`text-sm font-bold ${dept.span_of_control < 3 || dept.span_of_control > 12 ? "text-red-600" : "text-slate-800"}`}>
                      {dept.span_of_control}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400">Mgr %</p>
                    <p className={`text-sm font-bold ${dept.manager_ratio > 30 ? "text-amber-600" : "text-slate-800"}`}>
                      {dept.manager_ratio}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400">Perf</p>
                    <p className="text-sm font-bold text-slate-800">{dept.avg_performance}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400">Health</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold" style={{ color: HEALTH_COLOR[dept.health_status] }}>{dept.health_score}</span>
                      <Gauge size={14} style={{ color: HEALTH_COLOR[dept.health_status] }} />
                    </div>
                  </div>
                </div>
              </div>
              {dept.issues.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1 ml-13">
                  {dept.issues.map((issue, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                      {issue}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Departman Yönetici Oranı" testId="chart-mgr-ratio">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.department_health}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
            <Bar dataKey="manager_ratio" name="Manager %" radius={[3, 3, 0, 0]}>
              {data.department_health.map((d) => (
                <Cell key={d.department} fill={d.manager_ratio > 30 ? "#F59E0B" : d.manager_ratio < 8 ? "#EF4444" : "#0E7490"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
