import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Bell, Warning, CheckCircle, Funnel, Robot, Lightning, SpinnerGap } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard from "@/components/ChartCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SEV_BORDER = { high: "border-l-red-500", med: "border-l-amber-500", low: "border-l-slate-400" };
const SEV_BADGE = { high: "bg-red-50 text-red-700 border-red-200", med: "bg-amber-50 text-amber-700 border-amber-200", low: "bg-slate-100 text-slate-600 border-slate-200" };
const SEV_LABEL = { high: "Yüksek", med: "Orta", low: "Düşük" };
const SOURCE_ICON = { "Devir": "text-red-500", "Yedekleme": "text-orange-500", "Yetkinlik": "text-blue-500", "Org. Sağlığı": "text-amber-500", "Kadro": "text-teal-600", "Şube Satış": "text-rose-500", "Şube Sirkülasyon": "text-violet-500", "Şube Kadro": "text-indigo-500" };
const SOURCES = ["Tümü", "Devir", "Yedekleme", "Yetkinlik", "Org. Sağlığı", "Kadro", "Şube Satış", "Şube Sirkülasyon", "Şube Kadro"];

function AIBriefCard({ year }) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const runScan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/dashboard/alerts/ai-scan`, { year });
      setBrief(res.data);
    } catch (_) { setBrief({ ai_brief: "AI analysis failed. Please try again.", status: "error" }); }
    finally { setLoading(false); }
  }, [year]);

  const formatBrief = (text) => {
    if (!text) return null;
    // Clean markdown artifacts
    const clean = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,4}\s/g, '');
    return clean.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      // Section headers (all caps Turkish)
      if (/^[A-ZÇĞIİÖŞÜ\s]{8,}$/.test(trimmed) || /^(YÖNETİCİ|ÖNCELİKLİ|RİSK|HIZLI|KAZANILMASI|ÖNERİLEN|GELİŞİM|KARİYER|MENTORLUK)/.test(trimmed)) {
        return <h4 key={i} className="text-sm font-bold text-slate-800 mt-4 mb-1.5 first:mt-0 border-b border-slate-100 pb-1">{trimmed}</h4>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        return <li key={i} className="text-xs text-slate-600 leading-relaxed ml-3 mb-0.5 list-disc">{trimmed.slice(2)}</li>;
      }
      if (/^\d+[\.\)]/.test(trimmed)) {
        return <div key={i} className="text-xs text-slate-600 leading-relaxed ml-1 mb-2 pl-3 border-l-2 border-teal-200">{trimmed}</div>;
      }
      return <p key={i} className="text-xs text-slate-600 leading-relaxed mb-1">{trimmed}</p>;
    });
  };

  return (
    <div data-testid="ai-brief-card" className="bg-gradient-to-r from-teal-50 to-white border border-teal-200 rounded-md overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center">
            <Robot size={18} weight="bold" className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">AI Yönetici Özeti</h3>
            <p className="text-[10px] text-slate-500">Plena AI destekli tüm aktif uyarı analizi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {brief && (
            <button onClick={() => setExpanded(!expanded)}
              className="px-2 py-1 rounded text-[10px] text-slate-500 hover:bg-slate-100 transition-colors">
              {expanded ? "Collapse" : "Expand"}
            </button>
          )}
          <button data-testid="ai-scan-btn"
            onClick={runScan} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-700 hover:bg-teal-600 text-white text-xs font-medium transition-colors disabled:opacity-50">
            {loading ? <SpinnerGap size={14} className="animate-spin" /> : <Lightning size={14} weight="bold" />}
            {loading ? "Analiz ediliyor..." : brief ? "Yeniden Analiz" : "AI Tarama Başlat"}
          </button>
        </div>
      </div>
      {brief && expanded && (
        <div className="px-5 pb-4 border-t border-teal-100">
          <div className="mt-3 bg-white rounded-md border border-slate-100 p-4">
            {formatBrief(brief.ai_brief)}
          </div>
          {brief.context && (
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-400">
              <span>HC: {brief.context.headcount}</span>
              <span>Turnover: {brief.context.turnover_rate}%</span>
              <span>Perf: {brief.context.avg_performance}/5</span>
              <span>Engagement: {brief.context.avg_engagement}/10</span>
              <span>Alerts: {brief.context.total_alerts}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActionCenterPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tümü");
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
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  const { kpis } = data;
  const activeAlerts = (data.alerts || []).filter(a => !resolvedIds.has(a.id));
  const filtered = filter === "Tümü" ? activeAlerts : activeAlerts.filter(a => a.source === filter);
  const resolvedCount = (kpis.resolved_this_month || 0) + resolvedIds.size;

  return (
    <div data-testid="action-center-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Aktif Uyarılar" value={activeAlerts.length} icon={Bell} color="red" />
        <KPICard title="Yüksek Öncelik" value={activeAlerts.filter(a => a.severity === "high").length} icon={Warning} color="amber" />
        <KPICard title="Çözülen (Ay)" value={resolvedCount} icon={CheckCircle} color="green" />
        <KPICard title="Sinyal Kaynağı" value={kpis.sources} icon={Robot} color="blue" />
      </div>

      {/* AI Executive Brief */}
      <AIBriefCard year={year} />

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
      <ChartCard title="Uyarı Akışı" subtitle="Tüm İK modüllerinden sinyaller — önceliğe göre sıralı" testId="chart-alert-feed">
        <div className="space-y-2 px-3 pb-2 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <CheckCircle size={32} className="mb-2 text-emerald-400" />
              <p className="text-sm font-medium">Aktif uyarı yok</p>
              <p className="text-xs">Tüm sinyaller normal eşiklerde</p>
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
                  <p className="text-[10px] uppercase tracking-wider text-teal-600 font-medium mb-1">Önerilen Aksiyon</p>
                  <p className="text-xs text-teal-800 leading-relaxed">{alert.suggested_action}</p>
                  <button data-testid={`resolve-${alert.id}`}
                    onClick={() => resolveAlert(alert.id)}
                    className="mt-2 px-3 py-1 rounded text-[10px] font-semibold bg-teal-700 text-white hover:bg-teal-600 transition-colors">
                    Çözüldü İşaretle
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
