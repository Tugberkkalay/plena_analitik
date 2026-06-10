import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Sliders, Users, CurrencyDollar, TrendUp, TrendDown, Lightning } from "@phosphor-icons/react";
import KPICard from "@/components/KPICard";
import ChartCard, { CHART_COLORS, DARK_TOOLTIP } from "@/components/ChartCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, ComposedChart, Line } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ScenarioSimulatorPage({ year }) {
  const [params, setParams] = useState({ growth_rate: 10, budget_change: 0, attrition_change: 0, hiring_boost: 0, new_location_headcount: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/simulator/scenario`, { year, ...params });
      setResult(res.data);
    } catch (_) { /* silenced */ }
    finally { setLoading(false); }
  }, [year, params]);

  useEffect(() => { runSimulation(); }, []);

  const P = ({ label, value, unit, paramKey, min, max, step = 1 }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-teal-700">{value}{unit}</span>
      </div>
      <Slider data-testid={`slider-${paramKey}`} value={[value]} min={min} max={max} step={step}
        onValueChange={([v]) => setParams(p => ({ ...p, [paramKey]: v }))}
        className="[&_[role=slider]]:bg-teal-600 [&_[role=slider]]:border-teal-600" />
      <div className="flex justify-between text-[10px] text-slate-400"><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  );

  return (
    <div data-testid="scenario-simulator-page" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Sliders size={18} weight="duotone" className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-800">Senaryo Parametreleri</h3>
          </div>
          <P label="Büyüme Oranı" value={params.growth_rate} unit="%" paramKey="growth_rate" min={-20} max={50} />
          <P label="Bütçe Değişimi" value={params.budget_change} unit="%" paramKey="budget_change" min={-30} max={50} />
          <P label="Ayrılma Değişimi" value={params.attrition_change} unit="%" paramKey="attrition_change" min={-10} max={15} />
          <P label="Ek İşe Alım" value={params.hiring_boost} unit="" paramKey="hiring_boost" min={0} max={200} step={10} />
          <P label="Yeni Lokasyon Kadro" value={params.new_location_headcount} unit="" paramKey="new_location_headcount" min={0} max={500} step={25} />
          <Button data-testid="run-simulation-btn" onClick={() => runSimulation(params)} disabled={loading}
            className="w-full bg-teal-700 hover:bg-teal-600 text-white text-sm">
            {loading ? "Hesaplanıyor..." : "Senaryoyu Çalıştır"}
          </Button>        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {result && (
            <>
              {/* Comparison Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Current HC</p>
                  <p className="text-xl font-bold text-slate-800">{result.current.headcount}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Projected HC</p>
                  <p className="text-xl font-bold text-teal-700">{result.projected.headcount}</p>
                  <p className={`text-xs font-medium ${result.projected.net_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {result.projected.net_change >= 0 ? '+' : ''}{result.projected.net_change} ({result.projected.growth_pct}%)
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Hiring Need</p>
                  <p className="text-xl font-bold text-amber-600">{result.hiring_need}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Cost Delta</p>
                  <p className={`text-xl font-bold ${result.cost_delta >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {result.cost_delta >= 0 ? '+' : ''}{(result.cost_delta/1000000).toFixed(1)}M
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Kadro Projeksiyonu (12 ay)" testId="chart-scenario-hc">
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={result.monthly_projections}>
                      <defs>
                        <linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E7490" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0E7490" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                      <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...DARK_TOOLTIP} />
                      <Area type="monotone" dataKey="headcount" stroke="#0E7490" fill="url(#hcGrad)" strokeWidth={2.5} />
                      <Bar dataKey="hires" name="İşe Alım" fill="#14B8A6" opacity={0.6} radius={[2,2,0,0]} />
                      <Bar dataKey="attrition" name="Ayrılma" fill="#EF4444" opacity={0.6} radius={[2,2,0,0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Departman Etkisi" testId="chart-scenario-dept">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={result.department_impact}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.4} />
                      <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...DARK_TOOLTIP} />
                      <Bar dataKey="current" name="Mevcut" fill="#E2E8F0" radius={[3,3,0,0]} />
                      <Bar dataKey="projected" name="Projeksiyon" fill="#0E7490" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-1">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />Mevcut</span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-teal-700" />Projeksiyon</span>
                  </div>
                </ChartCard>
              </div>

              {/* Location Impact */}
              {result.location_impact && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {result.location_impact.map((loc) => (
                    <div key={loc.location} data-testid={`location-${loc.location.toLowerCase()}`}
                      className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-800">{loc.location}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${loc.delta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {loc.delta > 0 ? "+" : ""}{loc.delta}
                        </span>
                      </div>
                      <div className="flex items-end gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Current</p>
                          <p className="text-lg font-bold text-slate-700">{loc.current}</p>
                        </div>
                        <div className="text-teal-600 text-lg font-light pb-0.5">→</div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Projected</p>
                          <p className="text-lg font-bold text-teal-700">{loc.projected}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
