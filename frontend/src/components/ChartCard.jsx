export const CHART_COLORS = ["#0E7490", "#F59E0B", "#14B8A6", "#EF4444", "#64748B", "#0891B2", "#6366F1", "#EC4899"];

export const DARK_TOOLTIP = {
  contentStyle: { backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px 12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)" },
  labelStyle: { color: "#0F172A", fontWeight: 500, marginBottom: 4 },
  itemStyle: { color: "#475569", fontSize: 12 },
};

export default function ChartCard({ title, subtitle, children, className = "", testId }) {
  return (
    <div
      data-testid={testId || `chart-${title?.toLowerCase().replace(/\s+/g, "-")}`}
      className={`bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm ${className}`}
    >
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-medium text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-2 pb-4">{children}</div>
    </div>
  );
}
