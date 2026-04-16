import { useState, useEffect } from "react";
import axios from "axios";
import { CurrencyDollar, Scales, TrendUp, GenderIntersex, ChartBar } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Line } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CompensationPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/compensation?year=${year}`)
      .then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-500">No data available.</p>;

  const { kpis } = data;
  return (
    <div data-testid="compensation-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Avg Salary" value={`${Math.round(kpis.avg_salary/1000)}K`} icon={CurrencyDollar} color="blue" subtitle="TL/month" />
        <KPICard title="Compa Ratio" value={kpis.compa_ratio} icon={Scales} color="amber" format="decimal" />
        <KPICard title="Pay Gap" value={kpis.pay_gap} icon={GenderIntersex} color={kpis.pay_gap > 5 ? "red" : "green"} format="percent" subtitle="M vs F" />
        <KPICard title="Male Avg" value={`${Math.round(kpis.male_avg/1000)}K`} icon={TrendUp} color="slate" />
        <KPICard title="Female Avg" value={`${Math.round(kpis.female_avg/1000)}K`} icon={TrendUp} color="orange" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Salary by Band (Avg vs Midpoint)" testId="chart-sal-band">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data.by_band}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="band" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v/1000)}K`} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${Math.round(v).toLocaleString()} TL`} />
              <Bar dataKey="avg_salary" name="Avg Salary" fill="#0E7490" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="midpoint" name="Midpoint" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Avg Salary</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-1 bg-red-500" />Midpoint</span>
          </div>
        </ChartCard>
        <ChartCard title="Gender Pay Comparison by Band" testId="chart-gender-pay">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.gender_by_band}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="band" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v/1000)}K`} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${Math.round(v).toLocaleString()} TL`} />
              <Bar dataKey="male" name="Male" fill="#0E7490" radius={[3, 3, 0, 0]} />
              <Bar dataKey="female" name="Female" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Male</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />Female</span>
          </div>
        </ChartCard>
        <ChartCard title="Salary Distribution" testId="chart-sal-dist">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.salary_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" fill="#14B8A6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Avg Salary by Department" testId="chart-sal-dept">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.by_department} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v/1000)}K`} />
              <YAxis dataKey="department" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={75} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${Math.round(v).toLocaleString()} TL`} />
              <Bar dataKey="avg_salary" fill="#F59E0B" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
