import * as XLSX from "xlsx";

/**
 * Export an array of objects to an Excel (.xlsx) file.
 * @param {Array<Object>} data - rows to export
 * @param {string} filename - file name without extension
 * @param {string} [sheetName] - optional sheet name (defaults to filename)
 */
export function exportToExcel(data, filename, sheetName) {
  if (!data || data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (sheetName || filename).slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
