import { useState, useEffect } from "react";
import axios from "axios";
import { Compass, Warning, ChartLineUp, Lightning, CaretDown, CaretUp, Users, Star, Target, Funnel } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SEV_STYLE = { critical: "bg-red-50 text-red-700 border-red-200", moderate: "bg-amber-50 text-amber-700 border-amber-200", healthy: "bg-emerald-50 text-emerald-700 border-emerald-200" };
const SEV_DOT = { critical: "bg-red-500", moderate: "bg-amber-500", healthy: "bg-emerald-500" };
const COV_COLOR = (c) => c < 50 ? "#EF4444" : c < 80 ? "#F59E0B" : "#14B8A6";

const CLUSTER_ICONS = {
  "kredi-risk-yonetimi": "💳",
  "hazine-sermaye-piyasalari": "📊",
  "bireysel-bankacilik": "👤",
  "kurumsal-ticari-bankacilik": "🏢",
  "sube-operasyonlari": "🏦",
  "dijital-bankacilik": "💻",
  "uyum-mevzuat-hukuk": "⚖️",
  "veri-analitigi-bi": "📈",
  "musteri-deneyimi-crm": "🎯",
  "operasyon-sureç-yonetimi": "⚙️",
  "liderlik-yonetim": "👑",
  "davranissal-iletisim": "🗣️",
};

const CLUSTER_COLORS = [
  { bg: "bg-sky-50", border: "border-sky-200", accent: "text-sky-700", bar: "#0EA5E9" },
  { bg: "bg-violet-50", border: "border-violet-200", accent: "text-violet-700", bar: "#8B5CF6" },
  { bg: "bg-amber-50", border: "border-amber-200", accent: "text-amber-700", bar: "#F59E0B" },
  { bg: "bg-emerald-50", border: "border-emerald-200", accent: "text-emerald-700", bar: "#10B981" },
  { bg: "bg-rose-50", border: "border-rose-200", accent: "text-rose-700", bar: "#F43F5E" },
  { bg: "bg-teal-50", border: "border-teal-200", accent: "text-teal-700", bar: "#14B8A6" },
  { bg: "bg-indigo-50", border: "border-indigo-200", accent: "text-indigo-700", bar: "#6366F1" },
  { bg: "bg-orange-50", border: "border-orange-200", accent: "text-orange-700", bar: "#F97316" },
  { bg: "bg-cyan-50", border: "border-cyan-200", accent: "text-cyan-700", bar: "#06B6D4" },
  { bg: "bg-pink-50", border: "border-pink-200", accent: "text-pink-700", bar: "#EC4899" },
  { bg: "bg-lime-50", border: "border-lime-200", accent: "text-lime-700", bar: "#84CC16" },
  { bg: "bg-slate-50", border: "border-slate-300", accent: "text-slate-700", bar: "#64748B" },
];

const PROF_BAR_COLOR = (v) => v >= 4 ? "#10B981" : v >= 3 ? "#14B8A6" : v >= 2 ? "#F59E0B" : "#EF4444";
const KRITIKLIK_LABEL = { cekirdek: "Çekirdek", destek: "Destek", destekleyici: "Destekleyici", uzmanlik: "Uzmanlık", gelisen: "Gelişen" };
const KRITIKLIK_STYLE = { cekirdek: "bg-red-50 text-red-700", destek: "bg-slate-100 text-slate-600", destekleyici: "bg-slate-100 text-slate-600", uzmanlik: "bg-violet-50 text-violet-700", gelisen: "bg-sky-50 text-sky-700" };

function ClusterCard({ cluster, colorIdx, isExpanded, onToggle }) {
  const color = CLUSTER_COLORS[colorIdx % CLUSTER_COLORS.length];
  const icon = CLUSTER_ICONS[cluster.id] || "📋";
  const profColor = cluster.ort_yetkinlik >= 3.5 ? "text-emerald-600" : cluster.ort_yetkinlik >= 2.5 ? "text-amber-600" : "text-red-600";

  return (
    <div data-testid={`cluster-${cluster.id}`} className={`border rounded-lg overflow-hidden transition-all ${isExpanded ? `${color.border} shadow-sm` : "border-slate-200"}`}>
      <button
        onClick={onToggle}
        data-testid={`cluster-toggle-${cluster.id}`}
        className={`w-full text-left p-4 flex items-center justify-between transition-colors ${isExpanded ? color.bg : "bg-white hover:bg-slate-50"}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-slate-800">{cluster.ad}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-slate-500">{cluster.toplam_beceri} yetkinlik</span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="text-[10px] text-slate-500">{cluster.aktif_beceri} aktif</span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className={`text-[10px] font-semibold ${profColor}`}>Ort: {cluster.ort_yetkinlik}/5</span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                <Star size={9} weight="fill" className="text-amber-500" /> {cluster.toplam_uzman} uzman
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Mini proficiency bar */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-20 bg-slate-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full" style={{ width: `${(cluster.ort_yetkinlik / 5) * 100}%`, backgroundColor: PROF_BAR_COLOR(cluster.ort_yetkinlik) }} />
            </div>
          </div>
          {isExpanded ? <CaretUp size={14} className="text-slate-400" /> : <CaretDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 bg-white">
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium w-1/3">Yetkinlik</th>
                  <th className="text-center py-2 px-1 text-slate-500 font-medium">Kritiklik</th>
                  <th className="text-center py-2 px-1 text-slate-500 font-medium">Çalışan</th>
                  <th className="text-center py-2 px-1 text-slate-500 font-medium">Uzman</th>
                  <th className="text-center py-2 px-1 text-slate-500 font-medium">Başlangıç</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium w-1/4">Ort. Yetkinlik</th>
                </tr>
              </thead>
              <tbody>
                {cluster.beceriler.map((sk) => (
                  <tr key={sk.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors" data-testid={`skill-row-${sk.id}`}>
                    <td className="py-2 px-2">
                      <p className="font-medium text-slate-700">{sk.ad}</p>
                      {sk.aciklama && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{sk.aciklama}</p>}
                    </td>
                    <td className="text-center py-2 px-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${KRITIKLIK_STYLE[sk.kritiklik] || "bg-slate-100 text-slate-600"}`}>
                        {KRITIKLIK_LABEL[sk.kritiklik] || sk.kritiklik}
                      </span>
                    </td>
                    <td className="text-center py-2 px-1 text-slate-700 font-medium">{sk.count}</td>
                    <td className="text-center py-2 px-1">
                      <span className={`font-semibold ${sk.experts > 0 ? "text-emerald-600" : "text-slate-400"}`}>{sk.experts}</span>
                    </td>
                    <td className="text-center py-2 px-1">
                      <span className={`font-medium ${sk.beginners > 0 ? "text-amber-600" : "text-slate-400"}`}>{sk.beginners}</span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all" style={{ width: `${(sk.avg_proficiency / 5) * 100}%`, backgroundColor: PROF_BAR_COLOR(sk.avg_proficiency) }} />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-600 w-6 text-right">{sk.avg_proficiency}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkillsMapV2Page({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedClusters, setExpandedClusters] = useState(new Set());
  const [viewMode, setViewMode] = useState("clusters"); // "clusters" | "gaps" | "heatmap"

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/skills-map-v2?year=${year}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis } = data;
  const depts = data.heatmap_depts || [];
  const clusters = data.cluster_breakdown || [];

  const toggleCluster = (id) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedClusters(new Set(clusters.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedClusters(new Set());
  };

  return (
    <div data-testid="skills-map-v2-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Takip Edilen" value={kpis.tracked_skills} icon={Compass} color="blue" />
        <KPICard title="Kritik Açıklar" value={kpis.critical_gaps} icon={Warning} color="red" />
        <KPICard title="Ort. Karşılanma" value={kpis.avg_coverage > 100 ? 100 : kpis.avg_coverage} icon={ChartLineUp} color="amber" format="percent" />
        <KPICard title="Gelişen Yetkinlikler" value={kpis.emerging_skills} icon={Lightning} color="green" />
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { key: "clusters", label: "Yetkinlik Kümeleri", icon: Funnel },
          { key: "gaps", label: "Açık Analizi", icon: Target },
          { key: "heatmap", label: "Isı Haritası", icon: ChartLineUp },
        ].map((tab) => (
          <button
            key={tab.key}
            data-testid={`tab-${tab.key}`}
            onClick={() => setViewMode(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === tab.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon size={13} weight={viewMode === tab.key ? "duotone" : "regular"} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Clusters View */}
      {viewMode === "clusters" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-800">Bankacılık Yetkinlik Kümeleri</h3>
              <p className="text-xs text-slate-500">{clusters.length} küme · 175 yetkinlik · Bankacılık sektörü taksonomisi</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={expandAll} data-testid="expand-all-btn" className="px-2.5 py-1 rounded text-[10px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Tümünü Aç</button>
              <button onClick={collapseAll} data-testid="collapse-all-btn" className="px-2.5 py-1 rounded text-[10px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Tümünü Kapat</button>
            </div>
          </div>

          {/* Cluster summary bar chart */}
          <ChartCard title="Küme Bazlı Yetkinlik Ortalaması" subtitle="12 bankacılık yetkinlik kümesinin ortalama yetkinlik seviyesi" testId="chart-cluster-summary">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={clusters.map((c, i) => ({ name: c.ad.length > 18 ? c.ad.slice(0, 18) + '..' : c.ad, ort: c.ort_yetkinlik, uzman: c.toplam_uzman, fill: CLUSTER_COLORS[i % CLUSTER_COLORS.length].bar }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                <XAxis type="number" domain={[0, 5]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={140} />
                <Tooltip {...DARK_TOOLTIP} formatter={(v) => [`${v}/5`, "Ort. Yetkinlik"]} />
                <Bar dataKey="ort" barSize={12} radius={[0, 4, 4, 0]}>
                  {clusters.map((_, i) => (
                    <Cell key={i} fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length].bar} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Individual cluster cards */}
          {clusters.map((cluster, idx) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              colorIdx={idx}
              isExpanded={expandedClusters.has(cluster.id)}
              onToggle={() => toggleCluster(cluster.id)}
            />
          ))}
        </div>
      )}

      {/* Gaps View */}
      {viewMode === "gaps" && (
        <div className="space-y-4">
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
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Mevcut Kapasite</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />Gelecek Talep</span>
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
                      {gap.severity === "critical" ? "Kritik" : gap.severity === "moderate" ? "Orta" : "Sağlıklı"}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400">Mevcut</span>
                      <p className="text-sm font-bold text-slate-700">{gap.current_capacity}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Talep</span>
                      <p className="text-sm font-bold text-slate-700">{gap.future_demand}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Açık</span>
                      <p className="text-sm font-bold text-red-600">-{gap.gap}</p>
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400">Karşılanma</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, gap.coverage)}%`, backgroundColor: COV_COLOR(gap.coverage) }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: COV_COLOR(gap.coverage) }}>{gap.coverage}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-teal-50 border border-teal-200 rounded px-3 py-2 mt-1">
                    <p className="text-[10px] uppercase tracking-wider text-teal-600 font-medium mb-0.5">Önerilen Aksiyon</p>
                    <p className="text-xs text-teal-800">{gap.suggested_action}</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* Heatmap View */}
      {viewMode === "heatmap" && (
        <ChartCard title="Yetkinlik Karşılanma Isı Haritası" subtitle="Küme × Departman — ort. yetkinlik (yeşil ≥3.5, amber 2.5-3.5, kırmızı <2.5)" testId="chart-skill-heatmap">
          <div className="overflow-x-auto px-3 pb-2">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 text-slate-500 font-medium">Küme</th>
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
      )}
    </div>
  );
}
