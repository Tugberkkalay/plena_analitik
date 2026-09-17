import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { ClipboardText, UserMinus, Handshake, ChartLine, TrendUp, TrendDown, Users, Clock, Smiley, Warning } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import ExcelExportButton from "@/components/ExcelExportButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

export default function AnketAnaliziPage() {
  const [tab, setTab] = useState("engagement");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/survey-analytics?survey_type=${tab}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="space-y-6" data-testid="anket-analizi-page">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="engagement" data-testid="tab-engagement" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Bağlılık Anketi</TabsTrigger>
          <TabsTrigger value="exit" data-testid="tab-exit" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Çıkış Mülakatı</TabsTrigger>
          <TabsTrigger value="onboarding" data-testid="tab-onboarding" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Onboarding</TabsTrigger>
          <TabsTrigger value="pulse" data-testid="tab-pulse" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Pulse Anket</TabsTrigger>
        </TabsList>

        {loading ? <div className="flex items-center justify-center h-64 text-slate-400">Yükleniyor...</div> : !data || !data.kpis ? <div className="flex items-center justify-center h-64 text-slate-400">Veri bulunamadı</div> : (
          <>
            <TabsContent value="engagement"><EngagementView data={data} /></TabsContent>
            <TabsContent value="exit"><ExitView data={data} /></TabsContent>
            <TabsContent value="onboarding"><OnboardingView data={data} /></TabsContent>
            <TabsContent value="pulse"><PulseView data={data} /></TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function EngagementView({ data }) {
  const { kpis, questions, trends, benchmarks } = data;
  const scaleQs = (questions || []).filter(q => q.type === "scale");
  const radarData = scaleQs.map(q => ({ subject: q.category, score: q.avg, benchmark: q.benchmark }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard label="Bağlılık Skoru" value={`${kpis.avg_engagement}/10`} icon={Smiley} testId="kpi-eng-score" />
        <KPICard label="eNPS" value={kpis.enps} icon={TrendUp} testId="kpi-eng-enps" />
        <KPICard label="Promoters" value={kpis.promoters} icon={TrendUp} testId="kpi-eng-prom" />
        <KPICard label="Detractors" value={kpis.detractors} icon={TrendDown} testId="kpi-eng-det" />
        <KPICard label="Yanıt Sayısı" value={kpis.participation?.toLocaleString("tr-TR")} icon={Users} testId="kpi-eng-part" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Soru Bazlı Ortalama vs Benchmark" subtitle="Yeşil = benchmark üstü, Kırmızı = altı" testId="chart-eng-radar">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Radar name="Skor" dataKey="score" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.3} />
              <Radar name="Benchmark" dataKey="benchmark" stroke="#F59E0B" fill="none" strokeDasharray="5 5" />
              <Legend />
              <Tooltip {...DARK_TOOLTIP} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        {trends.length > 0 && (
          <ChartCard title="Aylık Bağlılık Trendi" testId="chart-eng-trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip {...DARK_TOOLTIP} />
                <Line type="monotone" dataKey="avg_engagement" name="Ort. Bağlılık" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
      <QuestionDetailTable questions={scaleQs} title="Soru Detayları & Benchmark Karşılaştırma" />
    </div>
  );
}

function ExitView({ data }) {
  const { kpis, questions, trends, reasons } = data;
  const scaleQs = (questions || []).filter(q => q.type === "scale");
  const catQs = (questions || []).filter(q => q.type === "category");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KPICard label="Toplam Çıkış" value={kpis.total_exits} icon={UserMinus} testId="kpi-exit-total" />
        <KPICard label="Gönüllü" value={`${kpis.voluntary_pct}%`} icon={Warning} testId="kpi-exit-vol" />
        <KPICard label="Ort. Kıdem (Ay)" value={kpis.avg_tenure_months} icon={Clock} testId="kpi-exit-tenure" />
        <KPICard label="Tavsiye Skoru" value={`${kpis.avg_recommend}/5`} icon={Smiley} testId="kpi-exit-rec" />
        <KPICard label="Geri Dönüş İsteği" value={`${kpis.would_return_pct}%`} icon={TrendUp} testId="kpi-exit-return" />
        <KPICard label="Gönüllü Sayı" value={kpis.voluntary} icon={UserMinus} testId="kpi-exit-volcount" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reasons && reasons.length > 0 && (
          <ChartCard title="Ayrılma Nedeni Dağılımı" testId="chart-exit-reasons"
            headerRight={<ExcelExportButton data={reasons} filename="cikis-nedenleri" sheetName="Nedenler" />}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reasons} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis type="category" dataKey="reason" width={140} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip {...DARK_TOOLTIP} />
                <Bar dataKey="count" name="Kişi" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {trends.length > 0 && (
          <ChartCard title="Aylık Çıkış Trendi" testId="chart-exit-trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip {...DARK_TOOLTIP} />
                <Line type="monotone" dataKey="count" name="Çıkış Sayısı" stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="avg_recommend" name="Ort. Tavsiye" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
      <QuestionDetailTable questions={scaleQs} title="Çıkış Mülakatı Soru Detayları" />
    </div>
  );
}

function OnboardingView({ data }) {
  const { kpis, questions, trends } = data;
  const scaleQs = (questions || []).filter(q => q.type === "scale");
  const radarData = scaleQs.map(q => ({ subject: q.category, score: q.avg, benchmark: q.benchmark }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Yanıt Sayısı" value={kpis.total_responses} icon={ClipboardText} testId="kpi-onb-total" />
        <KPICard label="Genel Ort." value={`${kpis.avg_overall}/5`} icon={Smiley} testId="kpi-onb-avg" />
        <KPICard label="Memnuniyet %" value={`${kpis.satisfaction_pct}%`} icon={TrendUp} testId="kpi-onb-sat" />
        <KPICard label="En Düşük Alan" value={kpis.lowest_area} icon={Warning} testId="kpi-onb-low" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Onboarding Boyutları" testId="chart-onb-radar">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Radar name="Skor" dataKey="score" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.3} />
              <Radar name="Benchmark" dataKey="benchmark" stroke="#F59E0B" fill="none" strokeDasharray="5 5" />
              <Legend />
              <Tooltip {...DARK_TOOLTIP} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        {trends.length > 0 && (
          <ChartCard title="Aylık Onboarding Trendi" testId="chart-onb-trend">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip {...DARK_TOOLTIP} />
                <Bar dataKey="count" name="Yanıt" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
      <QuestionDetailTable questions={scaleQs} title="Onboarding Soru Detayları" />
    </div>
  );
}

function PulseView({ data }) {
  const { kpis, questions, trends } = data;
  const scaleQs = (questions || []).filter(q => q.type === "scale");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard label="Toplam Yanıt" value={kpis.total_responses?.toLocaleString("tr-TR")} icon={ClipboardText} testId="kpi-pulse-total" />
        <KPICard label="Ort. Motivasyon" value={`${kpis.avg_morale}/5`} icon={Smiley} testId="kpi-pulse-morale" />
        <KPICard label="Ort. İş Yükü" value={`${kpis.avg_workload}/5`} icon={ChartLine} testId="kpi-pulse-work" />
        <KPICard label="Ort. Destek" value={`${kpis.avg_support}/5`} icon={Handshake} testId="kpi-pulse-support" />
        <KPICard label="Ay Sayısı" value={kpis.unique_months} icon={Clock} testId="kpi-pulse-months" />
      </div>
      {trends.length > 0 && (
        <ChartCard title="Aylık Pulse Trendi" subtitle="Motivasyon, İş Yükü ve Destek skorları" testId="chart-pulse-trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip {...DARK_TOOLTIP} />
              <Legend />
              <Line type="monotone" dataKey="morale" name="Motivasyon" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="workload" name="İş Yükü" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="support" name="Destek" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
      <QuestionDetailTable questions={scaleQs} title="Pulse Soru Detayları" />
    </div>
  );
}

function QuestionDetailTable({ questions, title }) {
  if (!questions || questions.length === 0) return null;
  const exportData = questions.map(q => ({
    Soru: q.text, Kategori: q.category, Ortalama: q.avg, Benchmark: q.benchmark, Fark: q.gap, "Yanıt Sayısı": q.response_count
  }));
  return (
    <ChartCard title={title} subtitle="Her sorunun ortalaması, benchmark karşılaştırması ve departman kırılımı" testId="table-survey-questions"
      headerRight={<ExcelExportButton data={exportData} filename="anket-soru-detay" sheetName="Sorular" />}>
      <div className="overflow-x-auto px-2">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100">
              <TableHead className="text-slate-400 text-xs">Soru</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Kategori</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Ortalama</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Benchmark</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Fark</TableHead>
              <TableHead className="text-slate-400 text-xs text-center">Yanıt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map(q => (
              <TableRow key={q.id} className="border-slate-50 hover:bg-slate-50/50">
                <TableCell className="text-xs text-slate-700 max-w-xs">{q.text}</TableCell>
                <TableCell className="text-xs text-center text-slate-500">{q.category}</TableCell>
                <TableCell className="text-xs text-center font-semibold text-slate-800">{q.avg}</TableCell>
                <TableCell className="text-xs text-center text-slate-500">{q.benchmark}</TableCell>
                <TableCell className="text-xs text-center font-semibold" style={{ color: q.gap_color }}>
                  {q.gap > 0 ? "+" : ""}{q.gap}
                </TableCell>
                <TableCell className="text-xs text-center text-slate-400">{q.response_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ChartCard>
  );
}
