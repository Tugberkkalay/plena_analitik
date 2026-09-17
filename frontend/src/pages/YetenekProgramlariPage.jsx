import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { GraduationCap, Users, CheckCircle, TrendUp, UserPlus, ShieldCheck } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

export default function YetenekProgramlariPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/yetenek-programlari?year=${year}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400" data-testid="yetenek-loading">Yükleniyor...</div>;
  if (!data || data.kpis.total === 0) return <div className="flex items-center justify-center h-64 text-slate-400" data-testid="yetenek-empty">Bu tenant için yetenek programı verisi bulunmuyor.</div>;

  const { kpis, by_program, by_year, by_gender, by_university } = data;

  return (
    <div className="space-y-6" data-testid="yetenek-programlari-page">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KPICard label="Toplam Katılımcı" value={kpis.total} icon={Users} testId="kpi-yetenek-total" />
        <KPICard label="Tamamlayan" value={kpis.completed} icon={CheckCircle} testId="kpi-yetenek-completed" />
        <KPICard label="İşe Alınan" value={kpis.hired} icon={UserPlus} testId="kpi-yetenek-hired" />
        <KPICard label="İlk Yıl Kalan" value={kpis.retained} icon={ShieldCheck} testId="kpi-yetenek-retained" />
        <KPICard label="Tamamlama %" value={`${kpis.completion_rate}%`} icon={TrendUp} testId="kpi-yetenek-comprate" />
        <KPICard label="İşe Alım %" value={`${kpis.hire_rate}%`} icon={TrendUp} testId="kpi-yetenek-hirerate" />
        <KPICard label="Retention %" value={`${kpis.retention_rate}%`} icon={TrendUp} testId="kpi-yetenek-retrate" />
      </div>

      {/* Program Breakdown Table */}
      <ChartCard title="Program Bazlı Dönüşüm" subtitle="Her programın katılımcı, tamamlama ve işe alım metrikleri" testId="table-yetenek-program"
        headerRight={<ExcelExportButton data={by_program} filename="yetenek-program" sheetName="Program Bazlı" />}>
        <div className="overflow-x-auto px-2">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                <TableHead className="text-slate-400 text-xs">Program</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">Katılımcı</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">Tamamlayan</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">İşe Alınan</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">İlk Yıl Kalan</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">Tamamlama %</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">İşe Alım %</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">Retention %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {by_program.map(p => (
                <TableRow key={p.program} className="border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="text-sm font-medium text-slate-800">{p.program}</TableCell>
                  <TableCell className="text-sm text-center text-slate-600">{p.total}</TableCell>
                  <TableCell className="text-sm text-center text-slate-600">{p.tamamlayan}</TableCell>
                  <TableCell className="text-sm text-center text-slate-600">{p.ise_alınan}</TableCell>
                  <TableCell className="text-sm text-center text-slate-600">{p.kalan}</TableCell>
                  <TableCell className="text-sm text-center font-medium" style={{ color: p.tamamlama_orani >= 70 ? "#059669" : "#DC2626" }}>{p.tamamlama_orani}%</TableCell>
                  <TableCell className="text-sm text-center font-medium" style={{ color: p.ise_alim_orani >= 30 ? "#059669" : "#DC2626" }}>{p.ise_alim_orani}%</TableCell>
                  <TableCell className="text-sm text-center font-medium" style={{ color: p.retention_orani >= 70 ? "#059669" : "#DC2626" }}>{p.retention_orani}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Year */}
        <ChartCard title="Yıl Bazlı Katılım Trendi" testId="chart-yetenek-year">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={by_year}>
              <XAxis dataKey="donem" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="katilimci" name="Katılımcı" fill={CHART_COLORS[0]} radius={[4,4,0,0]} />
              <Bar dataKey="tamamlayan" name="Tamamlayan" fill={CHART_COLORS[2]} radius={[4,4,0,0]} />
              <Bar dataKey="ise_alinan" name="İşe Alınan" fill={CHART_COLORS[1]} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* By Gender */}
        <ChartCard title="Cinsiyet Dağılımı" testId="chart-yetenek-gender">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={by_gender} dataKey="sayi" nameKey="cinsiyet" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ cinsiyet, sayi }) => `${cinsiyet === "Male" ? "Erkek" : "Kadın"}: ${sayi}`}>
                {by_gender.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Universities */}
      <ChartCard title="Üniversite Dağılımı (Top 15)" testId="chart-yetenek-uni"
        headerRight={<ExcelExportButton data={by_university} filename="yetenek-universite" sheetName="Üniversite" />}>
        <ResponsiveContainer width="100%" height={Math.max(300, by_university.length * 32)}>
          <BarChart data={by_university} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis type="category" dataKey="universite" width={180} tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip {...DARK_TOOLTIP} />
            <Bar dataKey="sayi" name="Katılımcı" fill={CHART_COLORS[0]} radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
