import { useState, useEffect } from "react";
import axios from "axios";
import { Scales, TrendUp, TrendDown, Warning, Users, ChartBar, Minus } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, ReferenceArea } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (n) => n ? n.toLocaleString("tr-TR") : "0";
const fmtK = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}K` : fmt(n);
const VS_STYLE = { "Altında": "bg-red-50 text-red-700", "Üstünde": "bg-emerald-50 text-emerald-700", "Ortalamada": "bg-amber-50 text-amber-700" };

export default function UcretBenchmarkPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drillLevel, setDrillLevel] = useState("birim"); // birim → pozisyon → kisi
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedPos, setSelectedPos] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/ucret-benchmark?year=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis } = data;

  const handleDeptClick = (dept) => {
    setSelectedDept(dept);
    setSelectedPos(null);
    setDrillLevel("pozisyon");
  };
  const handlePosClick = (pos) => {
    setSelectedPos(pos);
    setDrillLevel("kisi");
  };
  const handleBack = () => {
    if (drillLevel === "kisi") { setSelectedPos(null); setDrillLevel("pozisyon"); }
    else if (drillLevel === "pozisyon") { setSelectedDept(null); setDrillLevel("birim"); }
  };

  const filteredPositions = selectedDept ? data.position_summary.filter(p => p.department === selectedDept) : data.position_summary;
  const filteredEmployees = selectedPos
    ? data.employee_list.filter(e => e.position === selectedPos && (!selectedDept || e.department === selectedDept))
    : selectedDept ? data.employee_list.filter(e => e.department === selectedDept) : data.employee_list;

  return (
    <div data-testid="ucret-benchmark-page" className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Toplam Çalışan" value={kpis.total} icon={Users} color="blue" />
        <KPICard title="Band Altı" value={kpis.band_alti} icon={TrendDown} color="red" />
        <KPICard title="Band Üstü" value={kpis.band_ustu} icon={TrendUp} color="green" />
        <KPICard title="Sektör Altı" value={kpis.sektor_alti} icon={Warning} color="orange" />
        <KPICard title="Sektör Üstü" value={kpis.sektor_ustu} icon={ChartBar} color="teal" />
        <KPICard title="Risk" value={kpis.risk_sayisi} icon={Warning} color="red" />
      </div>

      {/* Band box-plot visualization */}
      <ChartCard title="Band Bazlı Maaş Aralığı ve Dağılımı" subtitle="Her band için min-max aralığı, orta nokta ve sektör ortalaması" testId="chart-band-box">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.band_box} barGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis dataKey="band" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
            <Tooltip {...DARK_TOOLTIP} formatter={(v) => `₺${fmt(v)}`} />
            {data.band_box.map((b, i) => (
              <ReferenceArea key={b.band} x1={i - 0.35} x2={i + 0.35} y1={b.band_min} y2={b.band_max} fill="#E2E8F0" fillOpacity={0.3} />
            ))}
            <Bar dataKey="min" name="Min" fill="#94A3B8" radius={[3, 3, 0, 0]} barSize={8} />
            <Bar dataKey="median" name="Medyan" fill="#14B8A6" radius={[3, 3, 0, 0]} barSize={12} />
            <Bar dataKey="max" name="Max" fill="#0E7490" radius={[3, 3, 0, 0]} barSize={8} />
            <Bar dataKey="sector_avg" name="Sektör Ort." fill="#F59E0B" radius={[3, 3, 0, 0]} barSize={6} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Drill-down navigation */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">Kırılım:</span>
        <button onClick={() => { setDrillLevel("birim"); setSelectedDept(null); setSelectedPos(null); }}
          className={`px-3 py-1 rounded-md ${drillLevel === "birim" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Birim</button>
        <span className="text-slate-300">/</span>
        <button onClick={() => { if (selectedDept) setDrillLevel("pozisyon"); }}
          className={`px-3 py-1 rounded-md ${drillLevel === "pozisyon" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Pozisyon</button>
        <span className="text-slate-300">/</span>
        <button onClick={() => { if (selectedPos) setDrillLevel("kisi"); }}
          className={`px-3 py-1 rounded-md ${drillLevel === "kisi" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Kişi</button>
        {(selectedDept || selectedPos) && (
          <button onClick={handleBack} className="ml-2 px-3 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs">Geri</button>
        )}
        {selectedDept && <span className="text-xs text-teal-600 font-medium ml-2">{selectedDept}</span>}
        {selectedPos && <span className="text-xs text-teal-600 font-medium">/ {selectedPos}</span>}
      </div>

      {/* Birim level */}
      {drillLevel === "birim" && (
        <ChartCard title="Birim Bazlı Ücret Karşılaştırma" subtitle="Birime tıklayarak pozisyon kırılımına inin" testId="table-birim"
          headerRight={<ExcelExportButton data={data.birim_summary} filename="ucret-birim" sheetName="Birim Bazlı" />}>
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Birim</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Kişi</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Ort. Maaş</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Min</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Max</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Sektör Üstü</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Sektör Altı</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Risk</TableHead>
            </TableRow></TableHeader><TableBody>
              {data.birim_summary.map(d => (
                <TableRow key={d.department} className="border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => handleDeptClick(d.department)}>
                  <TableCell className="text-slate-900 text-sm font-medium underline decoration-dotted">{d.department}</TableCell>
                  <TableCell className="text-center text-sm">{d.count}</TableCell>
                  <TableCell className="text-right text-sm font-medium">₺{fmt(d.avg)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmt(d.min)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmt(d.max)}</TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700">{d.above}</span></TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-700">{d.below}</span></TableCell>
                  <TableCell className="text-center">{d.risk > 0 && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-bold">{d.risk}</span>}</TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>
      )}

      {/* Position level */}
      {drillLevel === "pozisyon" && (
        <ChartCard title={`Pozisyon Bazlı — ${selectedDept}`} subtitle="Pozisyona tıklayarak kişi detayına inin" testId="table-position"
          headerRight={<ExcelExportButton data={filteredPositions} filename={`ucret-pozisyon-${selectedDept}`} sheetName="Pozisyon" />}>
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Band</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Kişi</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Ort. Maaş</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Band Min-Orta-Max</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Sektör Ort.</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Compa</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Risk</TableHead>
            </TableRow></TableHeader><TableBody>
              {filteredPositions.map((p, i) => (
                <TableRow key={i} className="border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => handlePosClick(p.position)}>
                  <TableCell className="text-slate-900 text-sm font-medium underline decoration-dotted">{p.position}</TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-slate-100">{p.band}</span></TableCell>
                  <TableCell className="text-center text-sm">{p.count}</TableCell>
                  <TableCell className="text-right text-sm font-medium">₺{fmt(p.avg)}</TableCell>
                  <TableCell className="text-right text-xs text-slate-500">₺{fmtK(p.band_min)} — ₺{fmtK(p.band_mid)} — ₺{fmtK(p.band_max)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmt(p.sector_avg)}</TableCell>
                  <TableCell className="text-center text-sm font-medium" style={{ color: p.compa_ratio >= 1 ? "#14B8A6" : "#EF4444" }}>{p.compa_ratio}</TableCell>
                  <TableCell className="text-center">{p.risk > 0 && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-bold">{p.risk}</span>}</TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>
      )}

      {/* Person level */}
      {drillLevel === "kisi" && (
        <ChartCard title={`Kişi Bazlı — ${selectedDept}${selectedPos ? ` / ${selectedPos}` : ""}`} testId="table-person"
          headerRight={<ExcelExportButton data={filteredEmployees.slice(0, 50)} filename="ucret-kisi" sheetName="Kişi Bazlı" />}>
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Çalışan</TableHead>
              <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Band</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Maaş</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Band Orta</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Sektör Ort.</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Fark</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Compa</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">vs Sektör</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Risk</TableHead>
            </TableRow></TableHeader><TableBody>
              {filteredEmployees.slice(0, 50).map((e, i) => (
                <TableRow key={i} className={`border-slate-100 hover:bg-slate-50 ${e.risk ? "bg-red-50/40" : ""}`}>
                  <TableCell className="text-slate-900 text-sm font-medium">{e.name}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{e.position}</TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-slate-100">{e.band}</span></TableCell>
                  <TableCell className="text-right text-sm font-medium">₺{fmt(e.salary)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmt(e.band_mid)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmt(e.sector_avg)}</TableCell>
                  <TableCell className="text-right text-sm"><span className={e.fark_pct < -10 ? "text-red-600 font-medium" : e.fark_pct > 10 ? "text-emerald-600" : "text-slate-600"}>{e.fark_pct > 0 ? "+" : ""}{e.fark_pct}%</span></TableCell>
                  <TableCell className="text-center text-sm font-medium" style={{ color: e.compa_ratio >= 1 ? "#14B8A6" : "#EF4444" }}>{e.compa_ratio}</TableCell>
                  <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs ${VS_STYLE[e.vs_sector] || ""}`}>{e.vs_sector}</span></TableCell>
                  <TableCell className="text-center">{e.risk && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 font-bold">Risk</span>}</TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>
      )}

      {/* Risk employees */}
      {data.risk_employees.length > 0 && (
        <ChartCard title="Riskli Çalışanlar" subtitle="Hem sektör ortalamasının altında maaş alan hem yüksek performanslı — kaybetme riski yüksek" testId="table-risk"
          headerRight={<ExcelExportButton data={data.risk_employees} filename="ucret-risk" sheetName="Risk Listesi" />}>
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Çalışan</TableHead>
              <TableHead className="text-slate-400 text-xs">Birim</TableHead>
              <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Band</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Kıdem</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Maaş</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Sektör Ort.</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Fark</TableHead>
            </TableRow></TableHeader><TableBody>
              {data.risk_employees.map((e, i) => (
                <TableRow key={i} className="border-slate-100 bg-red-50/30 hover:bg-red-50">
                  <TableCell className="text-slate-900 text-sm font-medium">{e.name}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{e.department}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{e.position}</TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-slate-100">{e.band}</span></TableCell>
                  <TableCell className="text-center text-sm">{e.kidem} yıl</TableCell>
                  <TableCell className="text-right text-sm font-medium text-red-700">₺{fmt(e.salary)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmt(e.sector_avg)}</TableCell>
                  <TableCell className="text-right text-sm text-red-600 font-medium">{e.fark_pct}%</TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
