import { useState, useEffect } from "react";
import axios from "axios";
import { Compass, Warning, ChartLineUp, Lightning } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SEV_STYLE = { critical: "bg-red-50 text-red-700 border-red-200", moderate: "bg-amber-50 text-amber-700 border-amber-200", healthy: "bg-emerald-50 text-emerald-700 border-emerald-200" };
const SEV_DOT = { critical: "bg-red-500", moderate: "bg-amber-500", healthy: "bg-emerald-500" };
const COV_COLOR = (c) => c < 50 ? "#EF4444" : c < 80 ? "#F59E0B" : "#14B8A6";

export default function SkillsMapV2Page({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/skills-map-v2?year=${year}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis } = data;
  const depts = data.heatmap_depts || [];

  return (
    <div data-testid="skills-map-v2-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Takip Edilen" value={kpis.tracked_skills} icon={Compass} color="blue" />
        <KPICard title="Kritik Açıklar" value={kpis.critical_gaps} icon={Warning} color="red" />
        <KPICard title="Ort. Karşılanma" value={kpis.avg_coverage > 100 ? 100 : kpis.avg_coverage} icon={ChartLineUp} color="amber" format="percent" />
        <KPICard title="Gelişen Yetkinlikler" value={kpis.emerging_skills} icon={Lightning} color="green" />
      </div>

      {/* Demand-Supply Bar */}
      <ChartCard title="Yetkinlik Arz vs Talep" subtitle="Açık büyüklüğüne göre (yetkin çalışan vs stratejik talep)" testId="chart-demand-supply">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.demand_supply} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="skill" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={120} />
            <Tooltip {...DARK_TOOLTIP} />
            <Bar dataKey="current_capacity" name="Mevcut Kapasite" fill="#0E7490" barSize={10} radius={[0, 3, 3, 0]} />
            <Bar dataKey="future_demand" name="Gelecek Talep" fill="#E2E8F0" barSize={10} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Current Capacity</span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />Future Demand</span>
        </div>
      </ChartCard>

      {/* Heatmap */}
      <ChartCard title="Yetkinlik Karşılanma Isı Haritası" subtitle="Kategori × Departman — ort. yetkinlik (yeşil ≥3.5, amber 2.5-3.5, kırmızı <2.5)" testId="chart-skill-heatmap">
        <div className="overflow-x-auto px-3 pb-2">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 text-slate-500 font-medium">Kategori</th>
                {depts.map(d => <th key={d} className="text-center p-2 text-slate-500 font-medium">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.heatmap?.map((row) => (
                <tr key={row.category} className="border-t border-slate-100">
                  <td className="p-2 font-medium text-slate-700">{row.category}</td>
                  {depts.map(d => {
                    const val = row[d] || 0;
                    const bg = val >= 3.5 ? "bg-emerald-100 text-emerald-800" : val >= 2.5 ? "bg-amber-100 text-amber-800" : val > 0 ? "bg-red-100 text-red-800" : "bg-slate-50 text-slate-300";
                    return <td key={d} className={`text-center p-2 rounded ${bg} font-semibold`}>{val > 0 ? val : "—"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Priority Skill Gaps */}
      <ChartCard title="Öncelikli Yetkinlik Açıkları" subtitle="Talebin altında kalan yetkinlikler — önerilen kapatma yolu ile" testId="chart-skill-gaps">
        <div className="space-y-2 px-3 pb-2 max-h-[500px] overflow-y-auto">
          {data.gaps?.filter(g => g.severity !== "healthy").map((gap, i) => (
            <div key={gap.skill} data-testid={`skill-gap-${i}`}
              className="p-3 border border-slate-200 rounded-md hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${SEV_DOT[gap.severity]}`} />
                  <span className="text-sm font-medium text-slate-800">{gap.skill}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{gap.category}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${SEV_STYLE[gap.severity]}`}>
                  {gap.severity}
                </span>
              </div>
              <div className="flex items-center gap-6 mb-2">
                <div>
                  <span className="text-[10px] text-slate-400">Current</span>
                  <p className="text-sm font-bold text-slate-700">{gap.current_capacity}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Demand</span>
                  <p className="text-sm font-bold text-slate-700">{gap.future_demand}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Gap</span>
                  <p className="text-sm font-bold text-red-600">-{gap.gap}</p>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400">Coverage</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, gap.coverage)}%`, backgroundColor: COV_COLOR(gap.coverage) }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: COV_COLOR(gap.coverage) }}>{gap.coverage}%</span>
                  </div>
                </div>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded px-3 py-2 mt-1">
                <p className="text-[10px] uppercase tracking-wider text-teal-600 font-medium mb-0.5">Suggested Action</p>
                <p className="text-xs text-teal-800">{gap.suggested_action}</p>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
