import { useState, useEffect } from "react";
import axios from "axios";
import { CurrencyCircleDollar, Users, ChartBar, Briefcase } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ComposedChart, Line, PieChart, Pie, Cell } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (n) => n ? n.toLocaleString("tr-TR") : "0";
const fmtK = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : fmt(n);

export default function MaliyetAnaliziPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/ise-alim-maliyet?year=${year}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;
  const { kpis } = data;
  const costBreakdown = [
    { name: "İlan/Kanal", value: kpis.channel_total, fill: "#0EA5E9" },
    { name: "Mülakat", value: kpis.interview_total, fill: "#8B5CF6" },
    { name: "Onboarding", value: kpis.onboarding_total, fill: "#14B8A6" },
  ];

  return (
    <div data-testid="maliyet-analizi-page" className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="İşe Alınan" value={kpis.total_hired} icon={Users} color="blue" />
        <KPICard title="Toplam Maliyet" value={`₺${fmtK(kpis.total_cost)}`} icon={CurrencyCircleDollar} color="purple" />
        <KPICard title="Kişi Başı Ort." value={`₺${fmtK(kpis.avg_cost_per_hire)}`} icon={ChartBar} color="teal" />
        <KPICard title="İlan/Kanal" value={`₺${fmtK(kpis.channel_total)}`} icon={Briefcase} color="sky" />
        <KPICard title="Mülakat" value={`₺${fmtK(kpis.interview_total)}`} icon={Briefcase} color="violet" />
        <KPICard title="Onboarding" value={`₺${fmtK(kpis.onboarding_total)}`} icon={Briefcase} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Maliyet Bileşenleri" testId="chart-cost-pie">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" strokeWidth={0}>
              {costBreakdown.map(e => <Cell key={e.name} fill={e.fill} />)}
            </Pie><Tooltip {...DARK_TOOLTIP} formatter={(v) => `₺${fmt(v)}`} /></PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 -mt-1">
            {costBreakdown.map(b => <span key={b.name} className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.fill }} />{b.name}: ₺{fmtK(b.value)}</span>)}
          </div>
        </ChartCard>

        <ChartCard title="Aylık İşe Alım Maliyeti" testId="chart-monthly-cost">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v, n) => n === "Maliyet" ? `₺${fmt(v)}` : v} />
              <Bar yAxisId="left" dataKey="hired" name="Alınan" fill="#14B8A6" radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="cost" name="Maliyet" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Kanal Bazlı Maliyet Karşılaştırma" testId="chart-channel-cost">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.channel_costs}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
            <XAxis dataKey="source" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
            <Tooltip {...DARK_TOOLTIP} formatter={(v) => `₺${fmt(v)}`} />
            <Bar dataKey="avg_cost" name="Kişi Başı Maliyet" fill="#14B8A6" radius={[3, 3, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Departman Bazlı İşe Alım Gideri" testId="table-dept-cost">
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Departman</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Alım</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">İlan</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Mülakat</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Onboard</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Toplam</TableHead>
            </TableRow></TableHeader><TableBody>
              {data.department_costs.map(d => (
                <TableRow key={d.department} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="text-slate-900 text-sm font-medium">{d.department}</TableCell>
                  <TableCell className="text-center text-sm">{d.count}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmtK(d.channel_cost)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmtK(d.interview_cost)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmtK(d.onboarding_cost)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">₺{fmtK(d.total_cost)}</TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>

        <ChartCard title="Pozisyon Bazlı İşe Alım Maliyeti" testId="table-pos-cost">
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Band</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Alım</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Ort. Maliyet</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Toplam</TableHead>
            </TableRow></TableHeader><TableBody>
              {data.position_costs.slice(0, 15).map((p, i) => (
                <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="text-slate-900 text-sm">{p.position}</TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-slate-100">{p.band}</span></TableCell>
                  <TableCell className="text-center text-sm">{p.count}</TableCell>
                  <TableCell className="text-right text-sm">₺{fmt(p.avg_cost)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">₺{fmtK(p.total_cost)}</TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
