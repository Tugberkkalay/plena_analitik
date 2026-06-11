import { useState, useEffect } from "react";
import axios from "axios";
import { Buildings, TrendUp, Trophy, Warning, CurrencyDollar, ChartBar } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ComposedChart, Line, Area } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ACH_COLOR = (a) => a >= 100 ? "#0E7490" : a >= 85 ? "#F59E0B" : "#EF4444";
const ACH_BG = (a) => a >= 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : a >= 85 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200";

export default function BranchPerformancePage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selBranch, setSelBranch] = useState(null);
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/branches/performance?period=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  const loadTrend = async (branchId, name) => {
    setSelBranch(name);
    try {
      const r = await axios.get(`${API}/branches/${branchId}/trend`);
      setTrend(r.data.trend);
    } catch (_) {}
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;
  const { kpis } = data;

  return (
    <div data-testid="branch-performance-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Toplam Şube" value={kpis.total_branches} icon={Buildings} color="blue" />
        <KPICard title="Ort. Gerçekleşme" value={kpis.avg_achievement} icon={ChartBar} color="amber" format="percent" />
        <KPICard title="Hedef Üstü" value={kpis.above_target} icon={TrendUp} color="green" />
        <KPICard title="Hedef Altı" value={kpis.below_target} icon={Warning} color="red" />
        <KPICard title="Toplam Prim" value={`${Math.round(kpis.total_commission/1000)}K`} icon={CurrencyDollar} color="blue" />
        <KPICard title="En İyi Şube" value={kpis.best_branch?.replace(" Şubesi","")} icon={Trophy} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leaderboard */}
        <ChartCard title="Şube Sıralaması" subtitle="Gerçekleşmeye göre sıralı" className="lg:col-span-2" testId="chart-branch-leaderboard">
          <div className="space-y-1.5 px-3 pb-2 max-h-[480px] overflow-y-auto">
            {data.leaderboard.map((b, i) => (
              <div key={b.branch_id} data-testid={`branch-${i}`}
                onClick={() => loadTrend(b.branch_id, b.name)}
                className={`flex items-center justify-between p-2.5 border rounded-md cursor-pointer transition-colors ${
                  selBranch === b.name ? "bg-teal-50 border-teal-300" : "border-slate-200 hover:bg-slate-50"
                }`}>
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">{i+1}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{b.name}</p>
                    <p className="text-[10px] text-slate-400">{b.region} · {b.segment} · {b.headcount} kişi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Hedef / Gerçekleşen</p>
                    <p className="text-[10px] text-slate-500">{(b.target/1000000).toFixed(1)}M / {(b.actual/1000000).toFixed(1)}M</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${ACH_BG(b.achievement_pct)}`}>
                    %{b.achievement_pct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Region comparison */}
        <ChartCard title="Bölge Karşılaştırması" testId="chart-region-compare">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.regions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" domain={[0, 'auto']} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `%${v}`} />
              <YAxis dataKey="region" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip {...DARK_TOOLTIP} formatter={v => `%${v}`} />
              <Bar dataKey="avg_achievement" name="Ort. Gerçekleşme" radius={[0,3,3,0]}>
                {data.regions.map((r, i) => <Cell key={r.region} fill={ACH_COLOR(r.avg_achievement)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend */}
        <ChartCard title={selBranch ? `${selBranch} — Aylık Trend` : "Şube trend'i görmek için tıklayın"} testId="chart-branch-trend">
          {trend ? (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trend}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                <XAxis dataKey="period" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip {...DARK_TOOLTIP} formatter={v => `${(v/1000).toFixed(1)}K TL`} />
                <Area type="monotone" dataKey="actual" name="Gerçekleşen" stroke="#14B8A6" fill="url(#actGrad)" strokeWidth={2} />
                <Line type="monotone" dataKey="target" name="Hedef" stroke="#EF4444" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">Sol listeden şube seçin</div>
          )}
        </ChartCard>

        {/* Segment */}
        <ChartCard title="Segment Karşılaştırması" testId="chart-segment-compare">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.segments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="segment" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `%${v}`} />
              <Tooltip {...DARK_TOOLTIP} formatter={v => `%${v}`} />
              <Bar dataKey="avg_achievement" name="Ort. Gerçekleşme" radius={[3,3,0,0]} barSize={40}>
                {data.segments.map(s => <Cell key={s.segment} fill={ACH_COLOR(s.avg_achievement)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
