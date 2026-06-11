import { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, CurrencyDollar, Warning, TrendUp, UsersFour } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ACH_COLOR = (a) => a >= 100 ? "#0E7490" : a >= 85 ? "#F59E0B" : "#EF4444";
const ACH_BG = (a) => a >= 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : a >= 85 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200";
const BAND_COLORS = { "<%85": "#EF4444", "%85-100": "#F59E0B", "%100-120": "#14B8A6", "%120+": "#0E7490" };

export default function CommissionTargetsPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selRep, setSelRep] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/sales/reps?period=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;
  const { kpis, prim_tiers } = data;

  const calcTierBreakdown = (rep) => {
    if (!rep) return [];
    return prim_tiers.map(t => {
      const inRange = rep.achievement_pct >= t.min && rep.achievement_pct < t.max;
      return { label: t.label, rate: `%${(t.rate*100).toFixed(1)}`, active: inRange, min: t.min, max: t.max };
    });
  };

  return (
    <div data-testid="commission-targets-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Ort. Gerçekleşme" value={kpis.avg_achievement} icon={TrendUp} color="amber" format="percent" />
        <KPICard title="Prim Hak Eden" value={kpis.commission_earners} icon={UsersFour} color="green" />
        <KPICard title="Toplam Prim" value={`${Math.round(kpis.total_commission/1000)}K`} icon={CurrencyDollar} color="blue" />
        <KPICard title="En İyi Temsilci" value={kpis.best_rep} icon={Trophy} color="green" />
        <KPICard title="Hedef Altı" value={kpis.below_target} icon={Warning} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rep leaderboard */}
        <ChartCard title="Temsilci Sıralaması" subtitle={`${data.reps.length} satış temsilcisi`} className="lg:col-span-2" testId="chart-rep-leaderboard">
          <div className="space-y-1 px-3 pb-2 max-h-[500px] overflow-y-auto">
            {data.reps.map((r, i) => (
              <div key={r.employee_id} data-testid={`rep-${i}`}
                onClick={() => setSelRep(r)}
                className={`flex items-center justify-between p-2.5 border rounded-md cursor-pointer transition-colors ${
                  selRep?.employee_id === r.employee_id ? "bg-teal-50 border-teal-300" : "border-slate-200 hover:bg-slate-50"
                }`}>
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">{i+1}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {r.name?.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.name}</p>
                    <p className="text-[10px] text-slate-400">{r.branch} · {r.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-400">Portföy</p>
                    <p className="text-xs font-medium text-slate-600">{r.portfolio_size}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Prim</p>
                    <p className="text-xs font-bold text-teal-700">{(r.commission/1000).toFixed(1)}K</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${ACH_BG(r.achievement_pct)}`}>
                    %{r.achievement_pct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Achievement band + commission breakdown */}
        <div className="space-y-4">
          <ChartCard title="Gerçekleşme Bandı" testId="chart-ach-bands">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.achievement_bands}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                <XAxis dataKey="band" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...DARK_TOOLTIP} />
                <Bar dataKey="count" name="Kişi Sayısı" radius={[3,3,0,0]}>
                  {data.achievement_bands.map(b => <Cell key={b.band} fill={BAND_COLORS[b.band] || "#94A3B8"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Commission detail for selected rep */}
          <ChartCard title={selRep ? `Prim Detayı: ${selRep.name}` : "Prim detayı için temsilci seçin"} testId="chart-commission-detail">
            {selRep ? (
              <div className="px-3 pb-2 space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-xs text-slate-500">Gerçekleşme</span>
                  <span className="text-lg font-bold" style={{color: ACH_COLOR(selRep.achievement_pct)}}>%{selRep.achievement_pct}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-xs text-slate-500">Hedef</span>
                  <span className="text-sm font-bold text-slate-700">{(selRep.target/1000).toFixed(0)}K TL</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100">
                  <span className="text-xs text-slate-500">Gerçekleşen</span>
                  <span className="text-sm font-bold text-slate-700">{(selRep.actual/1000).toFixed(0)}K TL</span>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mt-3 mb-1">Prim Kademeleri</p>
                {calcTierBreakdown(selRep).map(t => (
                  <div key={t.label} className={`flex items-center justify-between p-2 rounded border ${t.active ? "bg-teal-50 border-teal-200" : "bg-slate-50 border-slate-100"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t.active ? "bg-teal-500" : "bg-slate-300"}`} />
                      <span className={`text-xs ${t.active ? "font-bold text-teal-800" : "text-slate-500"}`}>{t.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400">%{t.min}-{t.max === 999 ? "∞" : t.max}</span>
                      <span className={`ml-2 text-xs font-medium ${t.active ? "text-teal-700" : "text-slate-400"}`}>{t.rate}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 mt-2 bg-teal-50 rounded-md border border-teal-200">
                  <span className="text-xs font-medium text-teal-700">Toplam Prim</span>
                  <span className="text-lg font-bold text-teal-800">{(selRep.commission/1000).toFixed(1)}K TL</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-sm text-slate-400">Sol listeden temsilci seçin</div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
