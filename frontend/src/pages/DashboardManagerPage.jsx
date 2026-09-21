import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Responsive, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash, FloppyDisk, PencilSimple, Copy, X, ArrowsOutCardinal, GridFour, Broadcast, ShareNetwork, LinkSimple, WarningCircle, CheckCircle, ArrowClockwise } from "@phosphor-icons/react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";
const COLORS = ["#0E7490", "#F59E0B", "#14B8A6", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1", "#10B981"];
const TT = { contentStyle: { background: "#1e293b", border: "none", borderRadius: 8, color: "#f8fafc", fontSize: 12 } };

export default function DashboardManagerPage({ publicMode = false }) {
  const [dashboards, setDashboards] = useState([]);
  const [reports, setReports] = useState([]);
  const [view, setView] = useState("list"); // list | edit
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [widgetData, setWidgetData] = useState({});
  const [dashName, setDashName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    Promise.all([
      axios.get(`${API}/dashboards`),
      axios.get(`${API}/report-designer/reports`),
    ]).then(([dashboardResponse, reportResponse]) => {
      setDashboards(dashboardResponse.data.dashboards || []);
      setReports(reportResponse.data.reports || []);
    }).catch((error) => {
      setFeedback({ type: "error", text: `Dashboard araçları yüklenemedi: ${error?.response?.data?.detail || "Bağlantınızı kontrol edip tekrar deneyin."}` });
    });
  };

  const createDashboard = async () => {
    setFeedback(null);
    try {
      const r = await axios.post(`${API}/dashboards`, { name: "Yeni Dashboard" });
      setDashboards(prev => [r.data, ...prev]);
      openEditor(r.data);
      setFeedback({ type: "success", text: "Dashboard oluşturuldu. Adını değiştirip rapor bileşenleri ekleyebilirsiniz." });
    } catch (error) {
      setFeedback({ type: "error", text: `Dashboard oluşturulamadı: ${error?.response?.data?.detail || "Lütfen tekrar deneyin."}` });
    }
  };

  const deleteDashboard = async (id) => {
    if (!window.confirm("Bu dashboard ve kaydedilmiş yerleşimi silinecek. Devam edilsin mi?")) return;
    try {
      await axios.delete(`${API}/dashboards/${id}`);
      setDashboards(prev => prev.filter(d => d.id !== id));
      setFeedback({ type: "success", text: "Dashboard silindi." });
    } catch (error) {
      setFeedback({ type: "error", text: `Dashboard silinemedi: ${error?.response?.data?.detail || "Lütfen tekrar deneyin."}` });
    }
  };

  const duplicateDashboard = async (id) => {
    try {
      await axios.post(`${API}/dashboards/${id}/duplicate`);
      loadAll();
      setFeedback({ type: "success", text: "Dashboard kopyalandı." });
    } catch (error) {
      setFeedback({ type: "error", text: `Dashboard kopyalanamadı: ${error?.response?.data?.detail || "Lütfen tekrar deneyin."}` });
    }
  };

  const openEditor = (dashboard) => {
    setActiveDashboard(dashboard);
    setDashName(dashboard.name);
    setWidgets(dashboard.widgets || []);
    setWidgetData({});
    setFeedback(null);
    setView("edit");
    // Load data for existing widgets
    (dashboard.widgets || []).forEach(w => executeWidget(w.report_id));
  };

  const executeWidget = async (reportId) => {
    try {
      const r = await axios.post(`${API}/report-designer/reports/${reportId}/execute`);
      setWidgetData(prev => ({ ...prev, [reportId]: r.data }));
    } catch {
      setWidgetData(prev => ({ ...prev, [reportId]: null }));
    }
  };

  const addWidget = (reportId) => {
    const maxY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    const newW = { report_id: reportId, x: 0, y: maxY, w: 6, h: 5, title_override: "" };
    setWidgets(prev => [...prev, newW]);
    executeWidget(reportId);
    setShowAddWidget(false);
  };

  const removeWidget = (idx) => {
    setWidgets(prev => prev.filter((_, i) => i !== idx));
  };

  const onLayoutChange = (layout) => {
    setWidgets(prev => prev.map((w, i) => {
      const l = layout.find(li => li.i === String(i));
      return l ? { ...w, x: l.x, y: l.y, w: l.w, h: l.h } : w;
    }));
  };

  const saveDashboard = async () => {
    if (!activeDashboard) return;
    if (!dashName.trim()) {
      setFeedback({ type: "error", text: "Dashboard adını boş bırakamazsınız." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const response = await axios.put(`${API}/dashboards/${activeDashboard.id}`, { name: dashName.trim(), widgets });
      setActiveDashboard(response.data);
      setFeedback({ type: "success", text: "Dashboard adı ve yerleşimi kaydedildi." });
      loadAll();
    } catch (error) {
      setFeedback({ type: "error", text: `Dashboard kaydedilemedi: ${error?.response?.data?.detail || "Lütfen tekrar deneyin."}` });
    } finally {
      setSaving(false);
    }
  };

  const publishDashboard = async () => {
    if (!activeDashboard) return;
    await saveDashboard();
    const r = await axios.post(`${API}/dashboards/${activeDashboard.id}/publish`);
    setActiveDashboard(prev => prev ? { ...prev, ...r.data, status: "published" } : prev);
    loadAll();
  };

  const shareDashboard = async (id, password) => {
    const r = await axios.post(`${API}/dashboards/${id}/share`, { password: password || null });
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/shared/dashboard/${r.data.share_token}`;
    setShareLink(url);
    try { await navigator.clipboard.writeText(url); } catch {}
  };

  // ─── List View ───
  if (view === "list") {
    return (
      <div className="space-y-6" data-testid="dashboard-manager-list">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{publicMode ? "Sayfa Tasarımı" : "Dashboard Yönetimi"}</h2>
            <p className="text-sm text-slate-500">Oluşturduğunuz KPI ve grafikleri sürükleyip boyutlandırarak yerleştirin.</p>
          </div>
          <button data-testid="new-dashboard-btn" onClick={createDashboard}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-700 rounded-lg hover:bg-cyan-800 transition-colors">
            <Plus size={16} weight="bold" /> Yeni Dashboard
          </button>
        </div>
        {feedback && <DashboardFeedback feedback={feedback} />}
        {dashboards.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <GridFour size={48} className="mx-auto mb-3 opacity-40" />
            <p>Henüz dashboard oluşturulmamış</p>
            <button onClick={createDashboard} className="mt-3 text-cyan-600 hover:underline text-sm">İlk dashboard'unuzu oluşturun</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map(d => (
              <div key={d.id} data-testid={`dashboard-card-${d.id}`}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-slate-800 text-sm">{d.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{(d.widgets || []).length} bileşen{publicMode ? "" : ` / ${d.status === "published" ? "Yayında" : "Taslak"}`}</p>
                  </div>
                  {!publicMode && <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${d.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {d.status === "published" ? "Yayında" : "Taslak"}
                  </span>}
                </div>
                {d.description && <p className="text-xs text-slate-500 mb-2">{d.description}</p>}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button onClick={() => openEditor(d)} className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800">
                    <PencilSimple size={12} /> Düzenle
                  </button>
                  <button onClick={() => duplicateDashboard(d.id)} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800">
                    <Copy size={12} /> Kopyala
                  </button>
                  {!publicMode && d.status === "published" && (
                    <button onClick={() => shareDashboard(d.id)} data-testid={`share-${d.id}`}
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800">
                      <ShareNetwork size={12} /> Paylaş
                    </button>
                  )}
                  <button onClick={() => deleteDashboard(d.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                    <Trash size={12} /> Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Editor View ───
  const layout = widgets.map((w, i) => ({ i: String(i), x: w.x, y: w.y, w: w.w, h: w.h, minW: 3, minH: 3 }));

  return (
    <div className="space-y-4" data-testid="dashboard-editor">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView("list"); setActiveDashboard(null); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          <input data-testid="dashboard-name-input" value={dashName} onChange={e => { setDashName(e.target.value); if (feedback?.type === "error") setFeedback(null); }}
            aria-label="Dashboard adı" aria-invalid={!dashName.trim()}
            className={`text-sm font-medium text-slate-800 border-0 border-b hover:border-slate-200 focus:outline-none px-1 py-0.5 w-64 ${!dashName.trim() ? "border-red-400 focus:border-red-500" : "border-transparent focus:border-cyan-500"}`} />
        </div>
        <div className="flex items-center gap-2">
          <button data-testid="add-widget-btn" onClick={() => setShowAddWidget(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 rounded-md hover:bg-cyan-100 transition-colors">
            <Plus size={14} /> Widget Ekle
          </button>
          <button data-testid="save-dashboard-btn" onClick={saveDashboard} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">
            <FloppyDisk size={14} /> {saving ? "..." : "Kaydet"}
          </button>
          {!publicMode && <button data-testid="publish-dashboard-btn" onClick={publishDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors">
            <Broadcast size={14} /> Yayınla
          </button>}
          {!publicMode && activeDashboard?.status === "published" && (
            <button data-testid="share-dashboard-btn" onClick={() => shareDashboard(activeDashboard.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors">
              <ShareNetwork size={14} /> Paylaş
            </button>
          )}
        </div>
      </div>

      {feedback && <DashboardFeedback feedback={feedback} />}

      {shareLink && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between" data-testid="share-link-banner">
          <div className="flex items-center gap-2 min-w-0">
            <LinkSimple size={16} className="text-emerald-600 flex-shrink-0" />
            <span className="text-xs text-emerald-800 flex-shrink-0">Paylaşım linki kopyalandı:</span>
            <code className="text-xs bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700 truncate">{shareLink}</code>
          </div>
          <button onClick={() => setShareLink(null)} className="text-emerald-400 hover:text-emerald-600 flex-shrink-0 ml-2"><X size={14} /></button>
        </div>
      )}

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Rapor Seçin</h3>
              <button onClick={() => setShowAddWidget(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

        {reports.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Henüz rapor tanımlanmamış. Önce Rapor Tasarımcısı'ndan rapor oluşturun.</p>
            ) : (
              <div className="space-y-2">
                {reports.map(r => (
                  <button key={r.id} onClick={() => addWidget(r.id)} data-testid={`add-report-${r.id}`}
                    className="w-full text-left px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-medium text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.chart_type} / {r.data_source}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid Area */}
      {widgets.length === 0 ? (
        <div className="text-center py-24 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <ArrowsOutCardinal size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Dashboard'a widget ekleyin</p>
          <button onClick={() => setShowAddWidget(true)} className="mt-2 text-cyan-600 hover:underline text-sm">Widget Ekle</button>
        </div>
      ) : (
        <GridArea widgets={widgets} reports={reports} widgetData={widgetData} removeWidget={removeWidget} onLayoutChange={onLayoutChange} executeWidget={executeWidget} />
      )}
    </div>
  );
}

function DashboardFeedback({ feedback }) {
  const isError = feedback.type === "error";
  const Icon = isError ? WarningCircle : CheckCircle;
  return (
    <div role={isError ? "alert" : "status"} data-testid={`dashboard-${feedback.type}`}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
      <Icon size={16} weight="fill" className="mt-0.5 flex-shrink-0" />
      <span>{feedback.text}</span>
    </div>
  );
}

function GridArea({ widgets, reports, widgetData, removeWidget, onLayoutChange, executeWidget }) {
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 });
  const layout = widgets.map((w, i) => ({ i: String(i), x: w.x, y: w.y, w: w.w, h: w.h, minW: 3, minH: 3 }));

  return (
    <div ref={containerRef}>
      {mounted && (
        <Responsive
          width={width}
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={60}
          onLayoutChange={onLayoutChange}
          draggableHandle=".widget-drag-handle"
          isResizable={true}
          isDraggable={true}
        >
          {widgets.map((w, i) => {
            const report = reports.find(r => r.id === w.report_id);
            const data = widgetData[w.report_id];
            return (
              <div key={String(i)} data-testid={`widget-${i}`}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
                <div className="widget-drag-handle flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100 cursor-move">
                  <span className="text-xs font-medium text-slate-700 truncate">{w.title_override || report?.name || "Widget"}</span>
                  <button onClick={() => removeWidget(i)} className="text-slate-400 hover:text-red-500 flex-shrink-0 ml-2">
                    <Trash size={12} />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-2">
                  {data === undefined ? (
                    <div className="flex items-center justify-center h-full text-xs text-slate-400">Yükleniyor...</div>
                  ) : data === null ? (
                    <div className="flex flex-col gap-2 items-center justify-center h-full text-xs text-red-600">
                      <span>Bu bileşenin verisi yüklenemedi.</span>
                      <button type="button" onClick={() => executeWidget(w.report_id)} className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 hover:bg-red-100">
                        <ArrowClockwise size={12} /> Tekrar Dene
                      </button>
                    </div>
                  ) : (
                    <WidgetRenderer data={data} chartType={data.chart_type || report?.chart_type || "table"} />
                  )}
                </div>
              </div>
            );
          })}
        </Responsive>
      )}
    </div>
  );
}

function WidgetRenderer({ data, chartType }) {
  const { kpis = [], data: rows = [] } = data;

  if (chartType === "kpi_card" && kpis.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-2 p-1">
        {kpis.map(k => (
          <div key={k.id} className="bg-slate-50 rounded p-2">
            <p className="text-[9px] uppercase text-slate-500 font-medium truncate">{k.name}</p>
            <p className="text-lg font-bold text-slate-800">
              {k.format === "percent" ? `${k.value}%` : k.format === "currency" ? `₺${k.value?.toLocaleString("tr-TR")}` : k.value?.toLocaleString("tr-TR")}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) return <p className="text-xs text-slate-400 text-center py-4">Veri yok</p>;

  const keys = Object.keys(rows[0]).filter(k => k !== "_formatting");
  const labelKey = keys[0];
  const valueKeys = keys.slice(1).filter(k => typeof rows[0][k] === "number");

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows.slice(0, 20)} layout={rows.length > 6 ? "vertical" : "horizontal"}>
          {rows.length > 6 ? (
            <>
              <XAxis type="number" tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <YAxis type="category" dataKey={labelKey} width={100} tick={{ fontSize: 8, fill: "#64748b" }} />
            </>
          ) : (
            <>
              <XAxis dataKey={labelKey} tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} />
            </>
          )}
          <Tooltip {...TT} />
          <Legend wrapperStyle={{ fontSize: 9 }} />
          {valueKeys.slice(0, 3).map((vk, i) => <Bar key={vk} dataKey={vk} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows.slice(0, 50)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 9, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} />
          <Tooltip {...TT} />
          <Legend wrapperStyle={{ fontSize: 9 }} />
          {valueKeys.slice(0, 3).map((vk, i) => <Line key={vk} type="monotone" dataKey={vk} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />)}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "pie") {
    const valueKey = valueKeys[0];
    const pieData = rows.slice(0, 10).map(r => ({ name: r[labelKey], value: r[valueKey] || 0 }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="30%" outerRadius="65%" label={({ name }) => name}>
            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip {...TT} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Default: table
  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-[10px]">
        <thead className="bg-slate-50 sticky top-0">
          <tr>{keys.slice(0, 6).map(k => <th key={k} className="px-2 py-1 text-left text-slate-500 font-medium whitespace-nowrap">{k}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, 30).map((r, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
              {keys.slice(0, 6).map(k => <td key={k} className="px-2 py-1 text-slate-700 whitespace-nowrap">{typeof r[k] === "number" ? r[k].toLocaleString("tr-TR") : String(r[k] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
