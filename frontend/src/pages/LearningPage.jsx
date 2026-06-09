import { useState, useEffect } from "react";
import axios from "axios";
import { GraduationCap, Clock, CheckCircle, ChartBar, Target } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LearningPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/learning?year=${year}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-500">Veri bulunamadı.</p>;

  const { kpis } = data;
  const STATUS_COLORS = { "Completed": "#14B8A6", "In Progress": "#F59E0B", "Not Started": "#64748B" };

  return (
    <div data-testid="learning-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Programs" value={kpis.total_programs} icon={GraduationCap} color="blue" />
        <KPICard title="Total Hours" value={kpis.total_hours} icon={Clock} color="amber" />
        <KPICard title="Hours/Employee" value={kpis.hours_per_employee} icon={ChartBar} color="green" format="decimal" />
        <KPICard title="Participation" value={kpis.participation_rate} icon={Target} color="orange" format="percent" />
        <KPICard title="Completion" value={kpis.completion_rate} icon={CheckCircle} color="blue" format="percent" />
        <KPICard title="Avg Score" value={kpis.avg_score} icon={Target} color="green" format="decimal" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Training by Category" testId="chart-learn-cat">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.by_category} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" strokeWidth={0}>
                {data.by_category?.map((entry, i) => <Cell key={`lcat-${entry.name}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 -mt-2">
            {data.by_category?.map((c, i) => (
              <span key={c.name} className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{c.name}</span>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Completion Status" testId="chart-learn-status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.by_status}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="status" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {data.by_status?.map((s, i) => <Cell key={`st-${s.status}`} fill={STATUS_COLORS[s.status] || CHART_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Hours by Department" testId="chart-learn-dept">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.by_department} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="department" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={75} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="hours" fill="#0E7490" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Top Courses" testId="chart-top-courses">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.top_courses} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="course" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={160} />
            <Tooltip {...DARK_TOOLTIP} />
            <Bar dataKey="count" fill="#F59E0B" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
