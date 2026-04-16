import { useState, useEffect } from "react";
import axios from "axios";
import { Smiley, ThumbsUp, ThumbsDown, ChartBar, CalendarBlank } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function EngagementPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/engagement?year=${year}`)
      .then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data || !data.kpis) return <p className="text-slate-500">No data available.</p>;

  const { kpis } = data;
  const ENPS_COLORS = { Promoters: "#14B8A6", Passives: "#F59E0B", Detractors: "#EF4444" };

  return (
    <div data-testid="engagement-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Engagement" value={kpis.avg_engagement} icon={Smiley} color="blue" format="decimal" subtitle="/10" />
        <KPICard title="eNPS" value={kpis.enps} icon={ThumbsUp} color={kpis.enps > 20 ? "green" : "amber"} format="decimal" />
        <KPICard title="Participation" value={kpis.participation_rate} icon={ChartBar} color="green" format="percent" />
        <KPICard title="Absenteeism" value={kpis.avg_absenteeism} icon={CalendarBlank} color="orange" format="decimal" subtitle="days/yr" />
        <KPICard title="Surveys" value={kpis.total_surveys} icon={ThumbsDown} color="slate" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Engagement Drivers" testId="chart-eng-drivers">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={data.drivers} cx="50%" cy="50%" outerRadius={90}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="driver" tick={{ fill: "#64748B", fontSize: 9 }} />
              <Radar name="Score" dataKey="score" stroke="#0E7490" fill="#0E7490" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip {...DARK_TOOLTIP} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="eNPS Distribution" testId="chart-enps-dist">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.enps_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="category" strokeWidth={0}>
                {data.enps_distribution?.map((e) => <Cell key={e.category} fill={ENPS_COLORS[e.category]} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 -mt-2">
            {data.enps_distribution?.map((e) => (
              <span key={e.category} className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ENPS_COLORS[e.category] }} />{e.category}: {e.count}</span>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Score Distribution" testId="chart-eng-score-dist">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.score_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" fill="#0E7490" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Engagement by Department" testId="chart-eng-dept">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.by_department}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...DARK_TOOLTIP} />
            <Bar dataKey="engagement" name="Engagement Score" fill="#0E7490" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
