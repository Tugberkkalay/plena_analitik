import { useState, useEffect } from "react";
import axios from "axios";
import { Funnel, Users, CurrencyCircleDollar, ChartBar, TrendDown, Clock } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, FunnelChart, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (n) => n ? n.toLocaleString("tr-TR") : "0";
const fmtK = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}K` : fmt(n);

export default function KaynakAnaliziPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/kaynak-analizi?year=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;
  const { kpis } = data;

  return (
    <div data-testid="kaynak-analizi-page" className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Toplam Başvuru" value={kpis.total_basvuru} icon={Users} color="blue" />
        <KPICard title="İşe Alınan" value={kpis.total_hired} icon={ChartBar} color="green" />
        <KPICard title="Genel Dönüşüm" value={kpis.overall_conversion} icon={Funnel} color="teal" format="percent" />
        <KPICard title="Toplam Maliyet" value={`₺${fmtK(kpis.total_cost)}`} icon={CurrencyCircleDollar} color="purple" />
        <KPICard title="Kişi Başı Ort." value={`₺${fmtK(kpis.avg_cost_per_hire)}`} icon={CurrencyCircleDollar} color="amber" />
        <KPICard title="Aday Vazgeçme" value={`${kpis.vazgecme_pct}%`} icon={TrendDown} color="red" subtitle={`${kpis.aday_vazgecme} aday`} />
      </div>

      {/* Channel Funnel Chart */}
      <ChartCard title="Kanal Bazlı Dönüşüm Hunisi" subtitle="Başvuru → Ön Eleme → Mülakat → Teklif → İşe Alım" testId="chart-channel-funnel">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data.channel_breakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="source" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
            <Tooltip {...DARK_TOOLTIP} />
            <Bar dataKey="basvuru" name="Başvuru" fill="#94A3B8" radius={[0, 3, 3, 0]} />
            <Bar dataKey="on_eleme" name="Ön Eleme" fill="#0EA5E9" radius={[0, 3, 3, 0]} />
            <Bar dataKey="mulakat" name="Mülakat" fill="#8B5CF6" radius={[0, 3, 3, 0]} />
            <Bar dataKey="hired" name="İşe Alım" fill="#14B8A6" radius={[0, 3, 3, 0]} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Channel detail table */}
      <ChartCard title="Kanal Detay Tablosu" subtitle="Dönüşüm oranı, maliyet ve süre karşılaştırma" testId="table-channel"
        headerRight={<ExcelExportButton data={data.channel_breakdown} filename="kaynak-kanal-detay" sheetName="Kanal Detay" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">Kanal</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Başvuru</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Ön Eleme</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Mülakat</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Teklif</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">İşe Alım</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Dönüşüm</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Kişi Başı</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Ort. Gün</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.channel_breakdown.map(ch => (
              <TableRow key={ch.source} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="text-slate-900 text-sm font-medium">{ch.source}</TableCell>
                <TableCell className="text-center text-sm">{ch.basvuru}</TableCell>
                <TableCell className="text-center text-sm">{ch.on_eleme}</TableCell>
                <TableCell className="text-center text-sm">{ch.mulakat}</TableCell>
                <TableCell className="text-center text-sm">{ch.teklif}</TableCell>
                <TableCell className="text-center text-sm font-medium text-emerald-600">{ch.hired}</TableCell>
                <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${ch.conversion > 10 ? "bg-emerald-100 text-emerald-700" : ch.conversion > 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>%{ch.conversion}</span></TableCell>
                <TableCell className="text-right text-sm">{ch.cost_per_hire ? `₺${fmt(ch.cost_per_hire)}` : "-"}</TableCell>
                <TableCell className="text-center text-sm text-slate-500">{ch.avg_days}</TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>

      {/* Dropout Analysis */}
      <ChartCard title="Aday Kaybı Analizi" subtitle="Hangi aşamada, neden kaybediliyor" testId="table-dropout"
        headerRight={<ExcelExportButton data={data.dropout_analysis} filename="kaynak-aday-kaybi" sheetName="Aday Kaybı" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">Aşama</TableHead>
            <TableHead className="text-slate-400 text-xs">Kayıp Sebebi</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Sayı</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.dropout_analysis.map((d, i) => (
              <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                <TableCell><span className={`px-2 py-0.5 rounded text-xs ${d.stage === "Başvuru" ? "bg-slate-100 text-slate-700" : d.stage === "Mülakat" ? "bg-purple-50 text-purple-700" : d.stage === "Teklif" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{d.stage}</span></TableCell>
                <TableCell className="text-slate-900 text-sm">{d.reason}</TableCell>
                <TableCell className="text-center text-sm font-medium">{d.count}</TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>
    </div>
  );
}
