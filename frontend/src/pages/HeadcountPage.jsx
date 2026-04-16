import { useState, useEffect } from "react";
import axios from "axios";
import { Users, GenderFemale, Star, CalendarBlank, Clock } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HeadcountPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/headcount?year=${year}`)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">No data available.</p>;

  const { kpis } = data;

  return (
    <div data-testid="headcount-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Total Headcount" value={kpis.headcount} icon={Users} color="blue" />
        <KPICard title="Female Leaders" value={kpis.female_leaders} icon={GenderFemale} color="amber" />
        <KPICard title="Talents" value={kpis.talents} icon={Star} color="green" />
        <KPICard title="Avg Age" value={kpis.avg_age} icon={CalendarBlank} color="orange" format="decimal" />
        <KPICard title="Avg Seniority" value={kpis.avg_seniority} icon={Clock} color="slate" format="decimal" subtitle="years" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Age by Gender Distribution" testId="chart-age-gender">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.age_gender}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="male" name="Male" fill="#0E7490" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="female" name="Female" fill="#F59E0B" stackId="a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Male</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />Female</span>
          </div>
        </ChartCard>

        <ChartCard title="Band by Gender" testId="chart-band-gender">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.band_gender}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="band" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="male" name="Male" fill="#0E7490" radius={[3, 3, 0, 0]} />
              <Bar dataKey="female" name="Female" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Male</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />Female</span>
          </div>
        </ChartCard>

        <ChartCard title="Department Distribution" testId="chart-dept-hc">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.department_distribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="value" fill="#0E7490" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Education Level" testId="chart-education">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.education_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" strokeWidth={0}>
                {data.education_distribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 -mt-2">
            {data.education_distribution.map((e, i) => (
              <span key={e.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{e.name}
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="City Distribution" testId="chart-city">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.city_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...DARK_TOOLTIP} />
              <Bar dataKey="value" fill="#F97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Marital Status" testId="chart-marital">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.marital_distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" strokeWidth={0}>
                {data.marital_distribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i + 2]} />)}
              </Pie>
              <Tooltip {...DARK_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 -mt-2">
            {data.marital_distribution.map((e, i) => (
              <span key={e.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i + 2] }} />{e.name}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Employee List" subtitle="Top 50 active employees" testId="chart-employee-list">
        <div className="overflow-x-auto px-2">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs">Name</TableHead>
                <TableHead className="text-slate-400 text-xs">Department</TableHead>
                <TableHead className="text-slate-400 text-xs">Position</TableHead>
                <TableHead className="text-slate-400 text-xs">Band</TableHead>
                <TableHead className="text-slate-400 text-xs">Age</TableHead>
                <TableHead className="text-slate-400 text-xs">Gender</TableHead>
                <TableHead className="text-slate-400 text-xs">City</TableHead>
                <TableHead className="text-slate-400 text-xs text-right">Salary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.employee_list?.map((e, i) => (
                <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="text-slate-900 text-sm font-medium">{e.name}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{e.department}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{e.job_title}</TableCell>
                  <TableCell><span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{e.band}</span></TableCell>
                  <TableCell className="text-slate-600 text-sm">{e.age}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{e.gender}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{e.city}</TableCell>
                  <TableCell className="text-slate-700 text-sm text-right">{e.salary?.toLocaleString()} TL</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </div>
  );
}
