export default function KPICard({ title, value, subtitle, icon: Icon, color = "blue", format = "number", testId }) {
  const colorMap = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    green: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    slate: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  };
  const c = colorMap[color] || colorMap.blue;

  const formatValue = (v) => {
    if (format === "percent") return `${v}%`;
    if (format === "decimal") return v?.toFixed(1);
    if (typeof v === "number" && v >= 1000) return v.toLocaleString();
    return v;
  };

  return (
    <div
      data-testid={testId || `kpi-${title?.toLowerCase().replace(/\s+/g, "-")}`}
      className={`bg-slate-900 border border-slate-800 rounded-md p-4 transition-all duration-300 hover:border-slate-700`}
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
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
