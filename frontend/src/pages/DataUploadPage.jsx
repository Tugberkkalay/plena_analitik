import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { CloudArrowUp, FileXls, FileCsv, Database, Trash, ArrowClockwise, CheckCircle, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DataUploadPage() {
  const [sources, setSources] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/data/sources`).then((r) => setSources(r.data.sources || [])).catch(() => {});
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/data/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUploadResult({ success: true, ...res.data });
      const srcRes = await axios.get(`${API}/data/sources`);
      setSources(srcRes.data.sources || []);
    } catch (err) {
      setUploadResult({ success: false, message: err.response?.data?.detail || "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  const resetData = async () => {
    try {
      await axios.delete(`${API}/data/reset`);
      setUploadResult({ success: true, message: "Reset to demo data successfully" });
      const srcRes = await axios.get(`${API}/data/sources`);
      setSources(srcRes.data.sources || []);
    } catch (err) {
      setUploadResult({ success: false, message: "Reset failed" });
    }
  };

  return (
    <div data-testid="data-upload-page" className="space-y-6 max-w-4xl">
      <div
        data-testid="file-dropzone"
        className={`border-2 border-dashed rounded-md p-10 text-center cursor-pointer transition-all duration-200 ${
          dragActive ? "border-teal-500 bg-teal-50/50" : "border-slate-300 hover:border-slate-400 bg-white"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" data-testid="file-input" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
            <CloudArrowUp size={28} weight="duotone" className="text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Drop your file here or click to browse</p>
            <p className="text-xs text-slate-500 mt-1">Supports Excel (.xlsx) and CSV (.csv) files</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><FileXls size={14} className="text-emerald-500" />.xlsx</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><FileCsv size={14} className="text-blue-500" />.csv</span>
          </div>
        </div>
        {uploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-blue-400 text-sm">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" /> Uploading and processing...
          </div>
        )}
      </div>

      {uploadResult && (
        <div data-testid="upload-result" className={`p-4 rounded-md border flex items-start gap-3 ${
          uploadResult.success ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
        }`}>
          {uploadResult.success ? <CheckCircle size={20} className="text-emerald-600 mt-0.5" /> : <XCircle size={20} className="text-red-600 mt-0.5" />}
          <div>
            <p className={`text-sm font-medium ${uploadResult.success ? "text-emerald-700" : "text-red-700"}`}>
              {uploadResult.success ? uploadResult.message || `Imported ${uploadResult.row_count} records from ${uploadResult.filename}` : uploadResult.message}
            </p>
            {uploadResult.columns && (
              <p className="text-xs text-slate-500 mt-1">Columns: {uploadResult.columns.join(", ")}</p>
            )}
            {uploadResult.mapped_columns && Object.keys(uploadResult.mapped_columns).length > 0 && (
              <p className="text-xs text-slate-500 mt-1">Mapped: {Object.entries(uploadResult.mapped_columns).map(([k, v]) => `${k} -> ${v}`).join(", ")}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Data Sources</h3>
        <Button data-testid="reset-data-btn" variant="outline" onClick={resetData}
          className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-xs">
          <ArrowClockwise size={14} className="mr-1.5" /> Reset to Demo Data
        </Button>
      </div>

      {sources.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs">Filename</TableHead>
                <TableHead className="text-slate-400 text-xs">Rows</TableHead>
                <TableHead className="text-slate-400 text-xs">Columns</TableHead>
                <TableHead className="text-slate-400 text-xs">Uploaded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s, i) => (
                <TableRow key={i} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="text-slate-900 text-sm font-medium flex items-center gap-2">
                    {s.filename?.endsWith('.csv') ? <FileCsv size={16} className="text-blue-400" /> : <FileXls size={16} className="text-emerald-400" />}
                    {s.filename}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">{s.row_count}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{s.columns?.length || 0}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{s.uploaded_at ? new Date(s.uploaded_at).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-8 text-center">
          <Database size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No uploaded data sources. Using demo data.</p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} weight="duotone" className="text-teal-600" />
          <h3 className="text-sm font-medium text-slate-800">Database Connection</h3>
          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 font-medium">Coming Soon</span>
        </div>
        <p className="text-xs text-slate-500">Connect directly to your HRIS database for real-time analytics. Supported: SAP SuccessFactors, Oracle HCM, Workday, Custom SQL.</p>
      </div>
    </div>
  );
}
