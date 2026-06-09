import { useState, useEffect } from "react";
import axios from "axios";
import { UserPlus, UserMinus, CalendarBlank, ShieldCheck } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HiresLeavesPage({ year, country }) {
  const [hires, setHires] = useState(null);
  const [leaves, setLeaves] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/dashboard/hires?year=${year}`),
      axios.get(`${API}/dashboard/leaves?year=${year}`),
    ]).then(([h, l]) => { setHires(h.data); setLeaves(l.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!hires || !leaves) return <p className="text-slate-400">No data available.</p>;

  return (
    <div data-testid="hires-leaves-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Hires" value={hires.kpis.total_hires} icon={UserPlus} color="green" />
        <KPICard title="Total Leaves" value={leaves.kpis.total_leaves} icon={UserMinus} color="red" />
        <KPICard title="Avg Hire Age" value={hires.kpis.avg_age} icon={CalendarBlank} color="amber" format="decimal" />
        <KPICard title="Retention Rate" value={hires.kpis.retention_rate} icon={ShieldCheck} color="blue" format="percent" />
      </div>

      <Tabs defaultValue="hires" className="w-full">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger data-testid="tab-hires" value="hires" className="data-[state=active]:bg-teal-600/15 data-[state=active]:text-teal-700">Hires</TabsTrigger>
          <TabsTrigger data-testid="tab-leaves" value="leaves" className="data-[state=active]:bg-red-600/15 data-[state=active]:text-red-700">Leaves</TabsTrigger>
        </TabsList>

        <TabsContent value="hires" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChartCard title="Hires by Month" className="lg:col-span-2" testId="chart-hires-month">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={hires.hires_by_month}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                  <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...DARK_TOOLTIP} />
                  <Bar dataKey="count" name="Hires" fill="#14B8A6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Gender Split" testId="chart-hire-gender">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={hires.gender_distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" strokeWidth={0}>
                    {hires.gender_distribution.map((entry, i) => <Cell key={`hg-${entry.name}`} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Tooltip {...DARK_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 -mt-2">
                {hires.gender_distribution.map((g, i) => (
                  <span key={g.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />{g.name}: {g.value}
                  </span>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Hires by Department" testId="chart-hire-dept">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={hires.department_distribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                  <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={85} />
                  <Tooltip {...DARK_TOOLTIP} />
                  <Bar dataKey="value" fill="#14B8A6" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Education Level" testId="chart-hire-edu">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={hires.education_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...DARK_TOOLTIP} />
                  <Bar dataKey="value" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Band Distribution" testId="chart-hire-band">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={hires.band_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...DARK_TOOLTIP} />
                  <Bar dataKey="value" fill="#0E7490" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <ChartCard title="Recent Hires" testId="chart-hire-list">
            <div className="overflow-x-auto px-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="text-slate-400 text-xs">Name</TableHead>
                    <TableHead className="text-slate-400 text-xs">Department</TableHead>
                    <TableHead className="text-slate-400 text-xs">Position</TableHead>
                    <TableHead className="text-slate-400 text-xs">Band</TableHead>
                    <TableHead className="text-slate-400 text-xs">Hire Date</TableHead>
                    <TableHead className="text-slate-400 text-xs">Gender</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hires.employee_list?.slice(0, 15).map((e, i) => (
                    <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                      <TableCell className="text-slate-900 text-sm font-medium">{e.name}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{e.department}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{e.job_title}</TableCell>
                      <TableCell><span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{e.band}</span></TableCell>
                      <TableCell className="text-slate-600 text-sm">{e.hire_date}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{e.gender}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ChartCard>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChartCard title="Leaves by Month" className="lg:col-span-2" testId="chart-leaves-month">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={leaves.leaves_by_month}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                  <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...DARK_TOOLTIP} />
                  <Bar dataKey="count" name="Leaves" fill="#EF4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Leaving Reasons" testId="chart-leave-reasons">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={leaves.leaving_reasons} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                  <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="reason" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip {...DARK_TOOLTIP} />
                  <Bar dataKey="count" fill="#EF4444" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Leave Gender Split" testId="chart-leave-gender">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={leaves.gender_distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" strokeWidth={0}>
                    {leaves.gender_distribution.map((entry, i) => <Cell key={`lg-${entry.name}`} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Tooltip {...DARK_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 -mt-2">
                {leaves.gender_distribution.map((g, i) => (
                  <span key={g.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />{g.name}: {g.value}
                  </span>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Leaves by Department" testId="chart-leave-dept">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={leaves.department_distribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                  <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={85} />
                  <Tooltip {...DARK_TOOLTIP} />
                  <Bar dataKey="value" fill="#F97316" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <ChartCard title="Recent Departures" testId="chart-leave-list">
            <div className="overflow-x-auto px-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="text-slate-400 text-xs">Name</TableHead>
                    <TableHead className="text-slate-400 text-xs">Department</TableHead>
                    <TableHead className="text-slate-400 text-xs">Position</TableHead>
                    <TableHead className="text-slate-400 text-xs">Exit Date</TableHead>
                    <TableHead className="text-slate-400 text-xs">Reason</TableHead>
                    <TableHead className="text-slate-400 text-xs">Gender</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.employee_list?.slice(0, 15).map((e, i) => (
                    <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                      <TableCell className="text-slate-900 text-sm font-medium">{e.name}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{e.department}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{e.job_title}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{e.termination_date}</TableCell>
                      <TableCell><span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-700">{e.leaving_reason}</span></TableCell>
                      <TableCell className="text-slate-600 text-sm">{e.gender}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
