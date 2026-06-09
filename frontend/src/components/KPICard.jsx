import { TrendUp, TrendDown, Minus } from "@phosphor-icons/react";

export default function KPICard({ title, value, subtitle, icon: Icon, color = "blue", format = "number", testId, trend }) {
  const colorMap = {
    blue: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    green: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    slate: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  };
  const c = colorMap[color] || colorMap.blue;

  const formatValue = (v) => {
    if (format === "percent") return `${v}%`;
    if (format === "decimal") return v?.toFixed(1);
    if (typeof v === "number" && v >= 1000) return v.toLocaleString();
    return v;
  };

  const trendColor = trend ? (trend.delta > 0 ? (trend.inverse ? "text-red-600" : "text-emerald-600") : trend.delta < 0 ? (trend.inverse ? "text-emerald-600" : "text-red-600") : "text-slate-400") : null;

  return (
    <div
      data-testid={testId || `kpi-${title?.toLowerCase().replace(/\s+/g, "-")}`}
      className={`bg-white border border-slate-200 rounded-md p-4 transition-all duration-300 hover:border-slate-300 shadow-sm`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs tracking-[0.15em] uppercase text-slate-500 font-medium">{title}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-md ${c.bg} ${c.border} border flex items-center justify-center`}>
            <Icon size={16} weight="duotone" className={c.text} />
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${c.text} tracking-tight`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {formatValue(value)}
      </p>
      {trend && trend.delta !== undefined && (
        <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
          {trend.delta > 0 ? <TrendUp size={12} weight="bold" /> : trend.delta < 0 ? <TrendDown size={12} weight="bold" /> : <Minus size={12} />}
          <span className="text-[10px] font-semibold">
            {trend.delta > 0 ? "+" : ""}{trend.pct !== undefined ? `${trend.pct}%` : trend.delta}
          </span>
          <span className="text-[10px] text-slate-400 ml-0.5">önceki yıla göre</span>
        </div>
      )}
      {subtitle && !trend && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
