import { useState, useEffect } from "react";
import axios from "axios";
import { ArrowsLeftRight, UserCirclePlus, Clock, UserSwitch, MagnifyingGlass } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { DARK_TOOLTIP } from "@/components/ChartCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FIT_COLOR = (s) => s >= 85 ? "#0E7490" : s >= 70 ? "#14B8A6" : s >= 55 ? "#F59E0B" : "#94A3B8";
const FIT_BG = (s) => s >= 85 ? "bg-teal-50 border-teal-200 text-teal-800" : s >= 70 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : s >= 55 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-600";
const DAYS_STYLE = (d) => d > 30 ? "bg-red-50 text-red-700" : d > 10 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";

export default function InternalMobilityPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPos, setSelectedPos] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/positions?year=${year}`)
      .then((r) => {
        setData(r.data);
        if (r.data.positions?.length > 0) {
          const firstPos = r.data.positions[0];
          setSelectedPos(firstPos);
          setMatchLoading(true);
          axios.get(`${API}/dashboard/positions/${firstPos.id}/matches?year=${year}`)
            .then((mr) => setMatches(mr.data.matches || []))
            .catch(() => setMatches([]))
            .finally(() => setMatchLoading(false));
        }
      }).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  const loadMatches = async (pos) => {
    setSelectedPos(pos);
    setMatchLoading(true);
    try {
      const res = await axios.get(`${API}/dashboard/positions/${pos.id}/matches?year=${year}`);
      setMatches(res.data.matches || []);
    } catch (_) { setMatches([]); }
    finally { setMatchLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis, positions } = data;
  const deptShort = (d) => d.replace("Information Technology","IT").replace("Human Resources","HR").replace("Research & Development","R&D");

  return (
    <div data-testid="internal-mobility-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Açık Pozisyon" value={kpis.open_roles} icon={UserCirclePlus} color="blue" />
        <KPICard title="İç Uyum" value={kpis.internal_fit} icon={ArrowsLeftRight} color="green" format="percent" />
        <KPICard title="Ort. Dolum Süresi" value={kpis.avg_time_to_fill} icon={Clock} color="amber" format="decimal" subtitle="gün" />
        <KPICard title="İçeriden Doldurulan" value={kpis.filled_internally} icon={UserSwitch} color="green" subtitle="YTD" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Position Selector */}
        <ChartCard title="Açık Pozisyonlar" subtitle={`${positions.length} açık rol`} testId="chart-positions-list">
          <div className="space-y-1.5 px-3 pb-2 max-h-[500px] overflow-y-auto">
            {positions.map((pos) => (
              <div key={pos.id} data-testid={`position-${pos.id}`}
                onClick={() => loadMatches(pos)}
                className={`p-2.5 border rounded-md cursor-pointer transition-colors ${
                  selectedPos?.id === pos.id ? "bg-teal-50 border-teal-300" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{pos.title}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${DAYS_STYLE(pos.days_open)}`}>
                    {pos.days_open}d
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{deptShort(pos.department)}</span>
                  <span>·</span>
                  <span>{pos.location}</span>
                  <span>·</span>
                  <span>Band {pos.target_band}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {pos.required_skills.slice(0, 4).map(sk => (
                    <span key={sk} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600">{sk}</span>
                  ))}
                  {pos.required_skills.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-400">+{pos.required_skills.length - 4}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Candidate Matches */}
        <ChartCard title={selectedPos ? `Eşleşmeler: ${selectedPos.title}` : "Pozisyon Seçin"} 
          subtitle={selectedPos ? `${deptShort(selectedPos.department)} · ${selectedPos.location} · Band ${selectedPos.target_band}` : ""}
          className="lg:col-span-2" testId="chart-matches">
          {matchLoading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" /></div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <MagnifyingGlass size={28} className="mb-2" />
              <p className="text-sm">Eşleşen aday bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-2 px-3 pb-2 max-h-[500px] overflow-y-auto">
              {matches.map((m, i) => (
                <div key={m.employee_id} data-testid={`match-${i}`}
                  className="p-3 border border-slate-200 rounded-md hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600">
                        {m.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.department} · {m.job_title} · Band {m.band}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-sm font-bold border ${FIT_BG(m.fit_score)}`}>
                        {m.fit_score}%
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">Fit Score</p>
                    </div>
                  </div>
                  {/* Skill tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {m.matched_skills?.map(sk => (
                      <span key={sk.skill} className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {sk.skill} ({sk.proficiency}/5)
                      </span>
                    ))}
                    {m.missing_skills?.map(sk => (
                      <span key={sk} className="px-1.5 py-0.5 rounded text-[9px] bg-red-50 text-red-600 border border-red-200">
                        {sk}
                      </span>
                    ))}
                  </div>
                  {/* Metrics row */}
                  <div className="flex items-center gap-4 text-[10px] text-slate-400">
                    <span>Perf: <strong className="text-slate-700">{m.performance}/5</strong></span>
                    <span>Skill Match: <strong className="text-slate-700">{m.skill_overlap}%</strong></span>
                    <span>Mobility: {m.mobility_ready ? <strong className="text-emerald-600">Ready</strong> : <strong className="text-slate-500">Not flagged</strong>}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
