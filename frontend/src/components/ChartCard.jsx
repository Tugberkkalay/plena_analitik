export const CHART_COLORS = ["#2563EB", "#F59E0B", "#F97316", "#EF4444", "#64748B", "#22C55E", "#8B5CF6", "#EC4899"];

export const DARK_TOOLTIP = {
  contentStyle: { backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "6px", padding: "8px 12px" },
  labelStyle: { color: "#F8FAFC", fontWeight: 500, marginBottom: 4 },
  itemStyle: { color: "#94A3B8", fontSize: 12 },
};

export default function ChartCard({ title, subtitle, children, className = "", testId }) {
  return (
    <div
      data-testid={testId || `chart-${title?.toLowerCase().replace(/\s+/g, "-")}`}
      className={`bg-slate-900 border border-slate-800 rounded-md overflow-hidden ${className}`}
    >
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-medium text-slate-200">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-2 pb-4">{children}</div>
    </div>
  );
}
