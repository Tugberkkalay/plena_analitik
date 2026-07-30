import { useState, useEffect } from "react";
import axios from "axios";
import { GraduationCap, Users, ChartBar, TrendUp } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (n) => n ? n.toLocaleString("tr-TR") : "0";

export default function UniversiteAnaliziPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/universite-analizi?year=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;
  const { kpis } = data;
  const top15 = data.university_breakdown.slice(0, 15);

  return (
    <div data-testid="universite-analizi-page" className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Üniversite Sayısı" value={kpis.total_universities} icon={GraduationCap} color="blue" />
        <KPICard title="Toplam Başvuru" value={kpis.total_basvuru} icon={Users} color="teal" />
        <KPICard title="En Çok Başvuru" value={kpis.top_university} icon={TrendUp} color="green" />
        <KPICard title="En Yüksek Dönüşüm" value={`%${kpis.top_conversion}`} icon={ChartBar} color="amber" />
      </div>

      <ChartCard title="Üniversite Bazlı Başvuru ve İşe Alım" subtitle="Top 15 üniversite" testId="chart-uni-bars">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={top15} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="university" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={140} />
            <Tooltip {...DARK_TOOLTIP} />
            <Bar dataKey="basvuru" name="Başvuru" fill="#94A3B8" radius={[0, 3, 3, 0]} />
            <Bar dataKey="on_eleme" name="Ön Eleme" fill="#0EA5E9" radius={[0, 3, 3, 0]} />
            <Bar dataKey="mulakat" name="Mülakat" fill="#8B5CF6" radius={[0, 3, 3, 0]} />
            <Bar dataKey="hired" name="İşe Alım" fill="#14B8A6" radius={[0, 3, 3, 0]} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Üniversite Detay Tablosu" testId="table-uni-detail"
        headerRight={<ExcelExportButton data={data.university_breakdown} filename="universite-detay" sheetName="Üniversite Detay" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">Üniversite</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Başvuru</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Ön Eleme</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Mülakat</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">İşe Alım</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Dönüşüm</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Kişi Başı Maliyet</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.university_breakdown.map(u => (
              <TableRow key={u.university} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="text-slate-900 text-sm font-medium">{u.university}</TableCell>
                <TableCell className="text-center text-sm">{u.basvuru}</TableCell>
                <TableCell className="text-center text-sm">{u.on_eleme}</TableCell>
                <TableCell className="text-center text-sm">{u.mulakat}</TableCell>
                <TableCell className="text-center text-sm font-medium text-emerald-600">{u.hired}</TableCell>
                <TableCell className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${u.conversion > 10 ? "bg-emerald-100 text-emerald-700" : u.conversion > 5 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>%{u.conversion}</span></TableCell>
                <TableCell className="text-right text-sm">{u.cost_per_hire ? `₺${fmt(u.cost_per_hire)}` : "-"}</TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>
    </div>
  );
}
