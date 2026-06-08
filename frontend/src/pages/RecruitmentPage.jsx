import { useState, useEffect } from "react";
import axios from "axios";
import { Funnel, UserPlus, Clock, CurrencyDollar, CheckCircle } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RecruitmentPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/recruitment?year=${year}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-500">No data available.</p>;

  const { kpis } = data;
  return (
    <div data-testid="recruitment-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Total Candidates" value={kpis.total_candidates} icon={UserPlus} color="blue" />
        <KPICard title="Hired" value={kpis.hired} icon={CheckCircle} color="green" />
        <KPICard title="Time to Fill" value={kpis.time_to_fill} icon={Clock} color="amber" format="decimal" subtitle="days" />
        <KPICard title="Cost per Hire" value={kpis.cost_per_hire} icon={CurrencyDollar} color="orange" subtitle="TL" />
        <KPICard title="Offer Accept" value={kpis.offer_acceptance} icon={Funnel} color="slate" format="percent" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Recruitment Funnel" testId="chart-funnel">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="stage" type="category" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.funnel?.map((entry, i) => <Cell key={`fn-${entry.stage}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Applications by Month" testId="chart-recruit-month">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.applications_by_month}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" fill="#0E7490" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Candidates by Source" testId="chart-recruit-source">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.by_source} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={85} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="value" fill="#F59E0B" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Pipeline by Stage" testId="chart-pipeline">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.pipeline_by_stage} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="stage" strokeWidth={0}>
                {data.pipeline_by_stage?.map((entry, i) => <Cell key={`pl-${entry.stage}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 -mt-2">
            {data.pipeline_by_stage?.map((s, i) => (
              <span key={s.stage} className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{s.stage}</span>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
