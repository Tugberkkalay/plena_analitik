import { useState, useEffect } from "react";
import axios from "axios";
import { Handshake, CheckCircle, XCircle, CurrencyCircleDollar, ChartBar, TrendUp, TrendDown } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, CartesianGrid, Legend, ReferenceLine } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (n) => n ? n.toLocaleString("tr-TR") : "0";
const fmtK = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}K` : fmt(n);
const VS_STYLE = { "Altında": "bg-red-50 text-red-700", "Üstünde": "bg-emerald-50 text-emerald-700", "Ortalamada": "bg-amber-50 text-amber-700" };

export default function TeklifAnaliziPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/teklif-analizi?year=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis } = data;

  return (
    <div data-testid="teklif-analizi-page" className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Toplam Teklif" value={kpis.toplam_teklif} icon={Handshake} color="blue" />
        <KPICard title="Kabul" value={kpis.kabul} icon={CheckCircle} color="green" />
        <KPICard title="Red" value={kpis.red} icon={XCircle} color="red" />
        <KPICard title="Kabul Oranı" value={kpis.kabul_orani} icon={ChartBar} color="teal" format="percent" />
        <KPICard title="Maaş Red %" value={kpis.maas_red_pct} icon={CurrencyCircleDollar} color="orange" format="percent" />
        <KPICard title="Yan Hak Red %" value={kpis.yan_hak_red_pct} icon={TrendDown} color="amber" format="percent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Red sebepleri */}
        <ChartCard title="Red Sebepleri Dağılımı" testId="chart-rej-reasons">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.rejection_reasons} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="reason" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v, n, p) => [`${v} (%${p.payload.pct})`, "Red"]} />
              <Bar dataKey="count" name="Red Sayısı" radius={[0, 3, 3, 0]}>
                {data.rejection_reasons.map((r, i) => <Cell key={r.reason} fill={["#EF4444", "#F97316", "#F59E0B", "#8B5CF6", "#06B6D4", "#84CC16"][i] || "#94A3B8"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Çeyrek trend */}
        <ChartCard title="Çeyrek Bazlı Red Trendi" testId="chart-quarterly-trend">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.quarterly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="quarter" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="kabul" name="Kabul" stackId="a" fill="#14B8A6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="maas_red" name="Maaş Red" stackId="a" fill="#EF4444" />
              <Bar dataKey="yan_hak_red" name="Yan Hak Red" stackId="a" fill="#F97316" />
              <Bar dataKey="diger_red" name="Diğer Red" stackId="a" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Scatter: Teklif Rekabetçilik */}
      <ChartCard title="Teklif Rekabetçilik Analizi" subtitle="Her teklifin sektör ortalamasına ve şirket ortalamasına göre konumu. Kırmızı = ortalamanın altında, Yeşil = üstünde" testId="chart-scatter">
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis type="number" dataKey="sektor_ort" name="Sektör Ort." tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} label={{ value: "Sektör Ortalaması (₺)", position: "bottom", offset: -5, style: { fontSize: 10, fill: "#94A3B8" } }} />
            <YAxis type="number" dataKey="offer_salary" name="Teklif" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} label={{ value: "Teklif Maaşı (₺)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#94A3B8" } }} />
            <ZAxis range={[40, 120]} />
            <Tooltip {...DARK_TOOLTIP} formatter={(v) => `₺${fmt(v)}`} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (<div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md text-xs">
                <p className="font-semibold text-slate-800">{d.candidate}</p>
                <p className="text-slate-500">{d.position} · {d.department} · Band {d.band}</p>
                <p className="mt-1">Teklif: <span className="font-bold">₺{fmt(d.offer_salary)}</span></p>
                <p>Sektör Ort: ₺{fmt(d.sektor_ort)} · Şirket Ort: ₺{fmt(d.sirket_ort)}</p>
                <p className="mt-1">Sonuç: <span className={d.stage === "Hired" ? "text-emerald-600" : "text-red-600"}>{d.stage === "Hired" ? "Kabul" : d.stage === "Reddedildi" ? "Red" : "Bekliyor"}</span>
                  {d.rejection_reason && <span className="text-slate-400"> ({d.rejection_reason})</span>}</p>
              </div>);
            }} />
            <ReferenceLine stroke="#94A3B8" strokeDasharray="3 3" segment={[{ x: 0, y: 0 }, { x: 300000, y: 300000 }]} />
            <Scatter data={data.scatter_data} shape="circle">
              {data.scatter_data.map((d, i) => <Cell key={i} fill={d.vs_sektor === "Altında" ? "#EF4444" : d.vs_sektor === "Üstünde" ? "#14B8A6" : "#F59E0B"} opacity={d.stage === "Reddedildi" ? 1 : 0.6} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Sektör Altı</span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Ortalamada</span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" />Sektör Üstü</span>
        </div>
      </ChartCard>

      {/* Department red rates */}
      <ChartCard title="Departman & Pozisyon Bazlı Red Oranı" testId="table-dept-red"
        headerRight={<ExcelExportButton data={data.department_red.filter(d => d.teklif > 0)} filename="teklif-dept-red" sheetName="Departman Red" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">Departman</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Teklif</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Red</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Red Oranı</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.department_red.filter(d => d.teklif > 0).map(d => (
              <TableRow key={d.department} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="text-slate-900 text-sm font-medium">{d.department}</TableCell>
                <TableCell className="text-center text-sm">{d.teklif}</TableCell>
                <TableCell className="text-center text-sm text-red-600 font-medium">{d.red}</TableCell>
                <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${d.red_oran > 30 ? "bg-red-100 text-red-700" : d.red_oran > 15 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>%{d.red_oran}</span></TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>

      {/* Detailed offer table */}
      <ChartCard title="Teklif Detayları" subtitle="Her teklifin şirket, sektör ve band ortalamasına göre konumu" testId="table-offers-detail"
        headerRight={<ExcelExportButton data={data.scatter_data} filename="teklif-detay" sheetName="Teklif Detayları" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">Aday</TableHead>
            <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead>
            <TableHead className="text-slate-400 text-xs">Departman</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Band</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Teklif</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Sektör Ort.</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">vs Sektör</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">vs Şirket</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Sonuç</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.scatter_data.slice(0, 30).map((d, i) => (
              <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="text-slate-900 text-sm font-medium">{d.candidate}</TableCell>
                <TableCell className="text-slate-600 text-sm">{d.position}</TableCell>
                <TableCell className="text-slate-600 text-sm">{d.department}</TableCell>
                <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-slate-100">{d.band}</span></TableCell>
                <TableCell className="text-right text-sm font-medium">₺{fmt(d.offer_salary)}</TableCell>
                <TableCell className="text-right text-sm text-slate-500">₺{fmt(d.sektor_ort)}</TableCell>
                <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs ${VS_STYLE[d.vs_sektor] || ""}`}>{d.vs_sektor}</span></TableCell>
                <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs ${VS_STYLE[d.vs_sirket] || ""}`}>{d.vs_sirket}</span></TableCell>
                <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs ${d.stage === "Hired" ? "bg-emerald-50 text-emerald-700" : d.stage === "Reddedildi" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{d.stage === "Hired" ? "Kabul" : d.stage === "Reddedildi" ? "Red" : "Bekliyor"}</span></TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>
    </div>
  );
}
