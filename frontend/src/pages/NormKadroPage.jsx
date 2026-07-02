import { useState, useEffect } from "react";
import axios from "axios";
import { Crosshair, Users, Warning, CurrencyCircleDollar, TrendUp, TrendDown } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, ComposedChart } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (n) => n ? n.toLocaleString("tr-TR") : "0";
const fmtK = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : fmt(n);

export default function NormKadroPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/norm-kadro?year=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis } = data;
  const filteredPositions = selectedDept ? data.position_detail.filter(p => p.department === selectedDept) : data.position_detail;

  return (
    <div data-testid="norm-kadro-page" className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Hedef Norm" value={kpis.total_hedef} icon={Crosshair} color="blue" />
        <KPICard title="Gerçekleşen" value={kpis.total_gerceklesen} icon={Users} color="teal" />
        <KPICard title="Net Sapma" value={kpis.net_sapma} icon={kpis.net_sapma >= 0 ? TrendUp : TrendDown} color={kpis.net_sapma >= 0 ? "red" : "amber"} />
        <KPICard title="Ek Maliyet" value={`₺${fmtK(kpis.toplam_ek_maliyet)}`} icon={CurrencyCircleDollar} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Departman Bazlı Norm vs Gerçekleşen" testId="chart-norm-dept">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.department_summary} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="department" type="category" tick={{ fill: "#64748B", fontSize: 9, cursor: "pointer" }} axisLine={false} tickLine={false} width={85}
                onClick={(e) => setSelectedDept(e?.value || null)} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="hedef" name="Hedef" fill="#94A3B8" radius={[0, 3, 3, 0]} />
              <Bar dataKey="gerceklesen" name="Gerçekleşen" fill="#14B8A6" radius={[0, 3, 3, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Aylık Trend: Hedef vs Gerçekleşen + Ek Maliyet" testId="chart-norm-trend">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v, n) => n === "Ek Maliyet" ? `₺${fmt(v)}` : v} />
              <Line yAxisId="left" type="monotone" dataKey="hedef" name="Hedef" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="gerceklesen" name="Gerçekleşen" stroke="#14B8A6" strokeWidth={2.5} dot={{ r: 3 }} />
              <Bar yAxisId="right" dataKey="ek_maliyet" name="Ek Maliyet" fill="#8B5CF6" opacity={0.3} radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Department detail table */}
      <ChartCard title="Departman Sapma Detayı" subtitle="Sapması pozitif olanlar norm üstü (kırmızı)" testId="table-norm-dept">
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">Departman</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Hedef</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Gerçekleşen</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Sapma</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Sapma %</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Ek Maliyet</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.department_summary.map(d => (
              <TableRow key={d.department} className={`border-slate-100 hover:bg-slate-50 cursor-pointer ${d.sapma > 0 ? "bg-red-50/50" : ""}`}
                onClick={() => setSelectedDept(selectedDept === d.department ? null : d.department)}>
                <TableCell className="text-slate-900 text-sm font-medium">{d.department}</TableCell>
                <TableCell className="text-center text-sm">{d.hedef}</TableCell>
                <TableCell className="text-center text-sm font-medium">{d.gerceklesen}</TableCell>
                <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${d.sapma > 0 ? "bg-red-100 text-red-700" : d.sapma < 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{d.sapma > 0 ? "+" : ""}{d.sapma}</span></TableCell>
                <TableCell className="text-center text-sm">{d.sapma_pct > 0 ? "+" : ""}{d.sapma_pct}%</TableCell>
                <TableCell className="text-right text-sm font-medium">{d.ek_maliyet > 0 ? `₺${fmt(d.ek_maliyet)}` : "-"}</TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>

      {/* Position drill-down */}
      {selectedDept && (
        <ChartCard title={`Pozisyon Kırılımı — ${selectedDept}`} subtitle="Departmana tıklayarak pozisyon detayını görün" testId="table-norm-pos">
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Band</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Hedef</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Gerçekleşen</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Sapma</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Ek Maliyet</TableHead>
            </TableRow></TableHeader><TableBody>
              {filteredPositions.map((p, i) => (
                <TableRow key={i} className={`border-slate-100 ${p.sapma > 0 ? "bg-red-50/50" : ""}`}>
                  <TableCell className="text-slate-900 text-sm">{p.position}</TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-slate-100">{p.band}</span></TableCell>
                  <TableCell className="text-center text-sm">{p.hedef}</TableCell>
                  <TableCell className="text-center text-sm font-medium">{p.gerceklesen}</TableCell>
                  <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs ${p.sapma > 0 ? "bg-red-100 text-red-700" : p.sapma < 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{p.sapma > 0 ? "+" : ""}{p.sapma}</span></TableCell>
                  <TableCell className="text-right text-sm">{p.ek_maliyet > 0 ? `₺${fmt(p.ek_maliyet)}` : "-"}</TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
