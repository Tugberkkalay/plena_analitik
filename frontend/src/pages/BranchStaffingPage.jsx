import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Warning, ArrowsClockwise, Buildings, Clock, Gauge } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const URG_BG = { "Acil": "bg-red-50 text-red-700 border-red-200", "Yüksek": "bg-amber-50 text-amber-700 border-amber-200", "Normal": "bg-blue-50 text-blue-700 border-blue-200", "Yeterli": "bg-emerald-50 text-emerald-700 border-emerald-200" };
const HEAT_COLOR = (v) => v >= 3 ? "#EF4444" : v >= 2 ? "#F59E0B" : v >= 1 ? "#FDE68A" : "#F0FDF4";

export default function BranchStaffingPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/branches/staffing?year=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;
  const { kpis } = data;

  return (
    <div data-testid="branch-staffing-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Toplam Açık" value={kpis.total_gap} icon={Users} color="red" />
        <KPICard title="Kritik Şube" value={kpis.critical_branches} icon={Warning} color="amber" />
        <KPICard title="Ort. Sirkülasyon" value={kpis.avg_turnover} icon={ArrowsClockwise} color="orange" format="percent" />
        <KPICard title="En Yüksek Devir" value={kpis.worst_turnover?.replace(" Şubesi","")} icon={Buildings} color="red" />
        <KPICard title="Acil İşe Alım" value={kpis.urgent_hire} icon={Clock} color="amber" />
        <KPICard title="Doluluk Oranı" value={kpis.fill_rate} icon={Gauge} color="green" format="percent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Staffing Table */}
        <ChartCard title="Şube Kadro Tablosu" subtitle="Personel baskısına göre sıralı" testId="chart-staffing-table">
          <div className="space-y-1.5 px-3 pb-2 max-h-[440px] overflow-y-auto">
            {data.staffing.map((s, i) => (
              <div key={s.branch_id} data-testid={`staffing-${i}`}
                className="flex items-center justify-between p-2.5 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${URG_BG[s.urgency]}`}>{s.urgency}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{s.region} · {s.segment}</p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-[10px] text-slate-400">Kadro</p>
                    <p className="text-xs font-bold text-slate-700">{s.current}/{s.target}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Açık</p>
                    <p className={`text-xs font-bold ${s.gap > 3 ? "text-red-600" : s.gap > 0 ? "text-amber-600" : "text-emerald-600"}`}>{s.gap}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Devir</p>
                    <p className={`text-xs font-bold ${s.turnover_pct > 15 ? "text-red-600" : "text-slate-600"}`}>%{s.turnover_pct}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Satış</p>
                    <p className="text-xs font-bold text-slate-600">%{s.achievement_pct}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Quadrant: achievement vs fill rate */}
        <ChartCard title="Hedef-Kadro Dengesi" subtitle="Sağ-alt = yüksek hedef, düşük kadro → acil alım" testId="chart-staffing-quadrant">
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" dataKey="achievement" name="Satış %" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false}
                label={{ value: "Satış Gerçekleşme %", position: "bottom", fontSize: 10, fill: "#94A3B8" }} />
              <YAxis type="number" dataKey="fill_rate" name="Doluluk %" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false}
                label={{ value: "Kadro Doluluk %", angle: -90, position: "insideLeft", fontSize: 10, fill: "#94A3B8" }} />
              <ZAxis type="number" dataKey="gap" range={[40, 200]} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v, name) => [`${v}%`, name]} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-800 text-white p-2 rounded text-xs shadow-lg">
                    <p className="font-bold">{d.name}</p>
                    <p>Satış: %{d.achievement}</p>
                    <p>Doluluk: %{d.fill_rate}</p>
                    <p>Açık: {d.gap} kişi</p>
                    <p className={d.urgency === "Acil" ? "text-red-300" : ""}>{d.urgency}</p>
                  </div>
                );
              }} />
              <ReferenceLine x={85} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1} />
              <Scatter data={data.quadrant} fill="#0E7490">
                {data.quadrant.map((d, i) => (
                  <Cell key={i} fill={d.urgency === "Acil" ? "#EF4444" : d.urgency === "Yüksek" ? "#F59E0B" : "#0E7490"} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-red-500" />Acil</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-500" />Yüksek</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-teal-700" />Normal</span>
          </div>
        </ChartCard>
      </div>

      {/* Turnover Heatmap */}
      <ChartCard title="Sirkülasyon Isı Haritası" subtitle="Şube × Çeyrek — ayrılan kişi sayısı" testId="chart-turnover-heatmap">
        <div className="overflow-x-auto px-3 pb-2">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 text-slate-500 font-medium w-40">Şube</th>
                <th className="text-center p-2 text-slate-500 font-medium">Q1</th>
                <th className="text-center p-2 text-slate-500 font-medium">Q2</th>
                <th className="text-center p-2 text-slate-500 font-medium">Q3</th>
                <th className="text-center p-2 text-slate-500 font-medium">Q4</th>
              </tr>
            </thead>
            <tbody>
              {data.heatmap?.map(row => (
                <tr key={row.branch_id} className="border-t border-slate-100">
                  <td className="p-2 font-medium text-slate-700 truncate max-w-[160px]">{row.name}</td>
                  {["Q1","Q2","Q3","Q4"].map(q => (
                    <td key={q} className="text-center p-2">
                      <span className="inline-block w-8 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: HEAT_COLOR(row[q]), color: row[q] >= 2 ? "#fff" : "#64748B" }}>
                        {row[q]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
