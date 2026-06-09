import { useState, useEffect } from "react";
import axios from "axios";
import { Compass, Warning, TrendUp, Lightning, Cube } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PROF_COLORS = { 0: "#F1F5F9", 1: "#FEE2E2", 2: "#FED7AA", 3: "#FDE68A", 4: "#BBF7D0", 5: "#6EE7B7" };
const PROF_TEXT = { 0: "#94A3B8", 1: "#DC2626", 2: "#EA580C", 3: "#CA8A04", 4: "#16A34A", 5: "#059669" };

export default function SkillsMapPage({ year }) {
  const [data, setData] = useState(null);
  const [mobility, setMobility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/dashboard/skills-map?year=${year}`),
      axios.get(`${API}/dashboard/internal-mobility?year=${year}`)
    ]).then(([s, m]) => { setData(s.data); setMobility(m.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-500">Veri bulunamadı.</p>;

  return (
    <div data-testid="skills-map-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Unique Skills" value={data.total_unique_skills} icon={Cube} color="blue" />
        <KPICard title="Skill Gaps" value={data.skill_gaps?.length || 0} icon={Warning} color="red" subtitle="avg < 3.0" />
        <KPICard title="Critical Needs" value={data.critical_needs?.length || 0} icon={Lightning} color="amber" subtitle="urgent" />
        <KPICard title="Mobility Opps" value={mobility?.mobility_opportunities?.length || 0} icon={Compass} color="green" />
      </div>

      {/* Skill Heatmap */}
      <ChartCard title="Department Skill Heatmap" subtitle="Average proficiency by department (1-5 scale)" testId="chart-skill-heatmap">
        <div className="overflow-x-auto px-2 pb-2">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 text-slate-600 font-medium sticky left-0 bg-white z-10 min-w-[80px]">Dept</th>
                {data.heatmap_skills?.map(sk => (
                  <th key={sk} className="px-1 py-2 text-slate-500 font-medium min-w-[70px] text-center" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: 90 }}>{sk}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.department_heatmap?.map((row, ri) => (
                <tr key={ri} className="border-t border-slate-100">
                  <td className="py-1.5 px-2 font-medium text-slate-800 sticky left-0 bg-white z-10">{row.department}</td>
                  {data.heatmap_skills?.map(sk => {
                    const val = row[sk] || 0;
                    const rounded = Math.round(val);
                    return (
                      <td key={sk} className="px-1 py-1.5 text-center">
                        {val > 0 ? (
                          <span className="inline-block w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: PROF_COLORS[rounded], color: PROF_TEXT[rounded] }}>
                            {val}
                          </span>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Top Skills (by coverage)" testId="chart-top-skills">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.all_skills?.slice(0, 12)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="skill" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" name="Employees" fill="#0E7490" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Skill Category Distribution" testId="chart-skill-cats">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.category_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="category" strokeWidth={0}>
                {data.category_distribution?.map((entry, i) => <Cell key={`skcat-${entry.category}`} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 -mt-2">
            {data.category_distribution?.map((c, i) => (
              <span key={c.category} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />{c.category}: {c.count}
              </span>
            ))}
          </div>
          <div className="mt-6 px-4">
            <p className="text-xs font-medium text-slate-700 mb-2">Skill Gap Alerts</p>
            <div className="space-y-1.5">
              {data.skill_gaps?.slice(0, 5).map((g, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{g.skill}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${(g.avg_proficiency / 5) * 100}%`, backgroundColor: g.avg_proficiency < 2 ? '#EF4444' : '#F59E0B' }} />
                    </div>
                    <span className="text-slate-500 w-6">{g.avg_proficiency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Internal Mobility Opportunities" subtitle="Skills transferable between departments" testId="chart-mobility">
          <div className="space-y-2 px-3 pb-2 max-h-[380px] overflow-y-auto">
            {mobility?.mobility_opportunities?.slice(0, 10).map((opp, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700">{opp.skill}</span>
                  <span className="text-[10px] text-slate-400">{opp.to_need}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="font-medium text-emerald-700">{opp.from_dept}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-medium text-amber-700">{opp.to_dept}</span>
                  <span className="text-slate-400 ml-auto">{opp.available} available (avg {opp.from_avg})</span>
                </div>
              </div>
            ))}
            {(!mobility?.mobility_opportunities || mobility.mobility_opportunities.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-4">No mobility opportunities detected</p>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
