import { useState, useEffect } from "react";
import axios from "axios";
import { UserPlus, UserMinus, CalendarBlank, ShieldCheck, Target, CurrencyCircleDollar, ChartBar, Warning, TrendUp, TrendDown, Minus, Briefcase, HandCoins } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (n) => n ? n.toLocaleString("tr-TR") : "0";
const fmtK = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}K` : fmt(n);

// ---- Hires Tab ----
function HiresTab({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartCard title="Aylık Alımlar" className="lg:col-span-2" testId="chart-hires-month">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.hires_by_month}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="count" name="Alım" fill="#14B8A6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Cinsiyet Dağılımı" testId="chart-hire-gender">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={data.gender_distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" strokeWidth={0}>
              {data.gender_distribution.map((e, i) => <Cell key={e.name} fill={CHART_COLORS[i]} />)}
            </Pie><Tooltip {...DARK_TOOLTIP} /></PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 -mt-2">
            {data.gender_distribution.map((g, i) => <span key={g.name} className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />{g.name}: {g.value}</span>)}
          </div>
        </ChartCard>
        <ChartCard title="Departman Bazlı Alım" testId="chart-hire-dept">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.department_distribution} layout="vertical">
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={85} />
              <Tooltip {...DARK_TOOLTIP} /><Bar dataKey="value" fill="#14B8A6" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Eğitim Düzeyi" testId="chart-hire-edu">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.education_distribution}>
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} /><Bar dataKey="value" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Band Dağılımı" testId="chart-hire-band">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.band_distribution}>
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} /><Bar dataKey="value" fill="#0E7490" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Son Alımlar" testId="chart-hire-list"
        headerRight={<ExcelExportButton data={data.employee_list} filename="son-alimlar" sheetName="Alımlar" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead className="text-slate-400 text-xs">İsim</TableHead><TableHead className="text-slate-400 text-xs">Departman</TableHead>
            <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead><TableHead className="text-slate-400 text-xs">Band</TableHead>
            <TableHead className="text-slate-400 text-xs">İşe Giriş</TableHead><TableHead className="text-slate-400 text-xs">Cinsiyet</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.employee_list?.slice(0, 15).map((e, i) => (
              <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="text-slate-900 text-sm font-medium">{e.name}</TableCell>
                <TableCell className="text-slate-600 text-sm">{e.department}</TableCell>
                <TableCell className="text-slate-600 text-sm">{e.job_title}</TableCell>
                <TableCell><span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{e.band}</span></TableCell>
                <TableCell className="text-slate-600 text-sm">{e.hire_date}</TableCell>
                <TableCell className="text-slate-600 text-sm">{e.gender}</TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>
    </div>
  );
}

// ---- Leaves Tab ----
function LeavesTab({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ChartCard title="Aylık Ayrılmalar" className="lg:col-span-2" testId="chart-leaves-month">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.leaves_by_month}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} /><Bar dataKey="count" name="Ayrılma" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Ayrılma Sebepleri" testId="chart-leave-reasons">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.leaving_reasons} layout="vertical">
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="reason" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip {...DARK_TOOLTIP} /><Bar dataKey="count" fill="#EF4444" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Departman Bazlı Ayrılma" testId="chart-leave-dept">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.department_distribution} layout="vertical">
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={85} />
              <Tooltip {...DARK_TOOLTIP} /><Bar dataKey="value" fill="#F97316" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Son Ayrılmalar" testId="chart-leave-list"
        headerRight={<ExcelExportButton data={data.employee_list} filename="son-ayrilmalar" sheetName="Ayrılmalar" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead className="text-slate-400 text-xs">İsim</TableHead><TableHead className="text-slate-400 text-xs">Departman</TableHead>
            <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead><TableHead className="text-slate-400 text-xs">Çıkış Tarihi</TableHead>
            <TableHead className="text-slate-400 text-xs">Sebep</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.employee_list?.slice(0, 15).map((e, i) => (
              <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="text-slate-900 text-sm font-medium">{e.name}</TableCell>
                <TableCell className="text-slate-600 text-sm">{e.department}</TableCell>
                <TableCell className="text-slate-600 text-sm">{e.job_title}</TableCell>
                <TableCell className="text-slate-600 text-sm">{e.termination_date}</TableCell>
                <TableCell><span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-700">{e.leaving_reason}</span></TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>
    </div>
  );
}

// ---- Kadro Planlama Tab ----
function HiringPlanTab({ data }) {
  if (!data) return null;
  const { kpis } = data;
  return (
    <div data-testid="hiring-plan-tab" className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Hedef Kadro" value={kpis.total_target} icon={Target} color="blue" />
        <KPICard title="Mevcut" value={kpis.total_current} icon={Briefcase} color="teal" />
        <KPICard title="Alınan" value={kpis.total_hired} icon={UserPlus} color="green" />
        <KPICard title="Kadro Açığı" value={kpis.total_gap} icon={Warning} color="red" />
        <KPICard title="Doluluk" value={kpis.fill_rate} icon={ChartBar} color="amber" format="percent" />
        <KPICard title="Toplam Maliyet" value={fmtK(kpis.total_cost)} icon={CurrencyCircleDollar} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Departman Bazlı Kadro Durumu" testId="chart-dept-plan">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.department_plan} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="department" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={85} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="target" name="Hedef" fill="#94A3B8" radius={[0, 3, 3, 0]} />
              <Bar dataKey="current" name="Mevcut" fill="#14B8A6" radius={[0, 3, 3, 0]} />
              <Bar dataKey="hired" name="Alınan" fill="#0E7490" radius={[0, 3, 3, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Çeyrek Bazlı Alım & Maliyet" testId="chart-quarterly">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.quarterly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="quarter" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v, n) => n === "Maliyet" ? `₺${fmt(v)}` : v} />
              <Bar yAxisId="left" dataKey="hired" name="Alınan" fill="#14B8A6" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="left" dataKey="left" name="Ayrılan" fill="#EF4444" radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="cost" name="Maliyet" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Alım Sebepleri" testId="chart-hire-reasons">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={data.hiring_reasons} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="count" nameKey="reason" strokeWidth={0}>
              {data.hiring_reasons.map((e, i) => <Cell key={e.reason} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie><Tooltip {...DARK_TOOLTIP} /></PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 -mt-1">
            {data.hiring_reasons.map((r, i) => <span key={r.reason} className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{r.reason}: {r.count}</span>)}
          </div>
        </ChartCard>
        <ChartCard title="Aylık Net Hareket" testId="chart-monthly-net">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="net" name="Net" radius={[3, 3, 0, 0]}>
                {data.monthly.map((m, i) => <Cell key={i} fill={m.net >= 0 ? "#14B8A6" : "#EF4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ---- Teklif Analizi Tab ----
function OfferAnalysisTab({ data }) {
  if (!data) return null;
  const { kpis, benchmark_comparison: bench } = data;
  const benchData = [
    { name: "Üstünde", value: bench.above, fill: "#14B8A6" },
    { name: "Ortalamada", value: bench.at_avg, fill: "#F59E0B" },
    { name: "Altında", value: bench.below, fill: "#EF4444" },
  ];
  return (
    <div data-testid="offer-analysis-tab" className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Toplam Teklif" value={kpis.total_offers} icon={HandCoins} color="blue" />
        <KPICard title="Kabul" value={kpis.accepted} icon={UserPlus} color="green" />
        <KPICard title="Red" value={kpis.rejected} icon={UserMinus} color="red" />
        <KPICard title="Bekleyen" value={kpis.pending} icon={CalendarBlank} color="amber" />
        <KPICard title="Kabul Oranı" value={kpis.accept_rate} icon={ChartBar} color="teal" format="percent" />
        <KPICard title="Ort. Teklif" value={`₺${fmtK(kpis.avg_offer_salary)}`} icon={CurrencyCircleDollar} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Red Sebepleri" testId="chart-rej-reasons">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.rejection_reasons} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="reason" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v, n, p) => [`${v} (%${p.payload.pct})`, n]} />
              <Bar dataKey="count" name="Red" fill="#EF4444" radius={[0, 3, 3, 0]}>
                {data.rejection_reasons.map((r, i) => <Cell key={r.reason} fill={i === 0 ? "#EF4444" : i === 1 ? "#F97316" : "#F59E0B"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Teklif vs Sektör Ortalaması" testId="chart-bench-compare">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={benchData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" strokeWidth={0}>
              {benchData.map((e) => <Cell key={e.name} fill={e.fill} />)}
            </Pie><Tooltip {...DARK_TOOLTIP} /></PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 -mt-1">
            {benchData.map((b) => <span key={b.name} className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.fill }} />{b.name}: {b.value}</span>)}
          </div>
        </ChartCard>
        <ChartCard title="Band Bazlı Teklif vs Sektör" className="lg:col-span-2" testId="chart-band-offers">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.band_offers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="band" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `₺${fmt(v)}`} />
              <Bar dataKey="avg_offer" name="Ort. Teklif" fill="#14B8A6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="sector_avg" name="Sektör Ort." fill="#94A3B8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="benchmark_mid" name="Band Orta Noktası" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Departman Teklif Özeti" testId="chart-dept-offers"
        headerRight={<ExcelExportButton data={data.department_offers} filename="dept-teklif-ozeti" sheetName="Dept Teklif" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">Departman</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Teklif</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Kabul</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Red</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Kabul %</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Ort. Maaş</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.department_offers.map((d) => (
              <TableRow key={d.department} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="text-slate-900 text-sm font-medium">{d.department}</TableCell>
                <TableCell className="text-center text-sm">{d.total}</TableCell>
                <TableCell className="text-center text-sm text-emerald-600 font-medium">{d.accepted}</TableCell>
                <TableCell className="text-center text-sm text-red-600 font-medium">{d.rejected}</TableCell>
                <TableCell className="text-center text-sm">%{d.accept_rate}</TableCell>
                <TableCell className="text-right text-sm font-medium">₺{fmt(d.avg_salary)}</TableCell>
              </TableRow>))}
          </TableBody></Table>
        </div>
      </ChartCard>
    </div>
  );
}

// ---- Ücret Kıyaslama Tab ----
const VS_BADGE = { "Üstünde": "bg-emerald-50 text-emerald-700", "Altında": "bg-red-50 text-red-700", "Ortalamada": "bg-amber-50 text-amber-700" };
const VS_ICON = { "Üstünde": TrendUp, "Altında": TrendDown, "Ortalamada": Minus };

function CompBenchmarkTab({ data }) {
  if (!data) return null;
  const { kpis } = data;
  const distData = [
    { name: "Üstünde", value: kpis.above_sector, fill: "#14B8A6" },
    { name: "Ortalamada", value: kpis.at_sector, fill: "#F59E0B" },
    { name: "Altında", value: kpis.below_sector, fill: "#EF4444" },
  ];
  return (
    <div data-testid="comp-benchmark-tab" className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Çalışan" value={kpis.total_employees} icon={Briefcase} color="blue" />
        <KPICard title="Ort. Maaş" value={`₺${fmtK(kpis.avg_salary)}`} icon={CurrencyCircleDollar} color="teal" />
        <KPICard title="Sektör Üstü" value={kpis.above_sector} icon={TrendUp} color="green" />
        <KPICard title="Sektör Altı" value={kpis.below_sector} icon={TrendDown} color="red" />
        <KPICard title="Ortalamada" value={kpis.at_sector} icon={Minus} color="amber" />
        <KPICard title="Compa Ratio" value={kpis.avg_compa_ratio} icon={ChartBar} color="purple" format="decimal" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Sektör Kıyaslama Dağılımı" testId="chart-comp-dist">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={distData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" strokeWidth={0}>
              {distData.map((e) => <Cell key={e.name} fill={e.fill} />)}
            </Pie><Tooltip {...DARK_TOOLTIP} /></PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 -mt-1">
            {distData.map((b) => <span key={b.name} className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.fill }} />{b.name}: {b.value}</span>)}
          </div>
        </ChartCard>
        <ChartCard title="Band Bazlı Maaş vs Sektör" testId="chart-band-comp">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.band_summary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="band" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip {...DARK_TOOLTIP} formatter={(v) => `₺${fmt(v)}`} />
              <Bar dataKey="avg_salary" name="Şirket Ort." fill="#14B8A6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="sector_avg" name="Sektör Ort." fill="#94A3B8" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Departman Bazlı Ücret Karşılaştırma" className="lg:col-span-2" testId="chart-dept-comp"
          headerRight={<ExcelExportButton data={data.department_summary} filename="dept-ucret-kiyaslama" sheetName="Dept Ücret" />}>
          <div className="overflow-x-auto px-2">
            <Table><TableHeader><TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Departman</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Kişi</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Ort. Maaş</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Min</TableHead>
              <TableHead className="text-slate-400 text-xs text-right">Max</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Sektör Üstü</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Sektör Altı</TableHead>
            </TableRow></TableHeader><TableBody>
              {data.department_summary.map((d) => (
                <TableRow key={d.department} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="text-slate-900 text-sm font-medium">{d.department}</TableCell>
                  <TableCell className="text-center text-sm">{d.count}</TableCell>
                  <TableCell className="text-right text-sm font-medium">₺{fmt(d.avg_salary)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmt(d.min)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmt(d.max)}</TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700">{d.above_sector}</span></TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-700">{d.below_sector}</span></TableCell>
                </TableRow>))}
            </TableBody></Table>
          </div>
        </ChartCard>
      </div>
      <ChartCard title="Kişi Bazlı Ücret Kıyaslama (Top 50)" testId="chart-emp-comp"
        headerRight={<ExcelExportButton data={data.employee_list?.slice(0, 50)} filename="kisi-ucret-kiyaslama" sheetName="Kişi Ücret" />}>
        <div className="overflow-x-auto px-2">
          <Table><TableHeader><TableRow className="border-slate-100">
            <TableHead className="text-slate-400 text-xs">İsim</TableHead>
            <TableHead className="text-slate-400 text-xs">Departman</TableHead>
            <TableHead className="text-slate-400 text-xs">Pozisyon</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Band</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Maaş</TableHead>
            <TableHead className="text-slate-400 text-xs text-right">Sektör Ort.</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">vs Sektör</TableHead>
            <TableHead className="text-slate-400 text-xs text-center">Compa</TableHead>
          </TableRow></TableHeader><TableBody>
            {data.employee_list?.slice(0, 50).map((e, i) => {
              const Icon = VS_ICON[e.vs_sector] || Minus;
              return (
                <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="text-slate-900 text-sm font-medium">{e.name}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{e.department}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{e.position}</TableCell>
                  <TableCell className="text-center"><span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{e.band}</span></TableCell>
                  <TableCell className="text-right text-sm font-medium">₺{fmt(e.salary)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">₺{fmt(e.sector_avg)}</TableCell>
                  <TableCell className="text-center"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${VS_BADGE[e.vs_sector] || ""}`}><Icon size={10} />{e.vs_sector}</span></TableCell>
                  <TableCell className="text-center text-sm font-medium" style={{ color: e.compa_ratio >= 1 ? "#14B8A6" : "#EF4444" }}>{e.compa_ratio}</TableCell>
                </TableRow>);
            })}
          </TableBody></Table>
        </div>
      </ChartCard>
    </div>
  );
}

// ---- Main Page ----
export default function HiresLeavesPage({ year, country }) {
  const [hires, setHires] = useState(null);
  const [leaves, setLeaves] = useState(null);
  const [hiringPlan, setHiringPlan] = useState(null);
  const [offerData, setOfferData] = useState(null);
  const [compData, setCompData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hires");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/dashboard/hires?year=${year}`),
      axios.get(`${API}/dashboard/leaves?year=${year}`),
      axios.get(`${API}/dashboard/hiring-plan?year=${year}`),
      axios.get(`${API}/dashboard/offer-analysis?year=${year}`),
      axios.get(`${API}/dashboard/compensation-benchmark?year=${year}`),
    ]).then(([h, l, hp, oa, cb]) => {
      setHires(h.data); setLeaves(l.data); setHiringPlan(hp.data); setOfferData(oa.data); setCompData(cb.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;

  return (
    <div data-testid="hires-leaves-page" className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Toplam Alım" value={hires?.kpis?.total_hires || 0} icon={UserPlus} color="green" />
        <KPICard title="Toplam Ayrılma" value={leaves?.kpis?.total_leaves || 0} icon={UserMinus} color="red" />
        <KPICard title="Elde Tutma" value={hires?.kpis?.retention_rate || 0} icon={ShieldCheck} color="blue" format="percent" />
        <KPICard title="Kadro Doluluk" value={hiringPlan?.kpis?.fill_rate || 0} icon={Target} color="amber" format="percent" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger data-testid="tab-hires" value="hires" className="data-[state=active]:bg-teal-600/15 data-[state=active]:text-teal-700 text-xs">Alımlar</TabsTrigger>
          <TabsTrigger data-testid="tab-leaves" value="leaves" className="data-[state=active]:bg-red-600/15 data-[state=active]:text-red-700 text-xs">Ayrılmalar</TabsTrigger>
          <TabsTrigger data-testid="tab-plan" value="plan" className="data-[state=active]:bg-blue-600/15 data-[state=active]:text-blue-700 text-xs">Kadro Planlama</TabsTrigger>
          <TabsTrigger data-testid="tab-offers" value="offers" className="data-[state=active]:bg-purple-600/15 data-[state=active]:text-purple-700 text-xs">Teklif Analizi</TabsTrigger>
          <TabsTrigger data-testid="tab-comp" value="comp" className="data-[state=active]:bg-amber-600/15 data-[state=active]:text-amber-700 text-xs">Ücret Kıyaslama</TabsTrigger>
        </TabsList>
        <TabsContent value="hires" className="mt-4"><HiresTab data={hires} /></TabsContent>
        <TabsContent value="leaves" className="mt-4"><LeavesTab data={leaves} /></TabsContent>
        <TabsContent value="plan" className="mt-4"><HiringPlanTab data={hiringPlan} /></TabsContent>
        <TabsContent value="offers" className="mt-4"><OfferAnalysisTab data={offerData} /></TabsContent>
        <TabsContent value="comp" className="mt-4"><CompBenchmarkTab data={compData} /></TabsContent>
      </Tabs>
    </div>
  );
}
