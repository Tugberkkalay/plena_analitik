import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Brain, User, MagnifyingGlass, Star, Lightning, GraduationCap, UsersThree, TrendUp, ArrowRight, MapPin, Clock, CheckCircle, Path, ArrowsLeftRight, CaretDown, CaretUp } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChartCard, { CHART_COLORS } from "@/components/ChartCard";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PROF_LABELS = { 1: "Farkında", 2: "Uygulayıcı", 3: "Yetkin", 4: "İleri", 5: "Uzman" };
const PROF_BG = { 1: "bg-red-50 text-red-700", 2: "bg-orange-50 text-orange-700", 3: "bg-amber-50 text-amber-700", 4: "bg-emerald-50 text-emerald-700", 5: "bg-teal-50 text-teal-800" };

const KADEME_COLORS = {
  1: { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-700", dot: "bg-slate-400" },
  2: { bg: "bg-sky-50", border: "border-sky-300", text: "text-sky-800", dot: "bg-sky-500" },
  3: { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-800", dot: "bg-teal-500" },
  4: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800", dot: "bg-amber-500" },
  5: { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-800", dot: "bg-rose-500" },
  6: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-800", dot: "bg-purple-500" },
};

function CareerLadder({ pathData, employeeBand }) {
  const [expandedStep, setExpandedStep] = useState(null);
  if (!pathData) return null;

  const steps = pathData.adimlar || [];
  const bandToKademe = { A: 1, B: 2, C: 3, D: 4, E: 5 };
  const empKademe = employeeBand ? (bandToKademe[employeeBand] || 0) : null;

  return (
    <div data-testid="career-ladder" className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
          <Path size={20} weight="duotone" className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{pathData.ad}</h3>
          <p className="text-xs text-slate-500">{pathData.aciklama}</p>
        </div>
      </div>
      {pathData.tur && (
        <span className="inline-block mt-2 mb-4 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wider">{pathData.tur} kariyer yolu</span>
      )}

      {/* Ladder Steps */}
      <div className="relative ml-4">
        {steps.map((step, idx) => {
          const colors = KADEME_COLORS[step.kademe_seviyesi] || KADEME_COLORS[1];
          const isCurrentLevel = empKademe !== null && step.kademe_seviyesi === empKademe;
          const isPast = empKademe !== null && step.kademe_seviyesi < empKademe;
          const isFuture = empKademe !== null && step.kademe_seviyesi > empKademe;
          const isExpanded = expandedStep === idx;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.rol_id} className="relative" data-testid={`career-step-${idx}`}>
              {/* Vertical line */}
              {!isLast && (
                <div className={`absolute left-[11px] top-[28px] w-0.5 h-full ${isPast ? "bg-teal-300" : isCurrentLevel ? "bg-teal-400" : "bg-slate-200"}`} style={{ zIndex: 0 }} />
              )}

              <div className="flex gap-3 relative" style={{ zIndex: 1 }}>
                {/* Circle indicator */}
                <div className="flex-shrink-0 mt-1">
                  {isCurrentLevel ? (
                    <div className="w-6 h-6 rounded-full bg-teal-600 border-2 border-teal-200 flex items-center justify-center shadow-sm shadow-teal-200">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  ) : isPast ? (
                    <div className="w-6 h-6 rounded-full bg-teal-100 border-2 border-teal-300 flex items-center justify-center">
                      <CheckCircle size={14} weight="fill" className="text-teal-600" />
                    </div>
                  ) : (
                    <div className={`w-6 h-6 rounded-full bg-white border-2 ${colors.border} flex items-center justify-center`}>
                      <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    </div>
                  )}
                </div>

                {/* Step card */}
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : idx)}
                  className={`flex-1 mb-3 p-3 rounded-lg border transition-all text-left ${
                    isCurrentLevel
                      ? "bg-teal-50 border-teal-300 ring-1 ring-teal-200"
                      : isPast
                      ? "bg-slate-50 border-slate-200 opacity-75"
                      : `${colors.bg} ${colors.border}`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isCurrentLevel ? "text-teal-800" : colors.text}`}>
                        {step.unvan}
                      </span>
                      {isCurrentLevel && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-600 text-white">MEVCUT</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {step.tipik_sure_ay && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock size={10} />
                          {step.tipik_sure_ay} ay
                        </span>
                      )}
                      {isExpanded ? <CaretUp size={12} className="text-slate-400" /> : <CaretDown size={12} className="text-slate-400" />}
                    </div>
                  </div>

                  {step.kisa_aciklama && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{step.kisa_aciklama}</p>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2" onClick={(e) => e.stopPropagation()}>
                      {step.kisa_aciklama && (
                        <p className="text-xs text-slate-600">{step.kisa_aciklama}</p>
                      )}
                      {step.gecis_kosullari?.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Geçiş Koşulları</p>
                          <ul className="space-y-1">
                            {step.gecis_kosullari.map((k, ki) => (
                              <li key={ki} className="flex items-start gap-1.5 text-xs text-slate-600">
                                <CheckCircle size={12} weight="duotone" className="text-teal-500 mt-0.5 flex-shrink-0" />
                                {k}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {step.gerekli_beceriler?.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Gerekli Yetkinlikler</p>
                          <div className="flex flex-wrap gap-1">
                            {step.gerekli_beceriler.map((sk) => (
                              <span key={sk.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">{sk.ad}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alternative paths */}
      {pathData.alternatif_yollar?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowsLeftRight size={12} className="text-slate-400" />
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Alternatif Kariyer Yolları</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pathData.alternatif_yollar.map((alt) => (
              <span key={alt.id} className="px-2 py-1 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                {alt.ad}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CareerPathBrowser() {
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [pathDetail, setPathDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/career-paths`).then((r) => {
      setPaths(r.data.career_paths || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadPathDetail = async (pathId) => {
    setSelectedPath(pathId);
    try {
      const res = await axios.get(`${API}/career-paths/${pathId}`);
      setPathDetail(res.data);
    } catch { setPathDetail(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" /></div>;

  // Group paths by aile (family)
  const grouped = {};
  paths.forEach((p) => {
    const fam = p.aile || "Diğer";
    if (!grouped[fam]) grouped[fam] = [];
    grouped[fam].push(p);
  });

  return (
    <div data-testid="career-path-browser" className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
          <MapPin size={20} weight="duotone" className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Kariyer Yolları Kataloğu</h3>
          <p className="text-xs text-slate-500">{paths.length} kariyer yolu · Bankacılık sektörü taksonomisi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Path selector */}
        <div className="lg:col-span-2 space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {Object.entries(grouped).map(([family, familyPaths]) => (
            <div key={family}>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5 px-1">{family}</p>
              <div className="space-y-1">
                {familyPaths.map((p) => (
                  <button
                    key={p.id}
                    data-testid={`path-btn-${p.id}`}
                    onClick={() => loadPathDetail(p.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-md border transition-all ${
                      selectedPath === p.id
                        ? "bg-teal-50 border-teal-300 ring-1 ring-teal-100"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className={`text-xs font-medium ${selectedPath === p.id ? "text-teal-800" : "text-slate-700"}`}>{p.ad}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.adimlar.length} adım · {p.tur}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Path detail view */}
        <div className="lg:col-span-3">
          {pathDetail ? (
            <CareerLadder pathData={pathDetail} employeeBand={null} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Path size={32} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Detayları görüntülemek için sol taraftan bir kariyer yolu seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CareerDevPage({ year }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [empCareerPath, setEmpCareerPath] = useState(null);

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
    setEmpCareerPath(null);
    try {
      const [planRes, pathsRes] = await Promise.all([
        axios.post(`${API}/employee/career-plan`, { employee_id: emp.id }, { timeout: 60000 }),
        axios.get(`${API}/career-paths?department=${encodeURIComponent(emp.department)}`)
      ]);
      setPlan(planRes.data);
      const paths = pathsRes.data.career_paths || [];
      if (paths.length > 0) {
        const detailRes = await axios.get(`${API}/career-paths/${paths[0].id}`);
        setEmpCareerPath(detailRes.data);
      }
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
          {/* Employee Profile + Radar + Mentors */}
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
              {/* Career Path summary */}
              <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-100">
                <p className="text-[10px] tracking-[0.15em] uppercase text-slate-500 font-medium mb-2">Sonraki Adım</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-teal-700 text-white">Band {plan.career_path.current_band}</span>
                  <ArrowRight size={14} className="text-slate-400" />
                  <span className="px-2 py-1 rounded text-xs font-bold bg-amber-500 text-white">Band {plan.career_path.next_band}</span>
                  <span className="text-xs text-slate-500 ml-1">{plan.career_path.next_title}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Tahmini Süre: {plan.career_path.timeline}</p>
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
                  {plan.employee.skills?.map((s) => (
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
                  <Radar name="Yetkinlik" dataKey="proficiency" stroke="#0E7490" fill="#0E7490" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={{ backgroundColor: "#FFF", border: "1px solid #E2E8F0", borderRadius: "8px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Mentors */}
            <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <UsersThree size={18} weight="duotone" className="text-teal-600" />
                <h3 className="text-sm font-medium text-slate-800">Önerilen Mentorlar</h3>
              </div>
              <div className="space-y-3">
                {plan.mentors?.length > 0 ? plan.mentors.map((m) => (
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

          {/* Career Path Ladder for this employee */}
          {empCareerPath && (
            <CareerLadder pathData={empCareerPath} employeeBand={plan.employee.band} />
          )}

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
        <>
          {/* Career Path Browser - shown when no employee is selected */}
          <CareerPathBrowser />
        </>
      )}
    </div>
  );
}
