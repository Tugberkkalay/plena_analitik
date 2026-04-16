import { useState, useEffect } from "react";
import axios from "axios";
import { Star, ArrowsClockwise, Users, ShieldCheck, Briefcase, TrendUp } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CareerTalentPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/career?year=${year}`)
      .then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-500">No data available.</p>;

  const { kpis } = data;
  return (
    <div data-testid="career-talent-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Talent Pool" value={kpis.talent_pool} icon={Star} color="amber" />
        <KPICard title="Talent Ratio" value={kpis.talent_ratio} icon={TrendUp} color="blue" format="percent" />
        <KPICard title="Promotion Rate" value={kpis.promotion_rate} icon={ArrowsClockwise} color="green" format="percent" />
        <KPICard title="Succession" value={kpis.succession_coverage} icon={ShieldCheck} color="orange" format="percent" />
        <KPICard title="Mobility" value={kpis.internal_mobility} icon={Briefcase} color="slate" format="percent" />
        <KPICard title="Managers" value={kpis.manager_count} icon={Users} color="blue" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Talent by Department" className="lg:col-span-2" testId="chart-talent-dept">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.talent_by_department}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="total" name="Total" fill="#E2E8F0" radius={[3, 3, 0, 0]} />
              <Bar dataKey="talents" name="Talents" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />Total</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />Talents</span>
          </div>
        </ChartCard>
        <ChartCard title="Leadership Pipeline" testId="chart-leadership">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.leadership_pipeline} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="level" strokeWidth={0}>
                {data.leadership_pipeline?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 -mt-2">
            {data.leadership_pipeline?.map((l, i) => (
              <span key={l.level} className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />{l.level}: {l.count}</span>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Talent by Band" className="lg:col-span-3" testId="chart-talent-band">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.talent_by_band}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="band" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" fill="#0E7490" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
