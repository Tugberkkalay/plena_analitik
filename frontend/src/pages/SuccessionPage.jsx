import { useState, useEffect } from "react";
import axios from "axios";
import { ShieldWarning, Users, Warning, UserSwitch, CheckCircle } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const RISK_COLOR = { Critical: "#EF4444", High: "#F97316", Medium: "#F59E0B", Low: "#14B8A6" };
const RISK_BG = { Critical: "bg-red-50 border-red-100", High: "bg-orange-50 border-orange-100", Medium: "bg-amber-50 border-amber-100", Low: "bg-emerald-50 border-emerald-100" };
const RISK_TEXT = { Critical: "text-red-700", High: "text-orange-700", Medium: "text-amber-700", Low: "text-emerald-700" };

export default function SuccessionPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/succession?year=${year}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-500">Veri bulunamadı.</p>;

  const { kpis } = data;
  return (
    <div data-testid="succession-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Kritik Roller" value={kpis.critical_roles} icon={Users} color="blue" />
        <KPICard title="Halef Yok" value={kpis.no_successor} icon={Warning} color="red" />
        <KPICard title="Yüksek Bilgi Riski" value={kpis.high_knowledge_risk} icon={ShieldWarning} color="amber" />
        <KPICard title="Ort. Hazırlık" value={kpis.avg_readiness} icon={CheckCircle} color="green" format="percent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Knowledge Risk Distribution" testId="chart-risk-dist">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.risk_summary} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="count" nameKey="level" strokeWidth={0}>
                {data.risk_summary?.map((e) => <Cell key={e.level} fill={RISK_COLOR[e.level]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#FFF", border: "1px solid #E2E8F0", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 -mt-2">
            {data.risk_summary?.map((r) => (
              <span key={r.level} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLOR[r.level] }} />{r.level}: {r.count}
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Halef Haritası" subtitle="Bilgi riskine göre sıralı kritik roller" className="lg:col-span-2" testId="chart-succession-map">
          <div className="space-y-2 px-3 pb-2 max-h-[400px] overflow-y-auto">
            {data.succession_map?.slice(0, 12).map((role, i) => (
              <div key={i} className={`p-3 border rounded-md ${RISK_BG[role.risk_level]}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                      {role.name?.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{role.name}</p>
                      <p className="text-[10px] text-slate-500">{role.department} · {role.job_title} · Band {role.band} · {role.seniority}yrs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${RISK_TEXT[role.risk_level]}`}>{role.knowledge_risk}%</span>
                      <ShieldWarning size={14} style={{ color: RISK_COLOR[role.risk_level] }} />
                    </div>
                    <p className="text-[10px] text-slate-400">{role.successor_count} successor{role.successor_count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {role.successors?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1 ml-10">
                    {role.successors.map((s, j) => (
                      <span key={j} className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-700">
                        <UserSwitch size={10} className="inline mr-1" weight="bold" />{s.name} ({s.readiness}% ready)
                      </span>
                    ))}
                  </div>
                )}
                {role.successors?.length === 0 && (
                  <p className="text-[10px] text-red-500 ml-10 mt-1 font-medium">Halef belirlenmedi</p>
                )}
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
