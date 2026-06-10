import { useState, useEffect } from "react";
import axios from "axios";
import { Gear, Users, Buildings, GraduationCap, GenderIntersex, ChartBar } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Progress } from "@/components/ui/progress";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HROperationsPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/hr-operations?year=${year}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-500">Veri bulunamadı.</p>;

  const { kpis } = data;
  return (
    <div data-testid="hr-operations-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Çalışanlar" value={kpis.total_employees} icon={Users} color="blue" />
        <KPICard title="Tam Zamanlı" value={kpis.full_time} icon={Gear} color="green" />
        <KPICard title="Yarı Zamanlı" value={kpis.part_time} icon={Gear} color="amber" />
        <KPICard title="TZ Oranı" value={kpis.ft_ratio} icon={ChartBar} color="blue" format="percent" />
        <KPICard title="Engelli" value={kpis.disabled_rate} icon={Users} color="slate" format="percent" />
        <KPICard title="Ort. Kıdem" value={kpis.avg_seniority} icon={GraduationCap} color="orange" format="decimal" subtitle="yıl" />
      </div>

      <ChartCard title="Operasyonel Metrikler" testId="chart-op-metrics">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-2">
          {data.operational_metrics?.map((m) => {
            const pct = Math.min(100, (m.value / m.target) * 100);
            const color = pct >= 95 ? "text-emerald-600" : pct >= 80 ? "text-amber-600" : "text-red-600";
            return (
              <div key={m.metric} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-slate-700 font-medium">{m.metric}</span>
                  <span className={`text-sm font-bold ${color}`}>{m.value}{m.metric.includes('days') ? '' : '%'}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: pct >= 95 ? '#14B8A6' : pct >= 80 ? '#F59E0B' : '#EF4444' }} />
                </div>
                <p className="text-xs text-slate-400">Target: {m.target}{m.metric.includes('days') ? ' days' : '%'}</p>
              </div>
            );
          })}
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Departman Metrikleri" testId="chart-dept-metrics">
          <div className="overflow-x-auto px-2">
            <Table>
              <TableHeader><TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-slate-500 text-xs">Department</TableHead>
                <TableHead className="text-slate-500 text-xs text-right">Headcount</TableHead>
                <TableHead className="text-slate-500 text-xs text-right">Managers</TableHead>
                <TableHead className="text-slate-500 text-xs text-right">Span of Control</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.department_metrics?.map((d, i) => (
                  <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                    <TableCell className="text-slate-800 text-sm font-medium">{d.department}</TableCell>
                    <TableCell className="text-slate-600 text-sm text-right">{d.count}</TableCell>
                    <TableCell className="text-slate-600 text-sm text-right">{d.managers}</TableCell>
                    <TableCell className="text-right"><span className={`text-sm font-semibold ${d.span > 15 ? 'text-red-600' : d.span > 10 ? 'text-amber-600' : 'text-teal-700'}`}>{d.span}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
        <ChartCard title="Şehir Bazlı Çalışanlar" testId="chart-ops-city">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.by_city}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="value" fill="#0E7490" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Cinsiyet Dağılımı" testId="chart-ops-gender">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.gender_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" strokeWidth={0}>
                {data.gender_distribution?.map((entry, i) => <Cell key={`gen-${entry.name}`} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 -mt-2">
            {data.gender_distribution?.map((g, i) => (
              <span key={g.name} className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />{g.name}: {g.value}</span>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Eğitim Düzeyi" testId="chart-ops-edu">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.by_education}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="value" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
