import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Buildings, MapPin, Warning, ChartBar } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard from "@/components/ChartCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const GEO_URL = "/turkey-provinces.json";
const PIN_COLORS = { teal: "#0E7490", amber: "#F59E0B", red: "#EF4444" };
const METRICS = [
  { key: "performance", label: "Satış Performansı" },
  { key: "staffing", label: "Kadro Doluluk" },
  { key: "turnover", label: "Sirkülasyon" }
];

// Region → province name mapping for coloring
const REGION_PROVINCES = {
  "Marmara": ["İstanbul","Kocaeli","Bursa","Tekirdağ","Edirne","Kırklareli","Çanakkale","Balıkesir","Yalova","Sakarya","Bilecik"],
  "Ege": ["İzmir","Aydın","Denizli","Muğla","Manisa","Afyonkarahisar","Kütahya","Uşak"],
  "Akdeniz": ["Antalya","Mersin","Adana","Hatay","Burdur","Isparta","Kahramanmaraş","Osmaniye"],
  "İç Anadolu": ["Ankara","Konya","Kayseri","Eskişehir","Sivas","Yozgat","Kırşehir","Kırıkkale","Nevşehir","Aksaray","Niğde","Karaman","Çankırı"],
  "Karadeniz": ["Trabzon","Samsun","Ordu","Giresun","Rize","Artvin","Sinop","Amasya","Tokat","Çorum","Kastamonu","Bartın","Karabük","Zonguldak","Bolu","Düzce","Gümüşhane","Bayburt"],
  "Doğu Anadolu": ["Erzurum","Malatya","Van","Elazığ","Erzincan","Bingöl","Tunceli","Muş","Bitlis","Hakkari","Ağrı","Iğdır","Kars","Ardahan"],
  "Güneydoğu Anadolu": ["Gaziantep","Diyarbakır","Şanlıurfa","Mardin","Batman","Şırnak","Siirt","Adıyaman","Kilis"],
};

const REGION_COLORS = {
  "Marmara": { base: "#BAE6FD", hover: "#7DD3FC" },
  "Ege": { base: "#BBF7D0", hover: "#86EFAC" },
  "Akdeniz": { base: "#FDE68A", hover: "#FCD34D" },
  "İç Anadolu": { base: "#E9D5FF", hover: "#D8B4FE" },
  "Karadeniz": { base: "#A7F3D0", hover: "#6EE7B7" },
  "Doğu Anadolu": { base: "#FECACA", hover: "#FCA5A5" },
  "Güneydoğu Anadolu": { base: "#FED7AA", hover: "#FDBA74" },
};

function getRegionForProvince(provinceName) {
  for (const [region, provinces] of Object.entries(REGION_PROVINCES)) {
    if (provinces.some(p => provinceName.includes(p) || p.includes(provinceName))) return region;
  }
  return null;
}

export default function BranchMapPage({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState("performance");
  const [selBranch, setSelBranch] = useState(null);
  const [hovRegion, setHovRegion] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/branches/map?metric=${metric}&year=${year}`)
      .then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year, metric]);

  const regionPerf = useMemo(() => {
    if (!data) return {};
    const rp = {};
    for (const p of data.pins) {
      if (!rp[p.region]) rp[p.region] = { total: 0, count: 0 };
      rp[p.region].total += p.achievement_pct;
      rp[p.region].count += 1;
    }
    return rp;
  }, [data]);

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
        <ChartCard title="Türkiye Şube Haritası" className="lg:col-span-3" testId="chart-turkey-map">
          <div className="relative" style={{ height: 460 }}>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [35.5, 39.2], scale: 2600 }}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) => geographies.map(geo => {
                    const name = geo.properties.name || "";
                    const region = getRegionForProvince(name);
                    const colors = region ? REGION_COLORS[region] : { base: "#E2E8F0", hover: "#D1D5DB" };
                    const isHovered = hovRegion && hovRegion === region;
                    return (
                      <Geography key={geo.rsmKey} geography={geo}
                        fill={isHovered ? colors.hover : colors.base}
                        stroke="#fff" strokeWidth={0.5}
                        onMouseEnter={() => setHovRegion(region)}
                        onMouseLeave={() => setHovRegion(null)}
                        style={{ default: { outline: "none" }, hover: { outline: "none", fill: colors.hover }, pressed: { outline: "none" } }}
                      />
                    );
                  })}
                </Geographies>
                {data.pins?.map(pin => (
                  <Marker key={pin.branch_id} coordinates={[pin.lng, pin.lat]}
                    onClick={() => setSelBranch(pin)}>
                    <circle r={Math.max(5, Math.min(11, pin.headcount / 2.5))}
                      fill={PIN_COLORS[pin.color]} stroke="#fff" strokeWidth={2}
                      style={{ cursor: "pointer", transition: "all 0.2s", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
                      opacity={0.9} />
                    <text textAnchor="middle" y={-14} style={{ fontSize: 7, fill: "#1E293B", fontWeight: 700, textShadow: "0 0 3px #fff, 0 0 3px #fff" }}>
                      {pin.name.replace(" Şubesi","")}
                    </text>
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 px-3 py-2 border-t border-slate-100">
            {Object.entries(REGION_COLORS).map(([region, c]) => (
              <span key={region} className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="w-3 h-3 rounded-sm border border-slate-200" style={{ backgroundColor: c.base }} />
                {region}
              </span>
            ))}
          </div>

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

        <div className="space-y-4">
          <ChartCard title="Bölge Özeti" testId="chart-region-panel">
            <div className="space-y-1.5 px-3 pb-2">
              {data.regions?.map(r => (
                <div key={r.region}
                  onMouseEnter={() => setHovRegion(r.region)}
                  onMouseLeave={() => setHovRegion(null)}
                  className={`flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer transition-colors ${
                    hovRegion === r.region ? "border-teal-300 bg-teal-50" : "border-slate-100"
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: REGION_COLORS[r.region]?.base || "#E2E8F0" }} />
                    <div>
                      <p className="text-xs font-medium text-slate-700">{r.region}</p>
                      <p className="text-[10px] text-slate-400">{r.branches} şube · {r.headcount} kişi</p>
                    </div>
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
