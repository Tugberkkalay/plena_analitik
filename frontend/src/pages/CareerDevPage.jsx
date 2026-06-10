import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Brain, User, MagnifyingGlass, Star, Lightning, GraduationCap, UsersThree, TrendUp, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChartCard, { CHART_COLORS } from "@/components/ChartCard";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PROF_LABELS = { 1: "Beginner", 2: "Developing", 3: "Proficient", 4: "Advanced", 5: "Expert" };
const PROF_BG = { 1: "bg-red-50 text-red-700", 2: "bg-orange-50 text-orange-700", 3: "bg-amber-50 text-amber-700", 4: "bg-emerald-50 text-emerald-700", 5: "bg-teal-50 text-teal-800" };

export default function CareerDevPage({ year }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchEmployees = useCallback(async (q) => {
    if (!q || q.length < 2) { setEmployees([]); return; }
    setSearching(true);
    try {
      const res = await axios.get(`${API}/employees/search?q=${encodeURIComponent(q)}&limit=10`);
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error("Employee search error:", err);
      setEmployees([]);
    }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchEmployees(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchEmployees]);

  const generatePlan = async (emp) => {
    setSelectedEmp(emp);
    setEmployees([]);
    setSearchQuery(emp.name);
    setLoading(true);
    setPlan(null);
    try {
      const res = await axios.post(`${API}/employee/career-plan`, { employee_id: emp.id }, { timeout: 60000 });
      setPlan(res.data);
    } catch (_) { /* silenced */ }
    finally { setLoading(false); }
  };

  const radarData = plan?.employee?.skills?.map(s => ({ skill: s.skill.length > 12 ? s.skill.slice(0, 12) + '..' : s.skill, proficiency: s.proficiency, fullMark: 5 })) || [];

  return (
    <div data-testid="career-dev-page" className="space-y-6">
      {/* Search Section */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
            <Brain size={22} weight="duotone" className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI Kariyer Gelişim Planı</h2>
            <p className="text-xs text-slate-500">Kişiselleştirilmiş kariyer önerileri için çalışan arayın</p>
          </div>
        </div>
        <div className="relative max-w-lg">
          <MagnifyingGlass size={16} className="absolute left-3 top-3 text-slate-400" />
          <Input data-testid="employee-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Çalışan adı arayın..." className="pl-9 bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400" />
          {employees.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {employees.map((emp) => (
                <button key={emp.id} onClick={() => generatePlan(emp)} data-testid={`emp-option-${emp.id}`}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                    {emp.name?.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.department} · {emp.job_title} · Band {emp.band}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
          <p className="text-sm text-slate-500">AI kariyer yolunu analiz ediyor...</p>
        </div>
      )}

      {plan && !loading && (
        <>
          {/* Employee Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-teal-700 text-lg font-bold">
                  {plan.employee.name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{plan.employee.name}</h3>
                  <p className="text-xs text-slate-500">{plan.employee.department} · {plan.employee.job_title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700">Band {plan.employee.band}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">Perf: {plan.employee.performance_score}/5</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">{plan.employee.seniority_years} yıl</span>
                  </div>
                </div>
              </div>
              {/* Career Path */}
              <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-100">
                <p className="text-[10px] tracking-[0.15em] uppercase text-slate-500 font-medium mb-2">Kariyer Yolu</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-teal-700 text-white">Band {plan.career_path.current_band}</span>
                  <ArrowRight size={14} className="text-slate-400" />
                  <span className="px-2 py-1 rounded text-xs font-bold bg-amber-500 text-white">Band {plan.career_path.next_band}</span>
                  <span className="text-xs text-slate-500 ml-1">{plan.career_path.next_title}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Süre: {plan.career_path.timeline}</p>
              </div>
              {/* Skill Analysis */}
              <div className="mt-4">
                <p className="text-[10px] tracking-[0.15em] uppercase text-slate-500 font-medium mb-2">Yetkinlik Özeti</p>
                <div className="flex items-center gap-4 text-xs mb-3">
                  <span className="text-slate-600">Toplam: <strong>{plan.skill_analysis.total}</strong></span>
                  <span className="text-emerald-600">Güçlü: <strong>{plan.skill_analysis.strong.length}</strong></span>
                  <span className="text-red-600">Zayıf: <strong>{plan.skill_analysis.weak.length}</strong></span>
                  <span className="text-slate-600">Ort: <strong>{plan.skill_analysis.avg_proficiency}/5</strong></span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.employee.skills?.map((s, i) => (
                    <span key={`skill-${s.skill}`} className={`px-2 py-0.5 rounded text-[10px] font-medium ${PROF_BG[s.proficiency]}`}>
                      {s.skill} ({s.proficiency})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <ChartCard title="Yetkinlik Radarı" testId="chart-competency-radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#64748B", fontSize: 8 }} />
                  <Radar name="Proficiency" dataKey="proficiency" stroke="#0E7490" fill="#0E7490" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={{ backgroundColor: "#FFF", border: "1px solid #E2E8F0", borderRadius: "8px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Mentors */}
            <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <UsersThree size={18} weight="duotone" className="text-teal-600" />
                <h3 className="text-sm font-medium text-slate-800">Recommended Mentors</h3>
              </div>
              <div className="space-y-3">
                {plan.mentors?.length > 0 ? plan.mentors.map((m, i) => (
                  <div key={`mentor-${m.name}`} className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-bold">
                        {m.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{m.name}</p>
                        <p className="text-[10px] text-slate-500">{m.department} · {m.job_title} · Band {m.band}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.matching_skills?.map((s, j) => (
                        <span key={j} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700">{s.skill} ({s.proficiency}/5)</span>
                      ))}
                    </div>
                  </div>
                )) : <p className="text-xs text-slate-400 text-center py-4">Mevcut yetkinlik açıkları için mentor bulunamadı</p>}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          {plan.ai_recommendations && (
            <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={20} weight="duotone" className="text-teal-600" />
                <h3 className="text-base font-semibold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI Destekli Gelişim Önerileri</h3>
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                {plan.ai_recommendations}
              </div>
            </div>
          )}
        </>
      )}

      {!plan && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <User size={32} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">Kariyer gelişim planı oluşturmak için çalışan arayın ve seçin</p>
        </div>
      )}
    </div>
  );
}
