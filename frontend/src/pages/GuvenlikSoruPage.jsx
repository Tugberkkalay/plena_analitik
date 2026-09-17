import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, LineChart, Line, CartesianGrid } from "recharts";
import { ShieldCheck, Clock, Users, Warning, TrendUp, Hourglass, CheckCircle } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

export default function GuvenlikSoruPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/guvenlik-sorusturmasi?year=${year}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400" data-testid="guvenlik-loading">Yükleniyor...</div>;
  if (!data || data.kpis.total_basvuru === 0) return <div className="flex items-center justify-center h-64 text-slate-400" data-testid="guvenlik-empty">Güvenlik soruşturması verisi bulunmuyor.</div>;

  const { kpis, by_department, by_stage, sure_dagilimi, monthly_trend } = data;

  return (
    <div className="space-y-6" data-testid="guvenlik-soru-page">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KPICard label="Toplam Başvuru" value={kpis.total_basvuru?.toLocaleString("tr-TR")} icon={Users} testId="kpi-gs-total" />
        <KPICard label="Güvenlik Aşaması" value={kpis.guvenlik_asamasina_gelen} icon={ShieldCheck} testId="kpi-gs-reached" />
        <KPICard label="Güvenlik Geçen" value={kpis.guvenlik_gecen} icon={CheckCircle} testId="kpi-gs-passed" />
        <KPICard label="İşe Alınan" value={kpis.ise_alinan} icon={TrendUp} testId="kpi-gs-hired" />
        <KPICard label="Ort. Güvenlik Süresi" value={`${kpis.ort_guvenlik_suresi} gün`} icon={Clock} testId="kpi-gs-avgdays" />
        <KPICard label="Ort. Toplam Süre" value={`${kpis.ort_toplam_sure} gün`} icon={Hourglass} testId="kpi-gs-avgtotal" />
        <KPICard label="Güvenlik Geçiş %" value={`${kpis.guvenlik_gecis_orani}%`} icon={ShieldCheck} testId="kpi-gs-passrate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Funnel */}
        <ChartCard title="Aşama Bazlı Huni" subtitle="Başvurudan işe başlamaya kadar aday sayıları" testId="chart-gs-funnel">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={by_stage}>
              <XAxis dataKey="asama" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="aday_sayisi" name="Aday Sayısı" fill={CHART_COLORS[0]} radius={[4,4,0,0]}>
                <LabelList dataKey="aday_sayisi" position="top" style={{ fontSize: 11, fill: "#64748b" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Duration Distribution */}
        <ChartCard title="Güvenlik Soruşturması Süre Dağılımı" subtitle="Güvenlik aşamasının ne kadar sürdüğü" testId="chart-gs-duration">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sure_dagilimi}>
              <XAxis dataKey="aralik" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="aday_sayisi" name="Aday Sayısı" fill={CHART_COLORS[1]} radius={[4,4,0,0]}>
                <LabelList dataKey="aday_sayisi" position="top" style={{ fontSize: 11, fill: "#64748b" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Department Table */}
      <ChartCard title="Departman Bazlı Güvenlik Soruşturması" subtitle="Her departmanın başvuru, güvenlik geçişi ve ortalama süre metrikleri" testId="table-gs-dept"
        headerRight={<ExcelExportButton data={by_department} filename="guvenlik-departman" sheetName="Dept Güvenlik" />}>
        <div className="overflow-x-auto px-2">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100">
                <TableHead className="text-slate-400 text-xs">Departman</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">Başvuru</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">Güvenlik Aşaması</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">İşe Alınan</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">Ort. Güvenlik (gün)</TableHead>
                <TableHead className="text-slate-400 text-xs text-center">Geçiş %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {by_department.sort((a, b) => b.basvuru - a.basvuru).map(d => (
                <TableRow key={d.department} className="border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="text-sm font-medium text-slate-800">{d.department}</TableCell>
                  <TableCell className="text-sm text-center text-slate-600">{d.basvuru}</TableCell>
                  <TableCell className="text-sm text-center text-slate-600">{d.guvenlik_asamasi}</TableCell>
                  <TableCell className="text-sm text-center text-slate-600">{d.ise_alinan}</TableCell>
                  <TableCell className="text-sm text-center font-medium" style={{ color: d.ort_guvenlik_gun > 60 ? "#DC2626" : "#059669" }}>
                    {d.ort_guvenlik_gun > 0 ? `${d.ort_guvenlik_gun} gün` : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-center font-medium" style={{ color: d.gecis_orani >= 50 ? "#059669" : "#DC2626" }}>
                    {d.gecis_orani}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>

      {/* Monthly Trend */}
      {monthly_trend.length > 0 && (
        <ChartCard title="Aylık Güvenlik Soruşturması Tamamlanma Trendi" testId="chart-gs-monthly">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="ay" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip {...DARK_TOOLTIP} />
              <Line type="monotone" dataKey="tamamlanan" name="Tamamlanan" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
