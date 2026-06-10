import { useState, useEffect } from "react";
import axios from "axios";
import { TrendDown, ArrowsClockwise, Star, UserMinus, Lightning } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, ComposedChart, Area } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TurnoverPage({ year, country }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ year });
    if (country) params.append("country", country);
    axios.get(`${API}/dashboard/turnover?${params}`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, country]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis } = data;

  return (
    <div data-testid="turnover-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Devir Oranı" value={kpis.turnover_rate} icon={TrendDown} color="red" format="percent" />
        <KPICard title="Gönüllü" value={kpis.voluntary_rate} icon={ArrowsClockwise} color="amber" format="percent" />
        <KPICard title="Zorunlu" value={kpis.involuntary_rate} icon={UserMinus} color="orange" format="percent" />
        <KPICard title="Yetenek Kaybı" value={kpis.talent_turnover} icon={Star} color="blue" format="percent" />
        <KPICard title="Yeni İşe Alım Kaybı" value={kpis.new_hire_turnover} icon={Lightning} color="slate" format="percent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Aylık Devir & Kümülatif" testId="chart-turnover-monthly">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data.turnover_by_month}>
              <defs>
                <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="rate" name="Aylık %" fill="#EF4444" radius={[3, 3, 0, 0]} />
              <Area type="monotone" dataKey="cumulative" name="Kümülatif %" stroke="#F59E0B" fill="url(#cumGrad)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Monthly</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />Cumulative</span>
          </div>
        </ChartCard>

        <ChartCard title="Ayrılma Nedenleri" testId="chart-leaving-reasons">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.leaving_reasons} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="reason" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" fill="#F97316" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Departman Bazlı Devir" testId="chart-turnover-dept">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.turnover_by_department}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" name="Devir %" fill="#0E7490" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Yaş Grubu Bazlı Devir" testId="chart-turnover-age">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.turnover_by_age}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" name="Devir %" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cinsiyet Bazlı Devir" testId="chart-turnover-gender">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.turnover_by_gender}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="gender" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" name="Devir %" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Yıllık Devir Trendi" testId="chart-turnover-yearly">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.turnover_by_year}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="year" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="rate" name="Devir %" stroke="#0E7490" strokeWidth={2.5} dot={{ fill: "#0E7490", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
