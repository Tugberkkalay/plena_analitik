import { useState, useEffect } from "react";
import axios from "axios";
import { Funnel, Users, Clock, TrendDown, ChartBar, Warning } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STAGE_COLORS = ["#94A3B8", "#0EA5E9", "#8B5CF6", "#F59E0B", "#EF4444", "#14B8A6"];

export default function AdayHunisiPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/aday-hunisi?year=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;
  const { kpis } = data;

  return (
    <div data-testid="aday-hunisi-page" className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Toplam Başvuru" value={kpis.total_basvuru} icon={Users} color="blue" />
        <KPICard title="İşe Alım" value={kpis.total_kabul} icon={ChartBar} color="green" />
        <KPICard title="Genel Dönüşüm" value={kpis.overall_conversion} icon={Funnel} color="teal" format="percent" />
        <KPICard title="En Çok Kayıp" value={kpis.biggest_drop_stage} icon={Warning} color="red" subtitle={`%${kpis.biggest_drop_pct}`} />
        <KPICard title="Ort. Süre (İşe Alım)" value={`${kpis.avg_days_to_hire} gün`} icon={Clock} color="amber" />
        <KPICard title="Ort. Pipeline" value={`${kpis.avg_pipeline_days} gün`} icon={Clock} color="slate" />
      </div>

      {/* Visual Funnel */}
      <ChartCard title="Aday Hunisi" subtitle="Her aşamada kaç aday kalıyor ve ne kadar kaybediliyor" testId="chart-funnel">
        <div className="flex flex-col items-center py-4 gap-1">
          {data.funnel.map((f, i) => {
            const widthPct = Math.max(15, f.pct_of_total);
            return (
              <div key={f.stage} className="relative flex flex-col items-center w-full">
                <div className="rounded-lg py-3 px-4 flex items-center justify-between transition-all"
                  style={{ width: `${widthPct}%`, minWidth: "200px", backgroundColor: STAGE_COLORS[i], opacity: 0.85 }}>
                  <span className="text-white text-sm font-semibold">{f.stage}</span>
                  <span className="text-white text-sm font-bold">{f.count}</span>
                </div>
                {i < data.funnel.length - 1 && f.drop > 0 && (
                  <div className="flex items-center gap-1 py-0.5">
                    <TrendDown size={12} className="text-red-400" />
                    <span className="text-[10px] text-red-500 font-medium">-{f.drop} (%{f.drop_pct})</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Dept funnel comparison */}
      <ChartCard title="Departman Bazlı Huni Karşılaştırma" testId="chart-dept-funnel">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data.department_funnels}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...DARK_TOOLTIP} />
            <Bar dataKey="basvuru" name="Başvuru" fill="#94A3B8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="on_eleme" name="Ön Eleme" fill="#0EA5E9" />
            <Bar dataKey="mulakat" name="Mülakat" fill="#8B5CF6" />
            <Bar dataKey="teknik_test" name="Teknik Test" fill="#F59E0B" />
            <Bar dataKey="kabul" name="Kabul" fill="#14B8A6" radius={[3, 3, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dept conversion table */}
        <ChartCard title="Departman Dönüşüm Oranları" testId="table-dept-conv">
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Departman</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Başvuru</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Kabul</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Dönüşüm</TableHead>
            </TableRow></TableHeader><TableBody>
              {data.department_funnels.map(d => (
                <TableRow key={d.department} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="text-slate-900 text-sm font-medium">{d.department}</TableCell>
                  <TableCell className="text-center text-sm">{d.basvuru}</TableCell>
                  <TableCell className="text-center text-sm font-medium text-emerald-600">{d.kabul}</TableCell>
                  <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${d.conversion > 10 ? "bg-emerald-100 text-emerald-700" : d.conversion > 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>%{d.conversion}</span></TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>

        {/* Dropout detail */}
        <ChartCard title="Aşama Bazlı Kayıp Sebepleri" testId="table-dropout-detail">
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Aşama</TableHead>
              <TableHead className="text-slate-400 text-xs">Sebep</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Sayı</TableHead>
            </TableRow></TableHeader><TableBody>
              {data.dropout_detail.map((d, i) => (
                <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                  <TableCell><span className={`px-2 py-0.5 rounded text-xs ${
                    d.stage === "Başvuru" ? "bg-slate-100 text-slate-700" :
                    d.stage === "Ön Eleme" ? "bg-blue-50 text-blue-700" :
                    d.stage === "Mülakat" ? "bg-purple-50 text-purple-700" :
                    d.stage === "Teknik Test" ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}>{d.stage}</span></TableCell>
                  <TableCell className="text-slate-900 text-sm">{d.reason}</TableCell>
                  <TableCell className="text-center text-sm font-medium">{d.count}</TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
