import { useState, useEffect } from "react";
import axios from "axios";
import { Binoculars, Warning, Lightning, TrendUp } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STATUS_COLOR = { Critical: "#EF4444", Warning: "#F59E0B", Stable: "#14B8A6" };

export default function CapabilityForecastPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/capability-forecast?year=${year}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-500">Veri bulunamadı.</p>;

  return (
    <div data-testid="capability-forecast-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Skills Tracked" value={data.total_skills} icon={Binoculars} color="blue" />
        <KPICard title="Critical (6M)" value={data.critical_6m?.length || 0} icon={Lightning} color="red" />
        <KPICard title="Warning (12M)" value={data.warning_12m?.length || 0} icon={Warning} color="amber" />
        <KPICard title="Top Demand" value={data.top_demand?.length || 0} icon={TrendUp} color="green" subtitle="skills" />
      </div>

      <ChartCard title="Top Skill Demand Forecast (12-Month Gap)" subtitle="Projected skill shortage based on attrition and growth" testId="chart-demand-forecast">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.top_demand?.slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="skill" type="category" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
            <Tooltip {...DARK_TOOLTIP} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs">
                  <p className="font-semibold text-slate-800 mb-1">{d.skill} ({d.category})</p>
                  <p className="text-slate-600">Current: {d.current_count} people · Experts: {d.experts}</p>
                  <p className="text-slate-600">6M: {d.horizon_6m?.status} · 12M: {d.horizon_12m?.status} · 24M: {d.horizon_24m?.status}</p>
                  <p className="font-medium mt-1" style={{color: STATUS_COLOR[d.horizon_12m?.status]}}>{d.horizon_12m?.gap} gap in 12 months</p>
                </div>
              );
            }} />
            <Bar dataKey="horizon_12m.gap" name="12M Gap" radius={[0, 4, 4, 0]}>
              {data.top_demand?.slice(0, 10).map((d, i) => (
                <Cell key={i} fill={STATUS_COLOR[d.horizon_12m?.status] || "#64748B"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Critical Skills (6-Month Horizon)" subtitle="Skills approaching critical shortage" testId="chart-critical-6m">
          <div className="space-y-2 px-3 pb-2">
            {data.critical_6m?.length > 0 ? data.critical_6m.map((s, i) => (
              <div key={`cap-${s.skill}`} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-md">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.skill}</p>
                  <p className="text-xs text-slate-500">{s.category} · {s.current_count} current · {s.experts} experts</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">-{s.horizon_6m?.gap}</p>
                  <p className="text-[10px] text-red-500">{s.horizon_6m?.remaining} remaining</p>
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 text-center py-6">No critical skills in 6-month horizon</p>}
          </div>
        </ChartCard>

        <ChartCard title="Warning Skills (12-Month Horizon)" subtitle="Skills requiring attention" testId="chart-warning-12m">
          <div className="space-y-2 px-3 pb-2 max-h-[300px] overflow-y-auto">
            {data.warning_12m?.length > 0 ? data.warning_12m.slice(0, 8).map((s, i) => (
              <div key={`warn-${s.skill}`} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-md">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.skill}</p>
                  <p className="text-xs text-slate-500">{s.category} · {s.current_count} people · Avg: {s.avg_prof}/5</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.horizon_12m?.status === 'Critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    {s.horizon_12m?.status}
                  </span>
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 text-center py-6">No warnings detected</p>}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
