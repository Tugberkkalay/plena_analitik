import { useState, useEffect } from "react";
import axios from "axios";
import { Users, UserPlus, UserMinus, TrendDown, Wheelchair } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-slate-800/50 rounded-md" />)}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-slate-800/50 rounded-md" />)}
    </div>
  </div>
);

export default function OverviewPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/overview?year=${year}`)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <p className="text-slate-400">No data available.</p>;

  const { kpis } = data;

  return (
    <div data-testid="overview-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Headcount" value={kpis.headcount} icon={Users} color="blue" />
        <KPICard title="Hires" value={kpis.hires} icon={UserPlus} color="green" />
        <KPICard title="Leaves" value={kpis.leaves} icon={UserMinus} color="red" />
        <KPICard title="Turnover Rate" value={kpis.turnover_rate} icon={TrendDown} color="amber" format="percent" />
        <KPICard title="Disabled" value={kpis.disabled_pct} icon={Wheelchair} color="slate" format="percent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Headcount Trend" subtitle="Monthly progression" className="lg:col-span-2" testId="chart-headcount-trend">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.headcount_by_month}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} fill="url(#blueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Gender Distribution" testId="chart-gender-dist">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.gender_distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" strokeWidth={0}>
                {data.gender_distribution.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 -mt-2">
            {data.gender_distribution.map((g, i) => (
              <div key={g.name} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                {g.name}: {g.value}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartCard title="Age Distribution" testId="chart-age-dist">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.age_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" strokeOpacity={0.5} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" fill="#2563EB" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department Distribution" testId="chart-dept-dist">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.department_distribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" strokeOpacity={0.5} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={85} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="value" fill="#F59E0B" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Band Distribution" testId="chart-band-dist">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.band_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="value" fill="#F97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Seniority Distribution" testId="chart-seniority-dist">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.seniority_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" strokeOpacity={0.5} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" fill="#64748B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Manager Distribution" testId="chart-manager-dist" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.manager_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" strokeWidth={0}>
                {data.manager_distribution.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i + 2]} />
                ))}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 -mt-2">
            {data.manager_distribution.map((g, i) => (
              <div key={g.name} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i + 2] }} />
                {g.name}: {g.value}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
