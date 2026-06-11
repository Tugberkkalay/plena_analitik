import { useState, useEffect } from "react";
import axios from "axios";
import { Users, UserPlus, UserMinus, TrendDown, Wheelchair, Buildings, Trophy, Warning } from "@phosphor-icons/react";
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
      {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-md" />)}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-slate-200 rounded-md" />)}
    </div>
  </div>
);

export default function OverviewPage({ year, country }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branchData, setBranchData] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ year });
    if (country) params.append("country", country);
    Promise.all([
      axios.get(`${API}/dashboard/overview?${params}`),
      axios.get(`${API}/branches/performance?period=${year}`).catch(() => null)
    ]).then(([overview, branches]) => {
      setData(overview.data);
      if (branches) setBranchData(branches.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [year, country]);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis, trends } = data;

  return (
    <div data-testid="overview-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Çalışan Sayısı" value={kpis.headcount} icon={Users} color="blue" trend={trends?.headcount} />
        <KPICard title="İşe Alım" value={kpis.hires} icon={UserPlus} color="green" trend={trends?.hires} />
        <KPICard title="Ayrılma" value={kpis.leaves} icon={UserMinus} color="red" trend={{ ...trends?.leaves, inverse: true }} />
        <KPICard title="Devir Oranı" value={kpis.turnover_rate} icon={TrendDown} color="amber" format="percent" trend={{ ...trends?.turnover, inverse: true }} />
        <KPICard title="Engelli Oranı" value={kpis.disabled_pct} icon={Wheelchair} color="slate" format="percent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Kadro Trendi" subtitle="Aylık değişim" className="lg:col-span-2" testId="chart-headcount-trend">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.headcount_by_month}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0E7490" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0E7490" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Area type="monotone" dataKey="count" stroke="#0E7490" strokeWidth={2} fill="url(#blueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cinsiyet Dağılımı" testId="chart-gender-dist">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.gender_distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" strokeWidth={0}>
                {data.gender_distribution.map((_, i) => (
                  <Cell key={`gender-${data.gender_distribution[i]?.name || i}`} fill={CHART_COLORS[i]} />
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
        <ChartCard title="Yaş Dağılımı" testId="chart-age-dist">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.age_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" fill="#0E7490" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Departman Dağılımı" testId="chart-dept-dist">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.department_distribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={85} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="value" fill="#F59E0B" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Band Dağılımı" testId="chart-band-dist">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.band_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="value" fill="#F97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Kıdem Dağılımı" testId="chart-seniority-dist">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.seniority_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" fill="#64748B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Yönetici Dağılımı" testId="chart-manager-dist" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.manager_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" strokeWidth={0}>
                {data.manager_distribution.map((_, i) => (
                  <Cell key={`mgr-${data.manager_distribution[i]?.name || i}`} fill={CHART_COLORS[i + 2]} />
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

      {/* Branch Performance Summary */}
      {branchData && (
        <ChartCard title="Şube Performans Özeti" testId="chart-branch-summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-3 pb-3">
            <div className="bg-slate-50 rounded-md p-3 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase mb-1">Toplam Şube</p>
              <p className="text-xl font-bold text-slate-800">{branchData.kpis.total_branches}</p>
            </div>
            <div className="bg-slate-50 rounded-md p-3 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase mb-1">Ort. Gerçekleşme</p>
              <p className={`text-xl font-bold ${branchData.kpis.avg_achievement >= 100 ? "text-teal-700" : branchData.kpis.avg_achievement >= 85 ? "text-amber-600" : "text-red-600"}`}>
                %{branchData.kpis.avg_achievement}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-md p-3 border border-emerald-100">
              <p className="text-[10px] text-emerald-600 uppercase mb-1">Hedef Üstü</p>
              <p className="text-xl font-bold text-emerald-700">{branchData.kpis.above_target}</p>
            </div>
            <div className="bg-red-50 rounded-md p-3 border border-red-100">
              <p className="text-[10px] text-red-500 uppercase mb-1">Hedef Altı</p>
              <p className="text-xl font-bold text-red-600">{branchData.kpis.below_target}</p>
            </div>
          </div>
          <div className="px-3 pb-2">
            <p className="text-[10px] text-slate-400 uppercase mb-2 font-medium">En İyi / En Kötü Şubeler</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                {branchData.leaderboard.slice(0, 3).map((b, i) => (
                  <div key={b.branch_id} className="flex items-center justify-between p-1.5 bg-emerald-50 rounded border border-emerald-100">
                    <span className="text-xs text-emerald-800"><Trophy size={10} className="inline mr-1" weight="bold" />{b.name.replace(" Şubesi","")}</span>
                    <span className="text-xs font-bold text-emerald-700">%{b.achievement_pct}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {branchData.leaderboard.slice(-3).reverse().map((b, i) => (
                  <div key={b.branch_id} className="flex items-center justify-between p-1.5 bg-red-50 rounded border border-red-100">
                    <span className="text-xs text-red-800"><Warning size={10} className="inline mr-1" weight="bold" />{b.name.replace(" Şubesi","")}</span>
                    <span className="text-xs font-bold text-red-600">%{b.achievement_pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
