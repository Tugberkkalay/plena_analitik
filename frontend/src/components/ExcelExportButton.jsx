import { FileXls } from "@phosphor-icons/react";
import { exportToExcel } from "@/lib/exportToExcel";

export default function ExcelExportButton({ data, filename, sheetName, label }) {
  if (!data || data.length === 0) return null;
  return (
    <button
      data-testid={`excel-export-${filename}`}
      onClick={() => exportToExcel(data, filename, sheetName)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
    >
      <FileXls size={14} weight="bold" />
      {label || "Excel'e Aktar"}
    </button>
  );
}
