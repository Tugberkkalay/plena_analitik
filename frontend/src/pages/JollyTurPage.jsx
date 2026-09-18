import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Users, Target, Star, ChartBar, TrendUp, TrendDown,
  ChartPie, ArrowRight, UserCircle, Buildings, Funnel,
  Export, MagnifyingGlass, Eye, ChartDonut
} from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api/jolly`;
const TENANT = "jollytur";
const NAVY = "#1F3864";
const NAVY_L = "#2D5299";
const SEG_COLORS = { "Yıldız": "#F59E0B", "Güçlü": "#14B8A6", "Beklenen": "#6366F1", "Gelişim Alanı": "#EF4444" };

const fmtTR = (v, dec = 1) => {
  if (v == null) return "-";
  return Number(v).toLocaleString("tr-TR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const TABS = [
  { key: "overview", label: "Genel Bakış", icon: ChartDonut },
  { key: "hedef", label: "Hedef Analizi", icon: Target },
  { key: "yetkinlik", label: "Yetkinlik Analizi", icon: ChartBar },
  { key: "kalibrasyon", label: "Kalibrasyon", icon: ChartPie },
  { key: "matris", label: "Yetenek Matrisi", icon: Star },
  { key: "karne", label: "Çalışan Karnesi", icon: UserCircle },
];

export default function JollyTurPage() {
  const [tab, setTab] = useState("overview");
  const [filters, setFilters] = useState({ bolgeler: [], subeler: [], roller: [] });
  const [bolge, setBolge] = useState("");
  const [sube, setSube] = useState("");
  const [rol, setRol] = useState("");

  useEffect(() => {
    axios.get(`${API}/filters?tenant=${TENANT}`).then(r => setFilters(r.data)).catch(() => {});
  }, []);

  const qStr = useMemo(() => {
    let q = `tenant=${TENANT}`;
    if (bolge) q += `&bolge=${encodeURIComponent(bolge)}`;
    if (sube) q += `&sube=${encodeURIComponent(sube)}`;
    if (rol) q += `&rol=${encodeURIComponent(rol)}`;
    return q;
  }, [bolge, sube, rol]);

  return (
    <div data-testid="jollytur-page" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>Jolly Tur — İK Performans Analitiği</h1>
          <p className="text-xs text-slate-500 mt-0.5">2026 Yıllık Değerlendirme Dönemi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterSelect label="Bölge" value={bolge} onChange={setBolge} options={filters.bolgeler} icon={Funnel} />
          <FilterSelect label="Şube" value={sube} onChange={setSube} options={filters.subeler} icon={Buildings} />
          <FilterSelect label="Rol" value={rol} onChange={setRol} options={filters.roller} icon={UserCircle} />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px" data-testid="jt-tabs">
        {TABS.map(t => (
          <button key={t.key} data-testid={`jt-tab-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-all whitespace-nowrap
              ${tab === t.key ? "text-white border-b-2" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
            style={tab === t.key ? { backgroundColor: NAVY, borderColor: NAVY } : {}}
          >
            <t.icon size={14} weight={tab === t.key ? "fill" : "regular"} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab qStr={qStr} />}
      {tab === "hedef" && <HedefTab qStr={qStr} />}
      {tab === "yetkinlik" && <YetkinlikTab qStr={qStr} />}
      {tab === "kalibrasyon" && <KalibrasyonTab qStr={qStr} />}
      {tab === "matris" && <MatrisTab qStr={qStr} />}
      {tab === "karne" && <KarneTab qStr={qStr} />}
    </div>
  );
}

/* ─── Shared filter dropdown ─── */
function FilterSelect({ label, value, onChange, options, icon: Icon }) {
  return (
    <Select value={value || "__all__"} onValueChange={v => onChange(v === "__all__" ? "" : v)}>
      <SelectTrigger className="h-8 text-xs w-[140px] border-slate-200" data-testid={`jt-filter-${label.toLowerCase()}`}>
        {Icon && <Icon size={13} className="text-slate-400 mr-1" />}
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">Tümü</SelectItem>
        {options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/* ─── Loader ─── */
function Loader() {
  return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: NAVY }} /></div>;
}

/* ─── 1. Genel Bakış ─── */
function OverviewTab({ qStr }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/overview?${qStr}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [qStr]);
  if (loading) return <Loader />;
  if (!data?.kpis?.calisan_sayisi) return <p className="text-slate-500 text-sm">Veri bulunamadı.</p>;
  const { kpis, segment_dist, skor_histogram, bolge_skor } = data;
  return (
    <div className="space-y-5" data-testid="jt-overview">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard title="Çalışan Sayısı" value={kpis.calisan_sayisi} icon={Users} color="blue" />
        <KPICard title="Ort. Toplam Skor" value={kpis.ort_toplam_skor} icon={ChartBar} color="blue" format="decimal" />
        <KPICard title="Ort. Hedef Gerçekleşme" value={kpis.ort_hedef_gerceklesme} icon={Target} color="green" format="decimal" />
        <KPICard title="Ort. Yetkinlik Skoru" value={kpis.ort_yetkinlik_skoru} icon={Star} color="amber" format="decimal" />
        <KPICard title="Yıldız Oranı" value={kpis.yildiz_orani} icon={TrendUp} color="amber" format="percent" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Segment Dağılımı" testId="jt-segment-pie">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={segment_dist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                   label={({ name, value }) => `${name} (${value})`} labelLine={false} stroke="none">
                {segment_dist.map((s, i) => <Cell key={i} fill={s.color || CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Toplam Skor Dağılımı" testId="jt-histogram">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={skor_histogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" name="Kişi" radius={[3, 3, 0, 0]} fill={NAVY} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Bölge Bazlı Ort. Toplam Skor" testId="jt-bolge-bar">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bolge_skor} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 110]} />
              <YAxis dataKey="bolge" type="category" tick={{ fill: "#64748B", fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => fmtTR(v)} />
              <Bar dataKey="ort_skor" name="Ort. Skor" radius={[0, 3, 3, 0]}>
                {bolge_skor.map((d, i) => <Cell key={i} fill={i === 0 ? "#14B8A6" : i === bolge_skor.length - 1 ? "#EF4444" : NAVY_L} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

/* ─── 2. Hedef Analizi ─── */
function HedefTab({ qStr }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/hedef-analizi?${qStr}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [qStr]);
  if (loading) return <Loader />;
  if (!data?.hedef_ort?.length) return <p className="text-slate-500 text-sm">Veri bulunamadı.</p>;

  const { hedef_ort, sube_siralama, scatter } = data;
  const top5 = sube_siralama.slice(0, 5);
  const bottom5 = [...sube_siralama].slice(-5).reverse();

  return (
    <div className="space-y-5" data-testid="jt-hedef">
      {/* Target average completion */}
      <ChartCard title="Hedef Bazlı Ortalama Gerçekleşme (%)" testId="jt-hedef-bar">
        <ResponsiveContainer width="100%" height={Math.max(280, hedef_ort.length * 28)}>
          <BarChart data={hedef_ort} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} domain={[0, 120]} axisLine={false} tickLine={false} />
            <YAxis dataKey="hedef" type="category" width={180} tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...DARK_TOOLTIP} formatter={(v) => `%${fmtTR(v)}`} />
            <Bar dataKey="ort_gerceklesme" name="Gerçekleşme %" radius={[0, 3, 3, 0]}>
              {hedef_ort.map((d, i) => <Cell key={i} fill={d.ort_gerceklesme < 80 ? "#EF4444" : d.ort_gerceklesme >= 100 ? "#14B8A6" : NAVY_L} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Branch ranking */}
        <ChartCard title="Şube Hedef Skor Sıralaması" subtitle="En iyi ve en düşük 5 şube" testId="jt-sube-rank">
          <div className="px-2 space-y-3">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">En İyi 5</p>
            {top5.map((s, i) => (
              <div key={s.sube} className="flex items-center gap-2">
                <span className="text-[10px] w-4 text-slate-400 font-mono">{i + 1}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(s.ort_hedef, 110)}%`, backgroundColor: "#14B8A6" }} />
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-slate-700">{s.sube}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 w-12 text-right">{fmtTR(s.ort_hedef)}</span>
              </div>
            ))}
            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mt-3">En Düşük 5</p>
            {bottom5.map((s, i) => (
              <div key={s.sube} className="flex items-center gap-2">
                <span className="text-[10px] w-4 text-slate-400 font-mono">{sube_siralama.length - 4 + i}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(s.ort_hedef, 110)}%`, backgroundColor: "#EF4444" }} />
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-slate-700">{s.sube}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 w-12 text-right">{fmtTR(s.ort_hedef)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Scatter: Ciro vs NPS */}
        <ChartCard title="Ciro Gerçekleşme vs NPS/Memnuniyet" subtitle="Satış baskısı memnuniyeti düşürüyor mu?" testId="jt-scatter">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="ciro_gerceklesme" name="Ciro %" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} type="number" />
              <YAxis dataKey="nps_gerceklesme" name="NPS %" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} type="number" />
              <ZAxis range={[40, 40]} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `%${fmtTR(v)}`}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow">
                      <p className="font-semibold text-slate-800">{d?.ad}</p>
                      <p className="text-slate-500">{d?.sube}</p>
                      <p>Ciro: <b>%{fmtTR(d?.ciro_gerceklesme)}</b></p>
                      <p>NPS: <b>%{fmtTR(d?.nps_gerceklesme)}</b></p>
                    </div>
                  );
                }}
              />
              <Scatter data={scatter} fill={NAVY} opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Heatmap as a table */}
      <HeatmapTable data={data.bolge_hedef_heatmap} rowKey="bolge" colKey="hedef" valKey="ort"
        title="Bölge × Hedef Gerçekleşme Isı Haritası (%)" testId="jt-hedef-heatmap" />
    </div>
  );
}

/* ─── 3. Yetkinlik Analizi ─── */
function YetkinlikTab({ qStr }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/yetkinlik-analizi?${qStr}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [qStr]);
  if (loading) return <Loader />;
  if (!data?.kategori_radar?.length) return <p className="text-slate-500 text-sm">Veri bulunamadı.</p>;

  return (
    <div className="space-y-5" data-testid="jt-yetkinlik">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <ChartCard title="Kategori Bazlı Ort. Yönetici Puanı" testId="jt-yetkinlik-radar">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data.kategori_radar}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="kategori" tick={{ fill: "#334155", fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fill: "#94a3b8", fontSize: 9 }} />
              <Radar name="Ort. Puan" dataKey="ort_puan" stroke={NAVY} fill={NAVY} fillOpacity={0.2} strokeWidth={2} />
              <Tooltip {...DARK_TOOLTIP} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Strongest & weakest */}
        <ChartCard title="En Güçlü & En Zayıf Yetkinlikler" testId="jt-guclu-zayif">
          <div className="px-3 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-2">En Güçlü 3</p>
              {data.en_guclu.map((y, i) => (
                <div key={y.yetkinlik} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600">{i + 1}</span>
                    <span className="text-xs text-slate-700">{y.yetkinlik}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">{fmtTR(y.ort_puan, 2)}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-2">En Zayıf 3</p>
              {data.en_zayif.map((y, i) => (
                <div key={y.yetkinlik} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-500">{i + 1}</span>
                    <span className="text-xs text-slate-700">{y.yetkinlik}</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{fmtTR(y.ort_puan, 2)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Role comparison */}
      <ChartCard title="Rol Bazlı Yetkinlik Ortalamaları" testId="jt-rol-karsilastirma">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.rol_karsilastirma}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis dataKey="rol" tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 5]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...DARK_TOOLTIP} formatter={(v) => fmtTR(v, 2)} />
            <Bar dataKey="ort_puan" name="Ort. Puan" radius={[3, 3, 0, 0]} fill={NAVY_L} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Heatmap */}
      <HeatmapTable data={data.yetkinlik_sube_heatmap} rowKey="yetkinlik" colKey="sube" valKey="ort_puan"
        title="Yetkinlik × Şube Isı Haritası (Yönetici Puanı)" testId="jt-yetkinlik-heatmap" maxVal={5} />
    </div>
  );
}

/* ─── 4. Kalibrasyon ─── */
function KalibrasyonTab({ qStr }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/kalibrasyon?${qStr}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [qStr]);
  if (loading) return <Loader />;
  if (!data?.sube_karsilastirma?.length) return <p className="text-slate-500 text-sm">Veri bulunamadı.</p>;

  return (
    <div className="space-y-5" data-testid="jt-kalibrasyon">
      {/* Self vs Manager by branch */}
      <ChartCard title="Şube Bazlı Öz Değerlendirme vs Yönetici Puanı" testId="jt-oz-yon">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.sube_karsilastirma}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis dataKey="sube" tick={{ fill: "#334155", fontSize: 9 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
            <YAxis domain={[0, 5]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...DARK_TOOLTIP} formatter={(v) => fmtTR(v, 2)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="oz_ort" name="Öz Değerlendirme" fill="#6366F1" radius={[3, 3, 0, 0]} />
            <Bar dataKey="yonetici_ort" name="Yönetici Puanı" fill={NAVY} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evaluator severity */}
        <ChartCard title="Değerlendirici Sertlik Analizi" subtitle="Şirket ortalamasından sapma" testId="jt-severity">
          <div className="px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Yönetici</TableHead>
                  <TableHead className="text-[10px] text-right">Ort. Puan</TableHead>
                  <TableHead className="text-[10px] text-right">Sapma</TableHead>
                  <TableHead className="text-[10px]">Profil</TableHead>
                  <TableHead className="text-[10px] text-right">Kişi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.degerlendirici_sapma.map(d => (
                  <TableRow key={d.sicil}>
                    <TableCell className="text-xs font-medium">{d.yonetici}</TableCell>
                    <TableCell className="text-xs text-right">{fmtTR(d.ort_puan, 2)}</TableCell>
                    <TableCell className={`text-xs text-right font-semibold ${d.sapma > 0.3 ? "text-emerald-600" : d.sapma < -0.3 ? "text-red-600" : "text-slate-500"}`}>
                      {d.sapma > 0 ? "+" : ""}{fmtTR(d.sapma, 2)}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                        ${d.tip === "Cömert" ? "bg-emerald-100 text-emerald-700" : d.tip === "Sert" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                        {d.tip}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right">{d.degerlendirilen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartCard>

        {/* Top 10 self-manager gap */}
        <ChartCard title="Öz-Yönetici Farkı En Yüksek 10 Çalışan" testId="jt-fark-top10">
          <div className="px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Çalışan</TableHead>
                  <TableHead className="text-[10px]">Şube</TableHead>
                  <TableHead className="text-[10px] text-right">Ort. Fark</TableHead>
                  <TableHead className="text-[10px]">Segment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.fark_top10.map(d => (
                  <TableRow key={d.sicil}>
                    <TableCell className="text-xs font-medium">{d.ad}</TableCell>
                    <TableCell className="text-xs">{d.sube}</TableCell>
                    <TableCell className={`text-xs text-right font-semibold ${d.ort_fark > 0 ? "text-amber-600" : "text-blue-600"}`}>
                      {d.ort_fark > 0 ? "+" : ""}{fmtTR(d.ort_fark, 2)}
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: SEG_COLORS[d.segment] + "20", color: SEG_COLORS[d.segment] }}>
                        {d.segment}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* ─── 5. Yetenek Matrisi (9-Box) ─── */
function MatrisTab({ qStr }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/yetenek-matrisi?${qStr}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [qStr]);
  if (loading) return <Loader />;
  if (!data?.matrix?.length) return <p className="text-slate-500 text-sm">Veri bulunamadı.</p>;

  // Build 3x3 grid (y=2 top row, y=0 bottom row)
  const getBox = (hx, yx) => data.matrix.find(m => m.hedef_dilim === hx && m.yetkinlik_dilim === yx);

  return (
    <div className="space-y-5" data-testid="jt-matris">
      <ChartCard title="9 Kutu Yetenek Matrisi" subtitle={`Eşikler — Hedef: ${data.thresholds?.hedef_low} / ${data.thresholds?.hedef_high} | Yetkinlik: ${data.thresholds?.yetkinlik_low} / ${data.thresholds?.yetkinlik_high}`} testId="jt-9box">
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] text-slate-400 -rotate-90 w-4">Yetkinlik</span>
            <div className="flex-1">
              {[2, 1, 0].map(yx => (
                <div key={yx} className="grid grid-cols-3 gap-1.5 mb-1.5">
                  {[0, 1, 2].map(hx => {
                    const box = getBox(hx, yx);
                    if (!box) return <div key={hx} />;
                    return (
                      <button key={hx} data-testid={`jt-box-${hx}-${yx}`}
                        onClick={() => setSelected(box)}
                        className="rounded-lg p-3 text-center transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer border"
                        style={{ backgroundColor: box.color + "18", borderColor: box.color + "40" }}>
                        <p className="text-2xl font-bold" style={{ color: box.color }}>{box.count}</p>
                        <p className="text-[9px] font-medium text-slate-600 mt-0.5 leading-tight">{box.label}</p>
                      </button>
                    );
                  })}
                </div>
              ))}
              <p className="text-center text-[10px] text-slate-400 mt-1">Hedef Skoru →</p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Box detail modal */}
      {selected && (
        <ChartCard title={`${selected.label} — ${selected.count} Çalışan`} testId="jt-box-detail">
          <div className="px-2 max-h-60 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Ad Soyad</TableHead>
                  <TableHead className="text-[10px]">Şube</TableHead>
                  <TableHead className="text-[10px] text-right">Hedef</TableHead>
                  <TableHead className="text-[10px] text-right">Yetkinlik</TableHead>
                  <TableHead className="text-[10px] text-right">Toplam</TableHead>
                  <TableHead className="text-[10px]">Segment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected.employees.map(e => (
                  <TableRow key={e.sicil}>
                    <TableCell className="text-xs font-medium">{e.ad}</TableCell>
                    <TableCell className="text-xs">{e.sube}</TableCell>
                    <TableCell className="text-xs text-right">{fmtTR(e.hedef)}</TableCell>
                    <TableCell className="text-xs text-right">{fmtTR(e.yetkinlik)}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">{fmtTR(e.toplam)}</TableCell>
                    <TableCell>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: SEG_COLORS[e.segment] + "20", color: SEG_COLORS[e.segment] }}>
                        {e.segment}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <button onClick={() => setSelected(null)} className="mx-3 mt-2 text-xs text-slate-500 hover:text-slate-800">Kapat</button>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Yüksek Potansiyel (Yıldız)" subtitle="Hedef & Yetkinlik üst dilim" testId="jt-high-pot">
          <div className="px-2 max-h-48 overflow-y-auto">
            {data.high_potential.length === 0 ? <p className="text-sm text-slate-400 p-3">Bu filtrede yüksek potansiyel yok</p> :
              data.high_potential.map(e => (
                <div key={e.sicil} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-800">{e.ad}</p>
                    <p className="text-[10px] text-slate-500">{e.sube}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-600">{fmtTR(e.toplam)}</span>
                </div>
              ))}
          </div>
        </ChartCard>
        <ChartCard title="Risk Listesi (Gelişim Gerekli)" subtitle="Hedef & Yetkinlik alt dilim" testId="jt-risk">
          <div className="px-2 max-h-48 overflow-y-auto">
            {data.risk_list.length === 0 ? <p className="text-sm text-slate-400 p-3">Bu filtrede risk yok</p> :
              data.risk_list.map(e => (
                <div key={e.sicil} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-800">{e.ad}</p>
                    <p className="text-[10px] text-slate-500">{e.sube}</p>
                  </div>
                  <span className="text-xs font-bold text-red-600">{fmtTR(e.toplam)}</span>
                </div>
              ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* ─── 6. Çalışan Karnesi ─── */
function KarneTab({ qStr }) {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [karne, setKarne] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/calisan-listesi?${qStr}`).then(r => setList(r.data.calisanlar || [])).catch(() => {}).finally(() => setLoading(false));
  }, [qStr]);

  const loadKarne = useCallback((sicil) => {
    setSelected(sicil);
    setKarne(null);
    axios.get(`${API}/calisan-karnesi/${sicil}?tenant=${TENANT}`).then(r => setKarne(r.data)).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(c => c.ad.toLowerCase().includes(s) || c.sube.toLowerCase().includes(s));
  }, [list, search]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-4" data-testid="jt-karne">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Employee list */}
        <ChartCard title="Çalışan Listesi" testId="jt-employee-list" className="lg:col-span-1">
          <div className="px-2">
            <div className="relative mb-2">
              <MagnifyingGlass size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Çalışan veya şube ara..."
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                data-testid="jt-karne-search" />
            </div>
            <div className="max-h-[420px] overflow-y-auto space-y-0.5">
              {filtered.map(c => (
                <button key={c.sicil} data-testid={`jt-emp-${c.sicil}`}
                  onClick={() => loadKarne(c.sicil)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-all flex items-center justify-between gap-1
                    ${selected === c.sicil ? "text-white" : "hover:bg-slate-50 text-slate-700"}`}
                  style={selected === c.sicil ? { backgroundColor: NAVY } : {}}>
                  <div className="truncate">
                    <span className="font-medium">{c.ad}</span>
                    <span className="text-slate-400 ml-1">{c.sube}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${selected === c.sicil ? "bg-white/20 text-white" : ""}`}
                    style={selected !== c.sicil ? { backgroundColor: SEG_COLORS[c.segment] + "20", color: SEG_COLORS[c.segment] } : {}}>
                    {fmtTR(c.toplam_skor)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Report card detail */}
        <div className="lg:col-span-2 space-y-4">
          {!karne ? (
            <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-md">
              <p className="text-sm text-slate-400">Listeden bir çalışan seçin</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-white border border-slate-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">{karne.karne.ad_soyad}</h2>
                    <p className="text-xs text-slate-500">{karne.karne.rol} — {karne.karne.sube} ({karne.karne.bolge})</p>
                  </div>
                  <span className="text-sm px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: SEG_COLORS[karne.karne.segment] + "20", color: SEG_COLORS[karne.karne.segment] }}>
                    {karne.karne.segment}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MiniStat label="Toplam Skor" value={fmtTR(karne.karne.toplam_skor)} />
                  <MiniStat label="Hedef Skoru" value={fmtTR(karne.karne.hedef_skoru)} />
                  <MiniStat label="Yetkinlik Skoru" value={fmtTR(karne.karne.yetkinlik_skoru)} />
                  <MiniStat label="Öz-Yönetici Farkı" value={fmtTR(karne.karne.oz_yonetici_farki, 2)} />
                </div>
              </div>

              {/* Comparison bar */}
              <ChartCard title="Karşılaştırma" testId="jt-karne-compare">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={[
                    { label: "Kişi", skor: karne.karsilastirma.kisi },
                    { label: "Şube Ort.", skor: karne.karsilastirma.sube },
                    { label: "Bölge Ort.", skor: karne.karsilastirma.bolge },
                    { label: "Şirket Ort.", skor: karne.karsilastirma.sirket },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                    <XAxis dataKey="label" tick={{ fill: "#334155", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 110]} />
                    <Tooltip {...DARK_TOOLTIP} formatter={(v) => fmtTR(v)} />
                    <Bar dataKey="skor" name="Toplam Skor" radius={[3, 3, 0, 0]}>
                      {[NAVY, "#6366F1", "#14B8A6", "#94A3B8"].map((c, i) => <Cell key={i} fill={c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Target table */}
              <ChartCard title="Hedef Kartı" testId="jt-karne-hedef">
                <div className="px-2 max-h-56 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px]">Hedef</TableHead>
                        <TableHead className="text-[10px] text-right">Ağırlık</TableHead>
                        <TableHead className="text-[10px] text-right">Hedef Değer</TableHead>
                        <TableHead className="text-[10px] text-right">Gerçekleşen</TableHead>
                        <TableHead className="text-[10px] text-right">%</TableHead>
                        <TableHead className="text-[10px] text-right">A.Skor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {karne.hedefler.map((h, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{h.hedef}</TableCell>
                          <TableCell className="text-xs text-right">%{h.agirlik}</TableCell>
                          <TableCell className="text-xs text-right">{h.hedef_deger >= 1000 ? Number(h.hedef_deger).toLocaleString("tr-TR") : fmtTR(h.hedef_deger)}</TableCell>
                          <TableCell className="text-xs text-right">{h.gerceklesen >= 1000 ? Number(h.gerceklesen).toLocaleString("tr-TR") : fmtTR(h.gerceklesen)}</TableCell>
                          <TableCell className={`text-xs text-right font-semibold ${h.gerceklesme >= 100 ? "text-emerald-600" : h.gerceklesme < 80 ? "text-red-600" : "text-slate-700"}`}>
                            %{fmtTR(h.gerceklesme)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium">{fmtTR(h.agirlikli_skor)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ChartCard>

              {/* Competency radar */}
              <ChartCard title="Yetkinlik Puanları (Öz vs Yönetici)" testId="jt-karne-radar">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={karne.yetkinlik_radar}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="yetkinlik" tick={{ fill: "#334155", fontSize: 8 }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                    <Radar name="Öz Değerlendirme" dataKey="oz" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Yönetici Puanı" dataKey="yonetici" stroke={NAVY} fill={NAVY} fillOpacity={0.15} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip {...DARK_TOOLTIP} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function MiniStat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-md p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">{label}</p>
      <p className="text-lg font-bold mt-0.5" style={{ color: NAVY }}>{value}</p>
    </div>
  );
}

function HeatmapTable({ data, rowKey, colKey, valKey, title, testId, maxVal = 120 }) {
  if (!data?.length) return null;
  const rows = [...new Set(data.map(d => d[rowKey]))].sort();
  const cols = [...new Set(data.map(d => d[colKey]))].sort();
  const lookup = {};
  data.forEach(d => { lookup[`${d[rowKey]}__${d[colKey]}`] = d[valKey]; });

  const getColor = (v) => {
    if (v == null) return "#f8fafc";
    const ratio = Math.min(v / maxVal, 1);
    if (ratio >= 0.85) return "#d1fae5";
    if (ratio >= 0.7) return "#ecfdf5";
    if (ratio >= 0.55) return "#fff7ed";
    return "#fef2f2";
  };

  return (
    <ChartCard title={title} testId={testId}>
      <div className="overflow-x-auto px-1">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="p-1 text-left text-slate-500 font-medium sticky left-0 bg-white z-10" />
              {cols.map(c => <th key={c} className="p-1 text-center text-slate-500 font-medium whitespace-nowrap">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r}>
                <td className="p-1 font-medium text-slate-700 whitespace-nowrap sticky left-0 bg-white z-10">{r}</td>
                {cols.map(c => {
                  const v = lookup[`${r}__${c}`];
                  return (
                    <td key={c} className="p-1 text-center font-medium rounded-sm" style={{ backgroundColor: getColor(v) }}>
                      {v != null ? fmtTR(v) : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
