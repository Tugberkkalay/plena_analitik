import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Bell, Warning, CheckCircle, Funnel, Robot } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard from "@/components/ChartCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SEV_BORDER = { high: "border-l-red-500", med: "border-l-amber-500", low: "border-l-slate-400" };
const SEV_BADGE = { high: "bg-red-50 text-red-700 border-red-200", med: "bg-amber-50 text-amber-700 border-amber-200", low: "bg-slate-100 text-slate-600 border-slate-200" };
const SEV_LABEL = { high: "High", med: "Medium", low: "Low" };
const SOURCE_ICON = { Turnover: "text-red-500", Succession: "text-orange-500", Skills: "text-blue-500", "Org Health": "text-amber-500", Headcount: "text-teal-600" };
const SOURCES = ["All", "Turnover", "Succession", "Skills", "Org Health", "Headcount"];

export default function ActionCenterPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [resolvedIds, setResolvedIds] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/dashboard/alerts?year=${year}`)
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  const resolveAlert = useCallback(async (alertId) => {
    try {
      await axios.post(`${API}/dashboard/alerts/resolve`, { alert_id: alertId });
      setResolvedIds(prev => new Set([...prev, alertId]));
    } catch (_) {}
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">No data available.</p>;

  const { kpis } = data;
  const activeAlerts = (data.alerts || []).filter(a => !resolvedIds.has(a.id));
  const filtered = filter === "All" ? activeAlerts : activeAlerts.filter(a => a.source === filter);
  const resolvedCount = (kpis.resolved_this_month || 0) + resolvedIds.size;

  return (
    <div data-testid="action-center-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Active Alerts" value={activeAlerts.length} icon={Bell} color="red" />
        <KPICard title="High Priority" value={activeAlerts.filter(a => a.severity === "high").length} icon={Warning} color="amber" />
        <KPICard title="Resolved (Month)" value={resolvedCount} icon={CheckCircle} color="green" />
        <KPICard title="Signal Sources" value={kpis.sources} icon={Robot} color="blue" />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Funnel size={16} className="text-slate-400" />
        {SOURCES.map(s => (
          <button key={s} data-testid={`filter-${s.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              filter === s ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}>
            {s}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-2">{filtered.length} alert{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Alert Feed */}
      <ChartCard title="Alert Feed" subtitle="Signals from all HR modules — sorted by priority" testId="chart-alert-feed">
        <div className="space-y-2 px-3 pb-2 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <CheckCircle size={32} className="mb-2 text-emerald-400" />
              <p className="text-sm font-medium">No active alerts</p>
              <p className="text-xs">All signals are within normal thresholds</p>
            </div>
          )}
          {filtered.map((alert) => (
            <div key={alert.id} data-testid={`alert-${alert.id}`}
              className={`border border-slate-200 rounded-md overflow-hidden border-l-4 ${SEV_BORDER[alert.severity]} hover:border-slate-300 transition-colors`}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${alert.severity === "high" ? "bg-red-500" : "bg-amber-500"}`} />
                      <h4 className="text-sm font-semibold text-slate-800">{alert.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{alert.detail}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className={`px-1.5 py-0.5 rounded font-medium ${SOURCE_ICON[alert.source] || "text-slate-500"} bg-slate-50`}>
                        {alert.source}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-semibold border ${SEV_BADGE[alert.severity]}`}>
                        {SEV_LABEL[alert.severity]}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Suggested Action Box */}
                <div className="bg-teal-50 border border-teal-200 rounded-md px-3 py-2.5 mt-3">
                  <p className="text-[10px] uppercase tracking-wider text-teal-600 font-medium mb-1">Suggested Action</p>
                  <p className="text-xs text-teal-800 leading-relaxed">{alert.suggested_action}</p>
                  <button data-testid={`resolve-${alert.id}`}
                    onClick={() => resolveAlert(alert.id)}
                    className="mt-2 px-3 py-1 rounded text-[10px] font-semibold bg-teal-700 text-white hover:bg-teal-600 transition-colors">
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
