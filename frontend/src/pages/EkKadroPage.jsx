import { useState, useEffect } from "react";
import axios from "axios";
import { ClipboardText, CheckCircle, XCircle, Clock, Users, CurrencyCircleDollar } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Toplam Talep" value={kpis.total_talep} icon={ClipboardText} color="blue" />
        <KPICard title="Onaylanan" value={kpis.onaylanan} icon={CheckCircle} color="green" />
        <KPICard title="Reddedilen" value={kpis.reddedilen} icon={XCircle} color="red" />
        <KPICard title="Bekleyen" value={kpis.bekleyen} icon={Clock} color="amber" />
        <KPICard title="Onay Kadro" value={kpis.onay_kisi} icon={Users} color="teal" />
        <KPICard title="Öngörülen Gider" value={`₺${fmtK(kpis.ongorulen_maliyet)}`} icon={CurrencyCircleDollar} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Talep Sebebi Dağılımı" testId="chart-ek-reasons">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={data.reason_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="count" nameKey="reason" strokeWidth={0}>
              {data.reason_distribution.map((e, i) => <Cell key={e.reason} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie><Tooltip {...DARK_TOOLTIP} /></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 -mt-1">
            {data.reason_distribution.map((r, i) => <span key={r.reason} className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{r.reason}: {r.count}</span>)}
          </div>
        </ChartCard>

        <ChartCard title="Çeyrek Bazlı Talep Trendi" testId="chart-ek-quarterly">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.quarterly_trend}>
              <XAxis dataKey="quarter" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="talep" name="Talep" fill="#94A3B8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="onaylanan" name="Onaylanan" fill="#14B8A6" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Departman Bazlı Talepler" className="lg:col-span-2" testId="chart-ek-dept">
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Departman</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Talep</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Onaylanan</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Kişi Sayısı</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Öngörülen Maliyet</TableHead>
            </TableRow></TableHeader><TableBody>
              {data.department_breakdown.map(d => (
                <TableRow key={d.department} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="text-slate-900 text-sm font-medium">{d.department}</TableCell>
                  <TableCell className="text-center text-sm">{d.talep}</TableCell>
                  <TableCell className="text-center text-sm text-emerald-600 font-medium">{d.onaylanan}</TableCell>
                  <TableCell className="text-center text-sm">{d.kisi}</TableCell>
                  <TableCell className="text-right text-sm font-medium">₺{fmtK(d.maliyet)}</TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>
      </div>

      {/* Full request list */}
      <ChartCard title="Talep Listesi" subtitle="Tüm ek kadro talepleri" testId="table-ek-list">
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">Talep No</TableHead>
            <TableHead className="text-slate-400 text-xs">Departman</TableHead>
            <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead>
            <TableHead className="text-slate-400 text-xs">Sebep</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Kişi</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Durum</TableHead>
            <TableHead className="text-slate-400 text-xs">Talep Eden</TableHead>
            <TableHead className="text-slate-400 text-xs">Tarih</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Yıllık Maliyet</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.talep_listesi.map(t => (
              <TableRow key={t.talep_no} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="text-slate-700 text-xs font-mono">{t.talep_no}</TableCell>
                <TableCell className="text-slate-900 text-sm">{t.department}</TableCell>
                <TableCell className="text-slate-600 text-sm">{t.position}</TableCell>
                <TableCell className="text-slate-600 text-sm">{t.talep_sebebi}</TableCell>
                <TableCell className="text-center text-sm font-medium">{t.kisi_sayisi}</TableCell>
                <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[t.onay_durumu] || ""}`}>{t.onay_durumu}</span></TableCell>
                <TableCell className="text-slate-600 text-sm">{t.talep_eden}</TableCell>
                <TableCell className="text-slate-500 text-sm">{t.talep_tarihi}</TableCell>
                <TableCell className="text-right text-sm font-medium">₺{fmtK(t.ongorulen_yillik_maliyet)}</TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>
    </div>
  );
}
