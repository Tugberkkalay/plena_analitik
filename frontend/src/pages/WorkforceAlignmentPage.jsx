import { useState, useEffect } from "react";
import axios from "axios";
import { Strategy, Target, Warning, CheckCircle, Lightning, Crosshair } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = { "On Track": "#14B8A6", "At Risk": "#F59E0B", "Critical": "#EF4444" };
const STATUS_BG = { "On Track": "bg-emerald-50 border-emerald-200 text-emerald-700", "At Risk": "bg-amber-50 border-amber-200 text-amber-700", "Critical": "bg-red-50 border-red-200 text-red-700" };
const PRIORITY_BG = { "Critical": "bg-red-100 text-red-800", "High": "bg-amber-100 text-amber-800", "Medium": "bg-blue-100 text-blue-800" };
const SKILL_DOT = { "Strong": "bg-emerald-500", "Adequate": "bg-amber-500", "Gap": "bg-red-500" };

export default function WorkforceAlignmentPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedObj, setExpandedObj] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/workforce-alignment?year=${year}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">No data available.</p>;

  const { kpis, objectives } = data;

  const radarData = objectives.map(o => ({
    name: o.name.split(" ").slice(0, 2).join(" "),
    readiness: o.overall_readiness,
    skill: o.skill_fulfillment,
    headcount: o.hc_fulfillment,
  }));

  return (
    <div data-testid="workforce-alignment-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Objectives" value={kpis.total_objectives} icon={Target} color="blue" />
        <KPICard title="Overall Readiness" value={kpis.overall_readiness} icon={CheckCircle} color="green" format="percent" />
        <KPICard title="On Track" value={kpis.on_track} icon={Lightning} color="green" />
        <KPICard title="At Risk" value={kpis.at_risk_count} icon={Warning} color="red" />
        <KPICard title="Skill Gaps" value={kpis.total_skill_gaps} icon={Crosshair} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Readiness Overview" testId="chart-readiness-radar" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 9 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 9 }} />
              <Radar name="Overall Readiness" dataKey="readiness" stroke="#0E7490" fill="#0E7490" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Skill Coverage" dataKey="skill" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Readiness</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500" />Skill %</span>
          </div>
        </ChartCard>

        <ChartCard title="Readiness by Objective" testId="chart-readiness-bars" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={objectives} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
              <Bar dataKey="skill_fulfillment" name="Skill Readiness" fill="#14B8A6" radius={[0, 0, 0, 0]} stackId="a" barSize={16} />
              <Bar dataKey="hc_fulfillment" name="HC Readiness" fill="#0E7490" radius={[0, 3, 3, 0]} stackId="b" barSize={16} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500" />Skill Readiness</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />HC Readiness</span>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Strategic Objectives Detail" subtitle="Click to expand skill coverage" testId="chart-objectives-detail">
        <div className="space-y-3 px-3 pb-2">
          {objectives.map((obj) => (
            <div key={obj.id} data-testid={`objective-${obj.id}`}
              className="border border-slate-200 rounded-md overflow-hidden hover:border-slate-300 transition-colors">
              <div className="p-4 cursor-pointer" onClick={() => setExpandedObj(expandedObj === obj.id ? null : obj.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-slate-800">{obj.name}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${PRIORITY_BG[obj.priority]}`}>{obj.priority}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${STATUS_BG[obj.status]}`}>{obj.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{obj.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                      <span>Timeline: {obj.timeline}</span>
                      <span>HC: {obj.current_headcount}/{obj.required_headcount}</span>
                      <span>Skill Gaps: {obj.gap_count}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="relative w-14 h-14">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke={STATUS_COLORS[obj.status]}
                          strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={`${(obj.overall_readiness / 100) * 150.8} 150.8`} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                        {Math.round(obj.overall_readiness)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {expandedObj === obj.id && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-2 mt-3">Skill Coverage</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {obj.skill_coverage.map((sc) => (
                      <div key={sc.skill} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${SKILL_DOT[sc.status]}`} />
                          <span className="text-xs text-slate-700">{sc.skill}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-slate-800">{sc.holders}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({sc.avg_proficiency}/5)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
