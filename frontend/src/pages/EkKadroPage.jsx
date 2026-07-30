import { useState, useEffect } from "react";
import axios from "axios";
import { ClipboardText, CheckCircle, XCircle, Clock, Users, CurrencyCircleDollar, TrendUp, TrendDown, Warning } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid, ComposedChart, Line } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (n) => n ? n.toLocaleString("tr-TR") : "0";
const fmtK = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : fmt(n);
const STATUS_STYLE = { "Onaylandı": "bg-emerald-50 text-emerald-700", "Reddedildi": "bg-red-50 text-red-700", "Beklemede": "bg-amber-50 text-amber-700" };

export default function EkKadroPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/ek-kadro?year=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis } = data;

  return (
    <div data-testid="ek-kadro-page" className="space-y-6">
      {/* KPIs - Budget vs Actual */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <KPICard title="Toplam Talep" value={kpis.total_talep} icon={ClipboardText} color="blue" />
        <KPICard title="Onaylanan" value={kpis.onaylanan} icon={CheckCircle} color="green" subtitle={`Red: ${kpis.reddedilen} · Bekl: ${kpis.bekleyen}`} />
        <KPICard title="Bütçelenen Kişi" value={kpis.butcelenen_kisi} icon={Users} color="teal" />
        <KPICard title="Gerçekleşen Kişi" value={kpis.gerceklesen_kisi} icon={Users} color={kpis.kisi_sapma > 0 ? "red" : "green"}
          subtitle={`${kpis.kisi_sapma > 0 ? "+" : ""}${kpis.kisi_sapma} sapma`} />
        <KPICard title="Maliyet Sapması" value={`₺${fmtK(Math.abs(kpis.maliyet_sapma))}`}
          icon={kpis.maliyet_sapma > 0 ? TrendUp : TrendDown}
          color={kpis.maliyet_sapma > 0 ? "red" : "green"}
          subtitle={kpis.maliyet_sapma > 0 ? "Bütçe aşımı" : "Bütçe altı"} />
      </div>

      {/* Budget vs Actual summary bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Bütçelenen Toplam Maliyet</p>
          <p className="text-2xl font-bold text-slate-800">₺{fmt(kpis.butcelenen_maliyet)}</p>
        </div>
        <div className={`rounded-lg border p-4 ${kpis.maliyet_sapma > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Gerçekleşen Toplam Maliyet</p>
          <p className={`text-2xl font-bold ${kpis.maliyet_sapma > 0 ? "text-red-700" : "text-emerald-700"}`}>₺{fmt(kpis.gerceklesen_maliyet)}</p>
          <p className={`text-xs mt-1 ${kpis.maliyet_sapma > 0 ? "text-red-500" : "text-emerald-500"}`}>
            {kpis.maliyet_sapma > 0 ? "+" : ""}₺{fmt(kpis.maliyet_sapma)} fark
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Talep Sebebi */}
        <ChartCard title="Talep Sebebi Dağılımı" testId="chart-ek-reasons">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={data.reason_distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="count" nameKey="reason" strokeWidth={0}>
              {data.reason_distribution.map((e, i) => <Cell key={e.reason} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie><Tooltip {...DARK_TOOLTIP} /></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 -mt-1">
            {data.reason_distribution.map((r, i) => <span key={r.reason} className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{r.reason}: {r.count}</span>)}
          </div>
        </ChartCard>

        {/* Çeyrek Trend: Bütçelenen vs Gerçekleşen */}
        <ChartCard title="Çeyrek Bazlı Bütçelenen vs Gerçekleşen" testId="chart-ek-quarterly">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data.quarterly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="quarter" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `₺${fmt(v)}`} />
              <Bar dataKey="butcelenen" name="Bütçelenen" fill="#94A3B8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="gerceklesen" name="Gerçekleşen" fill="#14B8A6" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="sapma" name="Sapma" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Departman Bazlı Bütçe Karşılaştırma */}
      <ChartCard title="Departman Bazlı Bütçe vs Gerçekleşen" subtitle="Kişi sayısı ve maliyet sapması" testId="table-ek-dept"
        headerRight={<ExcelExportButton data={data.department_breakdown.filter(d => d.talep_sayisi > 0)} filename="ek-kadro-departman" sheetName="Departman Bütçe" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">Departman</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Talep</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Onay</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Bütçe Kişi</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Gerçek Kişi</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Kişi Sapma</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Bütçe Maliyet</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Gerçek Maliyet</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Maliyet Sapma</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.department_breakdown.filter(d => d.talep_sayisi > 0).map(d => (
              <TableRow key={d.department} className={`border-slate-100 hover:bg-slate-50 ${d.maliyet_sapma > 0 ? "bg-red-50/40" : ""}`}>
                <TableCell className="text-slate-900 text-sm font-medium">{d.department}</TableCell>
                <TableCell className="text-center text-sm">{d.talep_sayisi}</TableCell>
                <TableCell className="text-center text-sm text-emerald-600 font-medium">{d.onaylanan}</TableCell>
                <TableCell className="text-center text-sm">{d.butcelenen_kisi}</TableCell>
                <TableCell className="text-center text-sm font-medium">{d.gerceklesen_kisi}</TableCell>
                <TableCell className="text-center">
                  {d.kisi_sapma !== 0 && <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.kisi_sapma > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{d.kisi_sapma > 0 ? "+" : ""}{d.kisi_sapma}</span>}
                </TableCell>
                <TableCell className="text-right text-sm text-slate-500">₺{fmtK(d.butcelenen_maliyet)}</TableCell>
                <TableCell className="text-right text-sm font-medium">₺{fmtK(d.gerceklesen_maliyet)}</TableCell>
                <TableCell className="text-right">
                  {d.maliyet_sapma !== 0 && <span className={`text-xs font-medium ${d.maliyet_sapma > 0 ? "text-red-600" : "text-emerald-600"}`}>{d.maliyet_sapma > 0 ? "+" : ""}₺{fmtK(d.maliyet_sapma)}</span>}
                </TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>

      {/* Bütçe Aşımı Yapan Talepler */}
      {data.asim_listesi?.length > 0 && (
        <ChartCard title="Bütçe Aşımı Yapan Talepler" subtitle="Bütçelenenden fazla kişi alınmış talepler — en yüksek maliyet aşımına göre sıralı" testId="table-asim"
          headerRight={<ExcelExportButton data={data.asim_listesi} filename="ek-kadro-asim" sheetName="Bütçe Aşımı" />}>
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Talep No</TableHead>
              <TableHead className="text-slate-400 text-xs">Departman</TableHead>
              <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Band</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Bütçe</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Gerçek</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">+Fazla</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Brüt Maaş</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Bütçe Maliyet</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Gerçek Maliyet</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Aşım</TableHead>
            </TableRow></TableHeader><TableBody>
              {data.asim_listesi.map(t => (
                <TableRow key={t.talep_no} className="border-slate-100 bg-red-50/30 hover:bg-red-50">
                  <TableCell className="text-slate-700 text-xs font-mono">{t.talep_no}</TableCell>
                  <TableCell className="text-slate-900 text-sm">{t.department}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{t.position}</TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-slate-100">{t.band}</span></TableCell>
                  <TableCell className="text-center text-sm">{t.butcelenen_kisi}</TableCell>
                  <TableCell className="text-center text-sm font-bold text-red-700">{t.gerceklesen_kisi}</TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-bold">+{t.sapma_kisi}</span></TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmt(t.brut_maas)}</TableCell>
                  <TableCell className="text-right text-sm">₺{fmtK(t.butcelenen_yillik_maliyet)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">₺{fmtK(t.gerceklesen_yillik_maliyet)}</TableCell>
                  <TableCell className="text-right"><span className="text-red-600 font-bold text-sm">+₺{fmtK(t.sapma_maliyet)}</span></TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>
      )}

      {/* Full request list */}
      <ChartCard title="Tüm Talep Listesi" testId="table-ek-list"
        headerRight={<ExcelExportButton data={data.talep_listesi} filename="ek-kadro-talepler" sheetName="Talep Listesi" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">No</TableHead>
            <TableHead className="text-slate-400 text-xs">Departman</TableHead>
            <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead>
            <TableHead className="text-slate-400 text-xs">Sebep</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Bütçe</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Gerçek</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Durum</TableHead>
            <TableHead className="text-slate-400 text-xs">Talep Eden</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Kişi/Ay Maliyet</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Yıllık Maliyet</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.talep_listesi.map(t => (
              <TableRow key={t.talep_no} className={`border-slate-100 hover:bg-slate-50 ${t.sapma_kisi > 0 ? "bg-red-50/30" : ""}`}>
                <TableCell className="text-slate-700 text-xs font-mono">{t.talep_no}</TableCell>
                <TableCell className="text-slate-900 text-sm">{t.department}</TableCell>
                <TableCell className="text-slate-600 text-sm">{t.position}</TableCell>
                <TableCell className="text-slate-600 text-sm">{t.talep_sebebi}</TableCell>
                <TableCell className="text-center text-sm">{t.butcelenen_kisi} kişi</TableCell>
                <TableCell className="text-center text-sm font-medium">{t.gerceklesen_kisi > 0 ? `${t.gerceklesen_kisi} kişi` : "-"}</TableCell>
                <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[t.onay_durumu] || ""}`}>{t.onay_durumu}</span></TableCell>
                <TableCell className="text-slate-600 text-sm">{t.talep_eden}</TableCell>
                <TableCell className="text-right text-sm text-slate-500">₺{fmt(t.kisi_basi_aylik_maliyet)}</TableCell>
                <TableCell className="text-right text-sm font-medium">₺{fmtK(t.butcelenen_yillik_maliyet)}</TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>
    </div>
  );
}
