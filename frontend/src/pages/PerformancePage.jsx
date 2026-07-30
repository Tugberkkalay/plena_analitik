import { useState, useEffect } from "react";
import axios from "axios";
import { ChartBar, TrendUp, TrendDown, Star, Target } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PerformancePage({ year }) {
  const [data, setData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/dashboard/performance?year=${year}`),
      axios.get(`${API}/sales/reps?period=${year}`).catch(() => null)
    ]).then(([perf, sales]) => {
      setData(perf.data);
      if (sales) setSalesData(sales.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-500">Veri bulunamadı.</p>;

  const { kpis } = data;
  return (
    <div data-testid="performance-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Ort. Skor" value={kpis.avg_score} icon={Target} color="blue" format="decimal" subtitle="/5.0" />
        <KPICard title="Yüksek Performans" value={kpis.high_performers} icon={TrendUp} color="green" subtitle={`${kpis.high_pct}%`} />
        <KPICard title="Düşük Performans" value={kpis.low_performers} icon={TrendDown} color="red" subtitle={`${kpis.low_pct}%`} />
        <KPICard title="Yüksek Perf %" value={kpis.high_pct} icon={Star} color="amber" format="percent" />
        <KPICard title="Düşük Perf %" value={kpis.low_pct} icon={ChartBar} color="slate" format="percent" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Performans Skor Dağılımı" testId="chart-perf-dist">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {data.distribution?.map((d, i) => <Cell key={`perf-${d.range}`} fill={parseFloat(d.range) >= 4.0 ? "#14B8A6" : parseFloat(d.range) < 2.5 ? "#EF4444" : "#0E7490"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Departman Ort. Performansı" testId="chart-perf-dept">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.by_department} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="department" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={75} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="score" fill="#F59E0B" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Band Bazlı Performans" testId="chart-perf-band">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.by_band}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="band" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="score" fill="#0E7490" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="En İyi 10 Çalışan" testId="chart-top-perf"
          headerRight={<ExcelExportButton data={data.top_performers} filename="en-iyi-performans" sheetName="Top Performans" />}>
          <div className="overflow-x-auto px-2">
            <Table>
              <TableHeader><TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-slate-500 text-xs">Ad Soyad</TableHead>
                <TableHead className="text-slate-500 text-xs">Departman</TableHead>
                <TableHead className="text-slate-500 text-xs">Band</TableHead>
                <TableHead className="text-slate-500 text-xs text-right">İK Skoru</TableHead>
                <TableHead className="text-slate-500 text-xs text-right">Satış %</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.top_performers?.map((e, i) => {
                  const salesRep = salesData?.reps?.find(r => r.name === e.name);
                  return (
                    <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                      <TableCell className="text-slate-900 text-sm font-medium">{e.name}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{e.department}</TableCell>
                      <TableCell><span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{e.band}</span></TableCell>
                      <TableCell className="text-right"><span className="text-sm font-semibold text-emerald-700">{e.score}</span></TableCell>
                      <TableCell className="text-right">
                        {salesRep ? (
                          <span className={`text-sm font-semibold ${salesRep.achievement_pct >= 100 ? "text-teal-700" : salesRep.achievement_pct >= 85 ? "text-amber-600" : "text-red-600"}`}>
                            %{salesRep.achievement_pct}
                          </span>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
