import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Lock, Eye } from "@phosphor-icons/react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";
const COLORS = ["#0E7490", "#F59E0B", "#14B8A6", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1", "#10B981"];
const TT = { contentStyle: { background: "#1e293b", border: "none", borderRadius: 8, color: "#f8fafc", fontSize: 12 } };

export default function SharedDashboardPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [dashboard, setDashboard] = useState(null);
  const [widgetData, setWidgetData] = useState({});
  const [error, setError] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = async (pwd) => {
    setLoading(true);
    try {
      const params = pwd ? `?password=${encodeURIComponent(pwd)}` : "";
      const r = await axios.get(`${API}/dashboards/shared/${token}${params}`);
      setDashboard(r.data.dashboard);
      setWidgetData(r.data.widget_data || {});
      setNeedsPassword(false);
      setError(null);
    } catch (e) {
      if (e.response?.status === 403) {
        setNeedsPassword(true);
        setError(null);
      } else {
        setError(e.response?.data?.detail || "Dashboard bulunamadı");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard(searchParams.get("password"));
  }, [token]);

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Yükleniyor...</div>;

  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-lg text-slate-500">{error}</p>
      </div>
    </div>
  );

  if (needsPassword) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-80">
        <Lock size={32} className="mx-auto mb-4 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-800 text-center mb-4">Şifre Gerekli</h2>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Dashboard şifresi"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          onKeyDown={e => e.key === "Enter" && loadDashboard(password)} />
        <button onClick={() => loadDashboard(password)}
          className="w-full px-4 py-2 bg-cyan-700 text-white rounded-lg text-sm font-medium hover:bg-cyan-800">
          Giriş
        </button>
      </div>
    </div>
  );

  if (!dashboard) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6" data-testid="shared-dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{dashboard.name}</h1>
          {dashboard.description && <p className="text-sm text-slate-500 mt-1">{dashboard.description}</p>}
        </div>
        <div className="grid grid-cols-12 gap-4">
          {(dashboard.widgets || []).map((w, i) => {
            const data = widgetData[w.report_id];
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
                style={{ gridColumn: `span ${Math.min(w.w || 6, 12)}` }}>
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-sm font-medium text-slate-700">{w.title_override || `Widget ${i + 1}`}</span>
                </div>
                <div className="p-3" style={{ minHeight: (w.h || 4) * 60 }}>
                  {data ? <SharedWidgetRenderer data={data} /> : <p className="text-xs text-slate-400 text-center py-8">Veri yüklenemedi</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SharedWidgetRenderer({ data }) {
  const { kpis = [], data: rows = [], chart_type } = data;

  if (chart_type === "kpi_card" && kpis.length > 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.id} className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] uppercase text-slate-500 font-semibold">{k.name}</p>
            <p className="text-xl font-bold text-slate-800 mt-1">
              {k.format === "percent" ? `${k.value}%` : k.format === "currency" ? `₺${k.value?.toLocaleString("tr-TR")}` : k.value?.toLocaleString("tr-TR")}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) return <p className="text-sm text-slate-400 text-center py-4">Veri yok</p>;
  const keys = Object.keys(rows[0]).filter(k => k !== "_formatting");
  const labelKey = keys[0];
  const valueKeys = keys.slice(1).filter(k => typeof rows[0][k] === "number");

  if (chart_type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows.slice(0, 20)}>
          <XAxis dataKey={labelKey} tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <Tooltip {...TT} /><Legend />
          {valueKeys.slice(0, 3).map((vk, i) => <Bar key={vk} dataKey={vk} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === "pie") {
    const vk = valueKeys[0];
    const pieData = rows.slice(0, 10).map(r => ({ name: r[labelKey], value: r[vk] || 0 }));
    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={100} label>
            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie><Tooltip {...TT} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart_type === "line") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={rows.slice(0, 50)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <Tooltip {...TT} /><Legend />
          {valueKeys.slice(0, 3).map((vk, i) => <Line key={vk} type="monotone" dataKey={vk} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />)}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Table
  return (
    <div className="overflow-auto max-h-80">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 sticky top-0"><tr>{keys.slice(0, 8).map(k => <th key={k} className="px-2 py-1.5 text-left text-slate-500 font-medium">{k}</th>)}</tr></thead>
        <tbody>{rows.slice(0, 50).map((r, i) => <tr key={i} className="border-b border-slate-50">{keys.slice(0, 8).map(k => <td key={k} className="px-2 py-1 text-slate-700">{typeof r[k] === "number" ? r[k].toLocaleString("tr-TR") : String(r[k] ?? "")}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
