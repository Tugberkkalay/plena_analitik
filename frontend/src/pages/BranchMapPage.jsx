import { useState, useEffect } from "react";
import axios from "axios";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Buildings, MapPin, Warning, ChartBar } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard from "@/components/ChartCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const PIN_COLORS = { teal: "#0E7490", amber: "#F59E0B", red: "#EF4444" };
const METRICS = [
  { key: "performance", label: "Satış Performansı" },
  { key: "staffing", label: "Kadro Doluluk" },
  { key: "turnover", label: "Sirkülasyon" }
];

export default function BranchMapPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState("performance");
  const [selBranch, setSelBranch] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/branches/map?metric=${metric}&year=${year}`)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year, metric]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  if (!data) return <p className="text-slate-400">Veri bulunamadı.</p>;

  return (
    <div data-testid="branch-map-page" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Toplam Şube" value={data.kpis.total_branches} icon={Buildings} color="blue" />
        <KPICard title="Bölge Sayısı" value={data.kpis.regions} icon={MapPin} color="green" />
        <KPICard title="Ort. Gerçekleşme" value={data.kpis.avg_achievement} icon={ChartBar} color="amber" format="percent" />
        <KPICard title="Dikkat Gerektiren" value={data.kpis.attention} icon={Warning} color="red" />
      </div>

      {/* Metric toggle */}
      <div className="flex items-center gap-2">
        {METRICS.map(m => (
          <button key={m.key} data-testid={`metric-${m.key}`}
            onClick={() => { setMetric(m.key); setSelBranch(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              metric === m.key ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}>{m.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <ChartCard title="Türkiye Şube Haritası" className="lg:col-span-3" testId="chart-turkey-map">
          <div className="relative" style={{ height: 440 }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [35, 39], scale: 2200 }}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) => geographies
                    .filter(g => g.properties.name === "Turkey")
                    .map(geo => (
                      <Geography key={geo.rsmKey} geography={geo}
                        fill="#E2E8F0" stroke="#CBD5E1" strokeWidth={0.5}
                        style={{ default: { outline: "none" }, hover: { outline: "none", fill: "#D1D5DB" }, pressed: { outline: "none" } }} />
                    ))
                  }
                </Geographies>
                {data.pins?.map(pin => (
                  <Marker key={pin.branch_id} coordinates={[pin.lng, pin.lat]}
                    onClick={() => setSelBranch(pin)}>
                    <circle r={Math.max(4, Math.min(10, pin.headcount / 3))}
                      fill={PIN_COLORS[pin.color]} stroke="#fff" strokeWidth={1.5}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                      opacity={0.85} />
                    <text textAnchor="middle" y={-12} style={{ fontSize: 7, fill: "#475569", fontWeight: 600 }}>
                      {pin.name.replace(" Şubesi","")}
                    </text>
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Selected branch detail */}
          {selBranch && (
            <div data-testid="branch-detail-card"
              className="mx-3 mb-3 p-4 bg-white border border-slate-200 rounded-md shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-800">{selBranch.name}</h4>
                <button onClick={() => setSelBranch(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><p className="text-[10px] text-slate-400">Bölge</p><p className="text-xs font-medium text-slate-700">{selBranch.region}</p></div>
                <div><p className="text-[10px] text-slate-400">Segment</p><p className="text-xs font-medium text-slate-700">{selBranch.segment}</p></div>
                <div><p className="text-[10px] text-slate-400">Kadro</p><p className="text-xs font-medium text-slate-700">{selBranch.headcount}/{selBranch.target}</p></div>
                <div><p className="text-[10px] text-slate-400">Gerçekleşme</p>
                  <p className="text-xs font-bold" style={{color: PIN_COLORS[selBranch.color]}}>%{selBranch.achievement_pct}</p></div>
                <div><p className="text-[10px] text-slate-400">Devir</p><p className="text-xs font-medium text-slate-700">%{selBranch.turnover_pct}</p></div>
                <div><p className="text-[10px] text-slate-400">Doluluk</p><p className="text-xs font-medium text-slate-700">%{selBranch.fill_rate}</p></div>
                <div><p className="text-[10px] text-slate-400">Açık</p><p className={`text-xs font-bold ${selBranch.gap > 0 ? "text-red-600" : "text-emerald-600"}`}>{selBranch.gap}</p></div>
              </div>
            </div>
          )}
        </ChartCard>

        {/* Side panel */}
        <div className="space-y-4">
          <ChartCard title="Bölge Özeti" testId="chart-region-panel">
            <div className="space-y-1.5 px-3 pb-2">
              {data.regions?.map(r => (
                <div key={r.region} className="flex items-center justify-between p-2 border border-slate-100 rounded hover:bg-slate-50">
                  <div>
                    <p className="text-xs font-medium text-slate-700">{r.region}</p>
                    <p className="text-[10px] text-slate-400">{r.branches} şube · {r.headcount} kişi</p>
                  </div>
                  <span className={`text-xs font-bold ${r.avg_achievement >= 100 ? "text-teal-700" : r.avg_achievement >= 85 ? "text-amber-600" : "text-red-600"}`}>
                    %{r.avg_achievement}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="En İyi 5" testId="chart-best-5">
            <div className="space-y-1 px-3 pb-2">
              {data.best_5?.map((b, i) => (
                <div key={b.branch_id} className="flex items-center justify-between p-1.5">
                  <span className="text-xs text-slate-600">{i+1}. {b.name.replace(" Şubesi","")}</span>
                  <span className="text-xs font-bold text-teal-700">%{b.achievement_pct}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="En Kötü 5" testId="chart-worst-5">
            <div className="space-y-1 px-3 pb-2">
              {data.worst_5?.map((b, i) => (
                <div key={b.branch_id} className="flex items-center justify-between p-1.5">
                  <span className="text-xs text-slate-600">{i+1}. {b.name.replace(" Şubesi","")}</span>
                  <span className={`text-xs font-bold ${b.achievement_pct < 85 ? "text-red-600" : "text-amber-600"}`}>%{b.achievement_pct}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
