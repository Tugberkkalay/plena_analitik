import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Users, Target, Star, ChartBar, TrendUp, TrendDown,
  ChartPie, ArrowRight, UserCircle, Buildings, Funnel,
  Export, MagnifyingGlass, Eye, ChartDonut, MapPin
} from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { exportToExcel } from "@/lib/exportToExcel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

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
  { key: "harita", label: "Şube Haritası", icon: MapPin },
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

      {tab === "overview" && <OverviewTab qStr={qStr} />}
      {tab === "hedef" && <HedefTab qStr={qStr} />}
      {tab === "yetkinlik" && <YetkinlikTab qStr={qStr} />}
      {tab === "kalibrasyon" && <KalibrasyonTab qStr={qStr} />}
      {tab === "matris" && <MatrisTab qStr={qStr} />}
      {tab === "karne" && <KarneTab qStr={qStr} />}
      {tab === "harita" && <HaritaTab />}
    </div>
  );
}

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

  const excelData = bolge_skor.map(b => ({ "Bölge": b.bolge, "Ort. Skor": b.ort_skor, "Kişi Sayısı": b.kisi }));

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
        <ChartCard title="Segment Dağılımı" testId="jt-segment-pie"
          headerRight={<ExcelExportButton data={segment_dist.map(s => ({ Segment: s.name, Sayı: s.value }))} filename="JollyTur_Segment" />}>
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
        <ChartCard title="Toplam Skor Dağılımı" testId="jt-histogram"
          headerRight={<ExcelExportButton data={skor_histogram.map(h => ({ Aralık: h.range, Kişi: h.count }))} filename="JollyTur_Skor_Dagilimi" />}>
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
        <ChartCard title="Bölge Bazlı Ort. Toplam Skor" testId="jt-bolge-bar"
          headerRight={<ExcelExportButton data={excelData} filename="JollyTur_Bolge_Skor" />}>
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

  const hedefExcel = hedef_ort.map(h => ({ Hedef: h.hedef, "Ort. Gerçekleşme %": h.ort_gerceklesme }));
  const subeExcel = sube_siralama.map(s => ({ Şube: s.sube, "Ort. Hedef Skoru": s.ort_hedef, Kişi: s.kisi }));
  const scatterExcel = scatter.map(s => ({ Ad: s.ad, Şube: s.sube, "Ciro %": s.ciro_gerceklesme, "NPS %": s.nps_gerceklesme }));

  return (
    <div className="space-y-5" data-testid="jt-hedef">
      <ChartCard title="Hedef Bazlı Ortalama Gerçekleşme (%)" testId="jt-hedef-bar"
        headerRight={<ExcelExportButton data={hedefExcel} filename="JollyTur_Hedef_Gerceklesme" />}>
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
        <ChartCard title="Şube Hedef Skor Sıralaması" subtitle="En iyi ve en düşük 5 şube" testId="jt-sube-rank"
          headerRight={<ExcelExportButton data={subeExcel} filename="JollyTur_Sube_Siralama" />}>
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

        <ChartCard title="Ciro Gerçekleşme vs NPS/Memnuniyet" subtitle="Satış baskısı memnuniyeti düşürüyor mu?" testId="jt-scatter"
          headerRight={<ExcelExportButton data={scatterExcel} filename="JollyTur_Ciro_NPS" />}>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="ciro_gerceklesme" name="Ciro %" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} type="number" />
              <YAxis dataKey="nps_gerceklesme" name="NPS %" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} type="number" />
              <ZAxis range={[40, 40]} />
              <Tooltip {...DARK_TOOLTIP}
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

  const radarExcel = data.kategori_radar.map(k => ({ Kategori: k.kategori, "Ort. Puan": k.ort_puan }));
  const rolExcel = data.rol_karsilastirma.map(r => ({ Rol: r.rol, "Ort. Puan": r.ort_puan }));
  const allYetkinlik = [...data.en_guclu, ...data.en_zayif].map(y => ({ Yetkinlik: y.yetkinlik, "Ort. Puan": y.ort_puan }));

  return (
    <div className="space-y-5" data-testid="jt-yetkinlik">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Kategori Bazlı Ort. Yönetici Puanı" testId="jt-yetkinlik-radar"
          headerRight={<ExcelExportButton data={radarExcel} filename="JollyTur_Kategori_Radar" />}>
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

        <ChartCard title="En Güçlü & En Zayıf Yetkinlikler" testId="jt-guclu-zayif"
          headerRight={<ExcelExportButton data={allYetkinlik} filename="JollyTur_Guclu_Zayif" />}>
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

      <ChartCard title="Rol Bazlı Yetkinlik Ortalamaları" testId="jt-rol-karsilastirma"
        headerRight={<ExcelExportButton data={rolExcel} filename="JollyTur_Rol_Yetkinlik" />}>
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

  const subeExcel = data.sube_karsilastirma.map(s => ({ Şube: s.sube, "Öz Ort.": s.oz_ort, "Yönetici Ort.": s.yonetici_ort }));
  const degerExcel = data.degerlendirici_sapma.map(d => ({ Yönetici: d.yonetici, "Ort. Puan": d.ort_puan, Sapma: d.sapma, Profil: d.tip, Kişi: d.degerlendirilen }));
  const farkExcel = data.fark_top10.map(d => ({ Ad: d.ad, Şube: d.sube, "Ort. Fark": d.ort_fark, Segment: d.segment }));

  return (
    <div className="space-y-5" data-testid="jt-kalibrasyon">
      <ChartCard title="Şube Bazlı Öz Değerlendirme vs Yönetici Puanı" testId="jt-oz-yon"
        headerRight={<ExcelExportButton data={subeExcel} filename="JollyTur_Oz_Yonetici" />}>
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
        <ChartCard title="Değerlendirici Sertlik Analizi" subtitle="Şirket ortalamasından sapma" testId="jt-severity"
          headerRight={<ExcelExportButton data={degerExcel} filename="JollyTur_Degerlendirici" />}>
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

        <ChartCard title="Öz-Yönetici Farkı En Yüksek 10 Çalışan" testId="jt-fark-top10"
          headerRight={<ExcelExportButton data={farkExcel} filename="JollyTur_Fark_Top10" />}>
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

  const getBox = (hx, yx) => data.matrix.find(m => m.hedef_dilim === hx && m.yetkinlik_dilim === yx);

  const matrisExcel = data.matrix.flatMap(m => m.employees.map(e => ({
    Kutu: m.label, Ad: e.ad, Şube: e.sube, "Hedef Skoru": e.hedef, "Yetkinlik Skoru": e.yetkinlik, "Toplam Skor": e.toplam, Segment: e.segment,
  })));

  return (
    <div className="space-y-5" data-testid="jt-matris">
      <ChartCard title="9 Kutu Yetenek Matrisi"
        subtitle={`Eşikler — Hedef: ${data.thresholds?.hedef_low} / ${data.thresholds?.hedef_high} | Yetkinlik: ${data.thresholds?.yetkinlik_low} / ${data.thresholds?.yetkinlik_high}`}
        testId="jt-9box"
        headerRight={<ExcelExportButton data={matrisExcel} filename="JollyTur_9Kutu_Matris" />}>
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

  const listExcel = list.map(c => ({ Sicil: c.sicil, Ad: c.ad, Rol: c.rol, Şube: c.sube, "Toplam Skor": c.toplam_skor, Segment: c.segment }));

  return (
    <div className="space-y-4" data-testid="jt-karne">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Çalışan Listesi" testId="jt-employee-list" className="lg:col-span-1"
          headerRight={<ExcelExportButton data={listExcel} filename="JollyTur_Calisan_Listesi" />}>
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

        <div className="lg:col-span-2 space-y-4">
          {!karne ? (
            <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-md">
              <p className="text-sm text-slate-400">Listeden bir çalışan seçin</p>
            </div>
          ) : (
            <>
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

              <ChartCard title="Hedef Kartı" testId="jt-karne-hedef"
                headerRight={<ExcelExportButton data={karne.hedefler.map(h => ({
                  Hedef: h.hedef, "Ağırlık %": h.agirlik, Birim: h.birim,
                  "Hedef Değer": h.hedef_deger, Gerçekleşen: h.gerceklesen,
                  "Gerçekleşme %": h.gerceklesme, "A. Skor": h.agirlikli_skor,
                }))} filename={`JollyTur_Karne_${karne.karne.ad_soyad.replace(/\s/g, "_")}`} />}>
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

/* ─── 7. Şube Haritası ─── */
const GEO_URL = "/turkey-provinces.json";

const BOLGE_ILLER = {
  "Marmara": ["İstanbul", "Bursa", "Kocaeli", "Tekirdağ", "Balıkesir", "Çanakkale", "Edirne", "Kırklareli", "Sakarya", "Yalova", "Bilecik"],
  "Ege": ["İzmir", "Aydın", "Denizli", "Manisa", "Muğla", "Afyonkarahisar", "Kütahya", "Uşak"],
  "Akdeniz": ["Antalya", "Mersin", "Adana", "Hatay", "Burdur", "Isparta", "Kahramanmaraş", "Osmaniye"],
  "İç Anadolu": ["Ankara", "Konya", "Kayseri", "Eskişehir", "Sivas", "Yozgat", "Kırşehir", "Kırıkkale", "Aksaray", "Niğde", "Nevşehir", "Çankırı", "Karaman"],
  "Merkez": ["İstanbul"],
};

function HaritaTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBolge, setHoveredBolge] = useState(null);
  const [selectedSube, setSelectedSube] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/harita?tenant=${TENANT}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data?.bolgeler?.length) return <p className="text-slate-500 text-sm">Harita verisi bulunamadı.</p>;

  // Build province → region map and color lookup
  const ilBolgeMap = {};
  const bolgeColorMap = {};
  data.bolgeler.forEach(b => {
    const iller = BOLGE_ILLER[b.bolge] || [];
    iller.forEach(il => { ilBolgeMap[il] = b.bolge; });
    // Color by score
    const score = b.ort_skor;
    bolgeColorMap[b.bolge] = score >= 90 ? "#14B8A6" : score >= 85 ? "#2D5299" : score >= 80 ? "#6366F1" : "#EF4444";
  });

  const getProvinceColor = (name) => {
    const bolge = ilBolgeMap[name];
    if (!bolge) return "#F1F5F9";
    if (hoveredBolge && hoveredBolge !== bolge) return "#E2E8F0";
    return bolgeColorMap[bolge] || "#CBD5E1";
  };

  const excelData = [
    ...data.bolgeler.map(b => ({ Tür: "Bölge", Ad: b.bolge, "Ort. Skor": b.ort_skor, Kişi: b.kisi, Yıldız: b.yildiz })),
    ...data.subeler.map(s => ({ Tür: "Şube", Ad: s.sube, İl: s.il, "Ort. Skor": s.ort_skor, Kişi: s.kisi, Yıldız: s.yildiz })),
  ];

  return (
    <div className="space-y-5" data-testid="jt-harita">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <ChartCard title="Türkiye Şube & Bölge Performans Haritası" testId="jt-turkey-map" className="lg:col-span-2"
          headerRight={<ExcelExportButton data={excelData} filename="JollyTur_Harita_Verisi" />}>
          <div className="relative" style={{ height: 420 }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [35, 39], scale: 2200 }}
              width={700} height={420}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const name = geo.properties?.name;
                    const bolge = ilBolgeMap[name];
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getProvinceColor(name)}
                        stroke="#fff"
                        strokeWidth={0.5}
                        onMouseEnter={() => bolge && setHoveredBolge(bolge)}
                        onMouseLeave={() => setHoveredBolge(null)}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: bolge ? bolgeColorMap[bolge] + "CC" : "#E2E8F0", cursor: bolge ? "pointer" : "default" },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
              {/* Branch markers */}
              {data.subeler.filter(s => s.lat && s.lng).map(s => (
                <Marker key={s.sube} coordinates={[s.lng, s.lat]}
                  onMouseEnter={() => setSelectedSube(s)}
                  onMouseLeave={() => setSelectedSube(null)}>
                  <circle r={Math.max(4, s.kisi * 0.8)} fill="#F59E0B" stroke="#fff" strokeWidth={1.5} opacity={0.9}
                    style={{ cursor: "pointer", transition: "r 0.2s" }} />
                  <text textAnchor="middle" y={-10} style={{ fontSize: 8, fill: "#1E293B", fontWeight: 600 }}>
                    {s.sube}
                  </text>
                </Marker>
              ))}
            </ComposableMap>

            {/* Tooltip for selected branch */}
            {selectedSube && (
              <div className="absolute top-3 right-3 bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-lg text-xs z-10" style={{ minWidth: 180 }}>
                <p className="font-bold text-slate-800 text-sm">{selectedSube.sube}</p>
                <p className="text-slate-500 mb-2">{selectedSube.il}</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Ort. Skor</span><span className="font-bold" style={{ color: NAVY }}>{fmtTR(selectedSube.ort_skor)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Kişi Sayısı</span><span className="font-semibold">{selectedSube.kisi}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Yıldız</span><span className="font-semibold text-amber-600">{selectedSube.yildiz}</span></div>
                </div>
              </div>
            )}

            {/* Hovered region tooltip */}
            {hoveredBolge && !selectedSube && (
              <div className="absolute top-3 right-3 bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-lg text-xs z-10" style={{ minWidth: 160 }}>
                {(() => {
                  const b = data.bolgeler.find(x => x.bolge === hoveredBolge);
                  if (!b) return null;
                  return <>
                    <p className="font-bold text-slate-800 text-sm">{b.bolge} Bölgesi</p>
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between"><span className="text-slate-500">Ort. Skor</span><span className="font-bold" style={{ color: NAVY }}>{fmtTR(b.ort_skor)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Kişi</span><span className="font-semibold">{b.kisi}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Yıldız</span><span className="font-semibold text-amber-600">{b.yildiz}</span></div>
                    </div>
                  </>;
                })()}
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 px-4 pb-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#14B8A6" }} />≥90</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#2D5299" }} />85-89</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#6366F1" }} />80-84</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#EF4444" }} />&lt;80</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#F59E0B" }} />Şube</span>
          </div>
        </ChartCard>

        {/* Side panel: region & branch rankings */}
        <div className="space-y-4">
          <ChartCard title="Bölge Performansı" testId="jt-bolge-ranking">
            <div className="px-2 space-y-2">
              {[...data.bolgeler].sort((a, b) => b.ort_skor - a.ort_skor).map((b, i) => (
                <div key={b.bolge} className="flex items-center gap-2 py-1 border-b border-slate-100 last:border-0"
                  onMouseEnter={() => setHoveredBolge(b.bolge)} onMouseLeave={() => setHoveredBolge(null)}
                  style={{ cursor: "pointer" }}>
                  <span className="text-[10px] w-4 font-mono text-slate-400">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-800">{b.bolge}</p>
                    <p className="text-[10px] text-slate-400">{b.kisi} kişi</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: NAVY }}>{fmtTR(b.ort_skor)}</p>
                    <div className="flex gap-1 justify-end">
                      {Object.entries(b.segments || {}).map(([seg, cnt]) => (
                        <span key={seg} className="text-[9px] px-1 rounded" style={{ backgroundColor: SEG_COLORS[seg] + "20", color: SEG_COLORS[seg] }}>
                          {cnt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Şube Performansı" testId="jt-sube-ranking">
            <div className="px-2 space-y-2 max-h-[280px] overflow-y-auto">
              {[...data.subeler].sort((a, b) => b.ort_skor - a.ort_skor).map((s, i) => (
                <div key={s.sube} className="flex items-center gap-2 py-1 border-b border-slate-100 last:border-0"
                  onMouseEnter={() => setSelectedSube(s)} onMouseLeave={() => setSelectedSube(null)}
                  style={{ cursor: "pointer" }}>
                  <span className="text-[10px] w-4 font-mono text-slate-400">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-800">{s.sube}</p>
                    <p className="text-[10px] text-slate-400">{s.il} — {s.kisi} kişi</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: NAVY }}>{fmtTR(s.ort_skor)}</p>
                </div>
              ))}
            </div>
          </ChartCard>
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

  const heatExcel = data.map(d => ({ [rowKey]: d[rowKey], [colKey]: d[colKey], Değer: d[valKey] }));

  const getColor = (v) => {
    if (v == null) return "#f8fafc";
    const ratio = Math.min(v / maxVal, 1);
    if (ratio >= 0.85) return "#d1fae5";
    if (ratio >= 0.7) return "#ecfdf5";
    if (ratio >= 0.55) return "#fff7ed";
    return "#fef2f2";
  };

  return (
    <ChartCard title={title} testId={testId}
      headerRight={<ExcelExportButton data={heatExcel} filename={`JollyTur_${testId}`} />}>
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
