import writeXlsxFile from "write-excel-file/browser";

/**
 * Export an array of objects to an Excel (.xlsx) file.
 * @param {Array<Object>} data - rows to export
 * @param {string} filename - file name without extension
 * @param {string} [sheetName] - optional sheet name (defaults to filename)
 */
export async function exportToExcel(data, filename, sheetName) {
  if (!data || data.length === 0) return;
  const safeSheetName = (sheetName || filename)
    .replace(/[\\/*?:[\]]/g, "_")
    .slice(0, 31) || "Veri";
  const columns = Object.keys(data[0]);
  const toCell = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return { value, type: Number };
    if (typeof value === "boolean") return { value, type: Boolean };
    if (value instanceof Date) return { value, type: Date, format: "yyyy-mm-dd" };
    return { value: value == null ? "" : String(value), type: String };
  };
  const rows = [
    columns.map((column) => ({ value: column, type: String, fontWeight: "bold" })),
    ...data.map((row) => columns.map((column) => toCell(row[column]))),
  ];

  await writeXlsxFile(rows, {
    fileName: `${filename}.xlsx`,
    sheet: safeSheetName,
  });
}
