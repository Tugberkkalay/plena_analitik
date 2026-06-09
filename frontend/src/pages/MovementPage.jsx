import { useState, useEffect } from "react";
import axios from "axios";
import { UserPlus, UserMinus, ArrowsLeftRight, Warning } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MovementPage({ year, country }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/movement?year=${year}`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis } = data;

  return (
    <div data-testid="movement-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Hires" value={kpis.hires} icon={UserPlus} color="green" />
        <KPICard title="Leaves" value={kpis.leaves} icon={UserMinus} color="red" />
        <KPICard title="Net Movement" value={kpis.net_movement} icon={ArrowsLeftRight} color={kpis.net_movement >= 0 ? "blue" : "amber"} />
        <KPICard title="180-Day Failure" value={kpis.failure_rate_180} icon={Warning} color="orange" format="percent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Hires vs Leaves by Month" testId="chart-hl-month">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.hires_leaves_by_month}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="hires" name="Hires" fill="#14B8A6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="leaves" name="Leaves" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Hires</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Leaves</span>
          </div>
        </ChartCard>

        <ChartCard title="Hires vs Leaves by Department" testId="chart-hl-dept">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.hires_leaves_by_department} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="department" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={75} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="hires" name="Hires" fill="#14B8A6" radius={[0, 3, 3, 0]} />
              <Bar dataKey="leaves" name="Leaves" fill="#EF4444" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Hires</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Leaves</span>
          </div>
        </ChartCard>

        <ChartCard title="Retention Rate by Year" testId="chart-retention-year">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.retention_by_year}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="year" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} domain={[70, 100]} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="rate" name="Retention %" stroke="#0E7490" strokeWidth={2.5} dot={{ fill: "#0E7490", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Movement by Band" testId="chart-move-band">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.movement_by_band}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="band" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="hires" name="Hires" fill="#14B8A6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="leaves" name="Leaves" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Hires</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Leaves</span>
          </div>
        </ChartCard>

        <ChartCard title="Movement by Age Group" className="lg:col-span-2" testId="chart-move-age">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.movement_by_age}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="hires" name="Hires" fill="#14B8A6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="leaves" name="Leaves" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
