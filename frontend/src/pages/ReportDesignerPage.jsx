import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash, Play, FloppyDisk, Copy, PencilSimple, Eye, ChartBar, Table as TableIcon, ChartPie, ChartLine as ChartLineIcon, Funnel, Gauge, X, CaretDown, CaretRight } from "@phosphor-icons/react";
import ExcelExportButton from "@/components/ExcelExportButton";

const API = process.env.REACT_APP_BACKEND_URL + "/api";
const CHART_COLORS = ["#0E7490", "#F59E0B", "#14B8A6", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1", "#10B981"];
const DARK_TOOLTIP = { contentStyle: { background: "#1e293b", border: "none", borderRadius: 8, color: "#f8fafc", fontSize: 12 } };

const CHART_TYPES = [
  { value: "table", label: "Tablo", icon: TableIcon },
  { value: "bar", label: "Çubuk", icon: ChartBar },
  { value: "line", label: "Çizgi", icon: ChartLineIcon },
  { value: "pie", label: "Pasta", icon: ChartPie },
  { value: "kpi_card", label: "KPI Kart", icon: Gauge },
];

const AGG_OPTIONS = [
  { value: "count", label: "Sayı" },
  { value: "sum", label: "Toplam" },
  { value: "avg", label: "Ortalama" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maksimum" },
  { value: "distinct_count", label: "Benzersiz Sayı" },
  { value: "ratio_percent", label: "Yüzde (true/toplam)" },
];

export default function ReportDesignerPage({ publicMode = false }) {
  const [dataSources, setDataSources] = useState({});
  const [kpiTemplates, setKpiTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportTemplates, setReportTemplates] = useState([]);
  const [view, setView] = useState("list"); // list | builder
  const [editingReport, setEditingReport] = useState(null);

  // Builder state
  const [name, setName] = useState("");
  const [dataSource, setDataSource] = useState("employees");
  const [chartType, setChartType] = useState("table");
  const [dimensions, setDimensions] = useState([]);
  const [measures, setMeasures] = useState([]);
  const [filters, setFilters] = useState([]);
  const [selectedKpis, setSelectedKpis] = useState([]);
  const [condFmt, setCondFmt] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API}/report-designer/data-sources`).then(r => setDataSources(r.data.data_sources || {}));
    axios.get(`${API}/report-designer/kpi-templates`).then(r => setKpiTemplates(r.data.templates || []));
    axios.get(`${API}/report-designer/report-templates`).then(r => setReportTemplates(r.data.templates || [])).catch(() => {});
    loadReports();
  }, []);

  const loadReports = () => {
    axios.get(`${API}/report-designer/reports`).then(r => setReports(r.data.reports || []));
  };

  const currentSource = dataSources[dataSource] || { columns: {} };
  const cols = currentSource.columns || {};
  const dimensionCols = Object.entries(cols).filter(([, v]) => v.role === "dimension");
  const measureCols = Object.entries(cols).filter(([, v]) => v.role === "measure" || v.type === "boolean");

  const resetBuilder = () => {
    setName(""); setDataSource("employees"); setChartType("table");
    setDimensions([]); setMeasures([]); setFilters([]); setSelectedKpis([]); setCondFmt([]);
    setPreviewData(null); setEditingReport(null);
  };

  const openBuilder = (report) => {
    if (report) {
      setEditingReport(report.id);
      setName(report.name); setDataSource(report.data_source); setChartType(report.chart_type);
      setDimensions(report.dimensions || []); setMeasures(report.measures || []);
      setFilters(report.filters || []); setSelectedKpis(report.kpi_ids || []);
      setCondFmt(report.conditional_formatting || []);
    } else {
      resetBuilder();
    }
    setPreviewData(null);
    setView("builder");
  };

  const runPreview = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.post(`${API}/report-designer/execute-preview`, {
        name, data_source: dataSource, chart_type: chartType,
        dimensions, measures, filters, kpi_ids: selectedKpis,
        conditional_formatting: condFmt,
      });
      setPreviewData(r.data);
    } catch (e) {
      setPreviewData(null);
    }
    setLoading(false);
  }, [name, dataSource, chartType, dimensions, measures, filters, selectedKpis, condFmt]);

  const saveReport = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const cleanMeasures = measures.map(m => ({
      ...m,
      label: m.label || (dataSources[dataSource]?.columns?.[m.column]?.label || m.column)
    }));
    const body = { name, data_source: dataSource, chart_type: chartType, dimensions, measures: cleanMeasures, filters, kpi_ids: selectedKpis, conditional_formatting: condFmt };
    try {
      if (editingReport) {
        await axios.put(`${API}/report-designer/reports/${editingReport}`, body);
      } else {
        const r = await axios.post(`${API}/report-designer/reports`, body);
        setEditingReport(r.data.id);
      }
      loadReports();
    } catch (e) {
      console.error("Save error:", e);
      alert("Rapor kaydedilemedi: " + (e?.response?.data?.detail || e.message));
    }
    setSaving(false);
  };

  const deleteReport = async (id) => {
    await axios.delete(`${API}/report-designer/reports/${id}`);
    loadReports();
  };

  const duplicateReport = async (id) => {
    await axios.post(`${API}/report-designer/reports/${id}/duplicate`);
    loadReports();
  };

  // ─── Report List View ───
  if (view === "list") {
    return (
      <div className="space-y-6" data-testid="report-designer-list">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{publicMode ? "Görsel & KPI Oluşturucu" : "Rapor Tasarımcısı"}</h2>
            <p className="text-sm text-slate-500">{publicMode ? "Seed veriden KPI, tablo ve grafik oluşturun; ana veri değişmez." : "KPI tanımlama, hesaplama formülleri ve rapor oluşturma"}</p>
          </div>
          <button data-testid="new-report-btn" onClick={() => openBuilder(null)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-700 rounded-lg hover:bg-cyan-800 transition-colors">
            <Plus size={16} weight="bold" /> Yeni Rapor
          </button>
        </div>

        {/* Hazır Şablonlar */}
        {reportTemplates.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Hazır Şablonlardan Oluştur</h3>
            <div className="flex flex-wrap gap-2">
              {[...new Set(reportTemplates.map(t => t.category))].map(cat => (
                <div key={cat} className="relative group/cat">
                  <button className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                    {cat} ({reportTemplates.filter(t => t.category === cat).length})
                  </button>
                  <div className="absolute z-20 left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg invisible group-hover/cat:visible">
                    {reportTemplates.filter(t => t.category === cat).map((tmpl, i) => {
                      const globalIdx = reportTemplates.indexOf(tmpl);
                      return (
                        <button key={i} data-testid={`template-${globalIdx}`}
                          onClick={async () => { await axios.post(`${API}/report-designer/report-templates/${globalIdx}/create`); loadReports(); }}
                          className="block w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-cyan-50 first:rounded-t-lg last:rounded-b-lg">
                          {tmpl.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ChartBar size={48} className="mx-auto mb-3 opacity-40" />
            <p>Henüz rapor tanımlanmamış</p>
            <button onClick={() => openBuilder(null)} className="mt-3 text-cyan-600 hover:underline text-sm">İlk raporunuzu oluşturun</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(r => (
              <div key={r.id} data-testid={`report-card-${r.id}`}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-slate-800 text-sm">{r.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{dataSources[r.data_source]?.label || r.data_source} / {CHART_TYPES.find(c => c.value === r.chart_type)?.label || r.chart_type}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openBuilder(r)} className="p-1 text-slate-400 hover:text-cyan-600"><PencilSimple size={14} /></button>
                    <button onClick={() => duplicateReport(r.id)} className="p-1 text-slate-400 hover:text-amber-600"><Copy size={14} /></button>
                    <button onClick={() => deleteReport(r.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash size={14} /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(r.dimensions || []).map(d => <span key={d} className="px-2 py-0.5 text-[10px] bg-sky-50 text-sky-700 rounded-full">{cols[d]?.label || d}</span>)}
                  {(r.measures || []).map((m, i) => <span key={i} className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-700 rounded-full">{m.label || m.column}</span>)}
                  {(r.kpi_ids || []).map(k => <span key={k} className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded-full">{kpiTemplates.find(t => t.id === k)?.name || k}</span>)}
                </div>
                <button onClick={() => { openBuilder(r); setTimeout(runPreview, 300); }}
                  className="mt-3 flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800">
                  <Eye size={12} /> Önizle & Düzenle
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Builder View ───
  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]" data-testid="report-designer-builder">
      {/* Left Panel - Config */}
      <div className="w-80 flex-shrink-0 overflow-y-auto bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm">Rapor Yapılandırma</h3>
          <button onClick={() => { setView("list"); resetBuilder(); }} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Rapor Adı</label>
          <input data-testid="report-name-input" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500" placeholder="Ör: Departman Bazlı Turnover" />
        </div>

        {/* Data Source */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Veri Kaynağı</label>
          <Select value={dataSource} onValueChange={v => { setDataSource(v); setDimensions([]); setMeasures([]); setFilters([]); setSelectedKpis([]); }}>
            <SelectTrigger data-testid="data-source-select" className="w-full h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              {Object.entries(dataSources).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Chart Type */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Grafik Türü</label>
          <div className="flex gap-1 flex-wrap">
            {CHART_TYPES.map(ct => (
              <button key={ct.value} data-testid={`chart-type-${ct.value}`}
                onClick={() => setChartType(ct.value)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors ${chartType === ct.value ? "bg-cyan-50 border-cyan-300 text-cyan-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}>
                <ct.icon size={12} /> {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dimensions */}
        {chartType !== "kpi_card" && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Boyutlar (Satır/Eksen)</label>
            <div className="space-y-1">
              {dimensionCols.map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                  <input type="checkbox" checked={dimensions.includes(k)}
                    onChange={e => setDimensions(e.target.checked ? [...dimensions, k] : dimensions.filter(d => d !== k))}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                  {v.label}
                  <span className="text-[10px] text-slate-400 ml-auto">{v.type}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Measures */}
        {chartType !== "kpi_card" && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Ölçütler (Değer)</label>
            {measures.map((m, i) => (
              <div key={i} className="flex items-center gap-1 mb-1">
                <select value={m.column} onChange={e => { const newM = [...measures]; newM[i] = { ...m, column: e.target.value }; setMeasures(newM); }}
                  className="flex-1 text-xs border border-slate-200 rounded px-1 py-1">
                  <option value="">Kolon seç...</option>
                  {measureCols.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={m.aggregation} onChange={e => { const newM = [...measures]; newM[i] = { ...m, aggregation: e.target.value }; setMeasures(newM); }}
                  className="w-24 text-xs border border-slate-200 rounded px-1 py-1">
                  {AGG_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <button onClick={() => setMeasures(measures.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><Trash size={12} /></button>
              </div>
            ))}
            <button onClick={() => setMeasures([...measures, { column: "", aggregation: "count", label: "" }])}
              className="text-xs text-cyan-600 hover:text-cyan-800 flex items-center gap-1 mt-1">
              <Plus size={12} /> Ölçüt Ekle
            </button>
          </div>
        )}

        {/* KPI Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Hazır KPI Şablonları</label>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {kpiTemplates.filter(t => t.data_source === dataSource).map(t => (
              <label key={t.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                <input type="checkbox" checked={selectedKpis.includes(t.id)}
                  onChange={e => setSelectedKpis(e.target.checked ? [...selectedKpis, t.id] : selectedKpis.filter(k => k !== t.id))}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span>{t.name}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{t.category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Filtreler</label>
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-1 mb-1">
              <select value={f.column} onChange={e => { const nf = [...filters]; nf[i] = { ...f, column: e.target.value }; setFilters(nf); }}
                className="flex-1 text-xs border border-slate-200 rounded px-1 py-1">
                <option value="">Kolon...</option>
                {Object.entries(cols).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={f.operator} onChange={e => { const nf = [...filters]; nf[i] = { ...f, operator: e.target.value }; setFilters(nf); }}
                className="w-14 text-xs border border-slate-200 rounded px-1 py-1">
                <option value="eq">=</option><option value="ne">≠</option><option value="gt">&gt;</option>
                <option value="lt">&lt;</option><option value="contains">~</option>
              </select>
              <input value={f.value || ""} onChange={e => { const nf = [...filters]; nf[i] = { ...f, value: e.target.value }; setFilters(nf); }}
                className="w-20 text-xs border border-slate-200 rounded px-1 py-1" placeholder="Değer" />
              <button onClick={() => setFilters(filters.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><Trash size={12} /></button>
            </div>
          ))}
          <button onClick={() => setFilters([...filters, { column: "", operator: "eq", value: "" }])}
            className="text-xs text-cyan-600 hover:text-cyan-800 flex items-center gap-1 mt-1">
            <Plus size={12} /> Filtre Ekle
          </button>
        </div>

        {/* Conditional Formatting */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Koşullu Biçimlendirme</label>
          {condFmt.map((cf, i) => (
            <div key={i} className="flex items-center gap-1 mb-1">
              <input value={cf.column_label || ""} onChange={e => { const nc = [...condFmt]; nc[i] = { ...cf, column_label: e.target.value }; setCondFmt(nc); }}
                className="flex-1 text-xs border border-slate-200 rounded px-1 py-1" placeholder="Kolon adı" />
              <input type="number" value={cf.threshold || ""} onChange={e => { const nc = [...condFmt]; nc[i] = { ...cf, threshold: parseFloat(e.target.value) }; setCondFmt(nc); }}
                className="w-16 text-xs border border-slate-200 rounded px-1 py-1" placeholder="Eşik" />
              <button onClick={() => setCondFmt(condFmt.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><Trash size={12} /></button>
            </div>
          ))}
          <button onClick={() => setCondFmt([...condFmt, { column_label: "", threshold: 0, color_above: "#DC2626", color_below: "#059669" }])}
            className="text-xs text-cyan-600 hover:text-cyan-800 flex items-center gap-1 mt-1">
            <Plus size={12} /> Biçimlendirme Ekle
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button data-testid="run-preview-btn" onClick={runPreview} disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-cyan-700 rounded-lg hover:bg-cyan-800 disabled:opacity-50 transition-colors">
            <Play size={14} weight="fill" /> {loading ? "Çalışıyor..." : "Önizle"}
          </button>
          <button data-testid="save-report-btn" onClick={saveReport} disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors">
            <FloppyDisk size={14} /> {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-lg p-4">
        {!previewData ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Eye size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Yapılandırmayı tamamlayıp "Önizle" butonuna tıklayın</p>
            </div>
          </div>
        ) : (
          <ReportPreview data={previewData} chartType={chartType} />
        )}
      </div>
    </div>
  );
}

// ─── Report Preview Component ───
function ReportPreview({ data, chartType }) {
  const { kpis = [], data: rows = [], total_rows = 0 } = data;

  return (
    <div className="space-y-4" data-testid="report-preview">
      {/* KPI Cards */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map(k => (
            <div key={k.id} data-testid={`kpi-${k.id}`}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{k.name}</p>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {k.format === "percent" ? `${k.value}%` : k.format === "currency" ? `₺${k.value?.toLocaleString("tr-TR")}` : k.format === "decimal" ? k.value?.toFixed(1) : k.value?.toLocaleString("tr-TR")}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{k.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Info Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{total_rows.toLocaleString("tr-TR")} kayıt, {rows.length} satır gösteriliyor</span>
        <ExcelExportButton data={rows.map(r => { const { _formatting, ...rest } = r; return rest; })} filename="rapor-export" sheetName="Rapor" />
      </div>

      {/* Chart / Table */}
      {chartType === "kpi_card" ? null : chartType === "table" ? (
        <TableView rows={rows} />
      ) : chartType === "bar" ? (
        <BarChartView rows={rows} />
      ) : chartType === "line" ? (
        <LineChartView rows={rows} />
      ) : chartType === "pie" ? (
        <PieChartView rows={rows} />
      ) : (
        <TableView rows={rows} />
      )}
    </div>
  );
}

function TableView({ rows }) {
  if (!rows || rows.length === 0) return <p className="text-sm text-slate-400 text-center py-8">Veri yok</p>;
  const headers = Object.keys(rows[0]).filter(k => k !== "_formatting");
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            {headers.map(h => <TableHead key={h} className="text-xs text-slate-500 font-medium whitespace-nowrap">{h}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 100).map((row, i) => (
            <TableRow key={i} className="border-slate-100 hover:bg-slate-50/50">
              {headers.map(h => {
                const fmt = row._formatting?.[h];
                const val = row[h];
                return (
                  <TableCell key={h} className="text-xs text-slate-700 whitespace-nowrap"
                    style={fmt ? { color: fmt, fontWeight: 600 } : undefined}>
                    {typeof val === "number" ? val.toLocaleString("tr-TR") : typeof val === "boolean" ? (val ? "Evet" : "Hayır") : String(val ?? "")}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BarChartView({ rows }) {
  if (!rows || rows.length === 0) return null;
  const keys = Object.keys(rows[0]).filter(k => k !== "_formatting");
  const labelKey = keys[0];
  const valueKeys = keys.slice(1).filter(k => typeof rows[0][k] === "number");
  return (
    <ResponsiveContainer width="100%" height={Math.max(300, rows.length * 28)}>
      <BarChart data={rows.slice(0, 50)} layout={rows.length > 8 ? "vertical" : "horizontal"}>
        {rows.length > 8 ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis type="category" dataKey={labelKey} width={180} tick={{ fontSize: 10, fill: "#64748b" }} />
          </>
        ) : (
          <>
            <XAxis dataKey={labelKey} tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
          </>
        )}
        <Tooltip {...DARK_TOOLTIP} />
        <Legend />
        {valueKeys.map((vk, i) => <Bar key={vk} dataKey={vk} name={vk} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartView({ rows }) {
  if (!rows || rows.length === 0) return null;
  const keys = Object.keys(rows[0]).filter(k => k !== "_formatting");
  const labelKey = keys[0];
  const valueKeys = keys.slice(1).filter(k => typeof rows[0][k] === "number");
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={rows.slice(0, 100)}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip {...DARK_TOOLTIP} />
        <Legend />
        {valueKeys.map((vk, i) => <Line key={vk} type="monotone" dataKey={vk} name={vk} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

function PieChartView({ rows }) {
  if (!rows || rows.length === 0) return null;
  const keys = Object.keys(rows[0]).filter(k => k !== "_formatting");
  const labelKey = keys[0];
  const valueKey = keys.find(k => typeof rows[0][k] === "number") || keys[1];
  const pieData = rows.slice(0, 12).map(r => ({ name: r[labelKey], value: r[valueKey] || 0 }));
  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={120} label={({ name, value }) => `${name}: ${value}`}>
          {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip {...DARK_TOOLTIP} />
      </PieChart>
    </ResponsiveContainer>
  );
}
