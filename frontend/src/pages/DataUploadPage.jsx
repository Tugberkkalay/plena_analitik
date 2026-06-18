import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { CloudArrowUp, FileXls, Database, ArrowClockwise, CheckCircle, XCircle, DownloadSimple, Info } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SHEET_INFO = [
  { name: "Çalışanlar", desc: "Ad, departman, pozisyon, band, maaş, performans, kıdem", icon: "👤" },
  { name: "Yetkinlikler", desc: "Çalışan bazlı yetkinlik ve seviye (1-5)", icon: "🎯" },
  { name: "Şubeler", desc: "Şube adı, bölge, şehir, koordinat, segment, hedef kadro", icon: "🏦" },
  { name: "Satış Performansı", desc: "Çalışan/şube bazlı dönemsel hedef ve gerçekleşen", icon: "📊" },
  { name: "İşe Alım", desc: "Pozisyon, başvuru, mülakat, teklif, süre, kaynak", icon: "📋" },
  { name: "Eğitimler", desc: "Çalışan bazlı eğitim, kategori, süre, puan", icon: "📚" },
  { name: "Bağlılık Anketi", desc: "Çalışan bazlı genel puan, NPS, alt boyutlar", icon: "💡" },
];

export default function DataUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);
  const fileInputRef = useRef(null);

  // Get current tenant from URL
  const pathParts = window.location.pathname.split("/");
  const slugIdx = pathParts.indexOf("rapor");
  const tenantSlug = slugIdx >= 0 ? pathParts[slugIdx + 1] : null;

  useEffect(() => {
    // Fetch data summary
    axios.get(`${API}/dashboard/overview?year=2025`).then((r) => {
      setDataSummary(r.data.kpis);
    }).catch(() => {});
  }, []);

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(`${API}/tenants/excel-template`, { withCredentials: true, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "plenalitik_veri_sablonu.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Şablon indirme hatası — lütfen admin olarak giriş yapın");
    }
    setDownloading(false);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (!tenantSlug || tenantSlug === "default") {
      setUploadResult({ success: false, message: "Önce bir müşteri seçin. Admin panelinden müşteri oluşturup raporlarına girin." });
      return;
    }
    setUploading(true);
    setUploadResult(null);
    try {
      // First get tenant ID from slug
      const tenantsRes = await axios.get(`${API}/tenants`, { withCredentials: true });
      const tenant = (tenantsRes.data.tenants || []).find(t => t.slug === tenantSlug);
      if (!tenant) throw new Error("Müşteri bulunamadı");

      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API}/tenants/${tenant.id}/upload-excel`, formData, {
        withCredentials: true, headers: { "Content-Type": "multipart/form-data" }, timeout: 120000,
      });
      setUploadResult({ success: true, message: res.data.message, counts: res.data.counts });
      // Refresh summary
      axios.get(`${API}/dashboard/overview?year=2025`).then((r) => setDataSummary(r.data.kpis)).catch(() => {});
    } catch (err) {
      setUploadResult({ success: false, message: err.response?.data?.detail || err.message || "Yükleme hatası" });
    }
    setUploading(false);
  };

  const resetToDemo = async () => {
    if (!tenantSlug || tenantSlug === "default") return;
    if (!window.confirm("Mevcut veriler silinip demo veri oluşturulacak. Emin misiniz?")) return;
    setUploading(true);
    try {
      const tenantsRes = await axios.get(`${API}/tenants`, { withCredentials: true });
      const tenant = (tenantsRes.data.tenants || []).find(t => t.slug === tenantSlug);
      if (!tenant) throw new Error("Müşteri bulunamadı");
      const res = await axios.post(`${API}/tenants/${tenant.id}/seed`, {}, { withCredentials: true, timeout: 120000 });
      setUploadResult({ success: true, message: res.data.message });
      axios.get(`${API}/dashboard/overview?year=2025`).then((r) => setDataSummary(r.data.kpis)).catch(() => {});
    } catch (err) {
      setUploadResult({ success: false, message: err.response?.data?.detail || "Hata" });
    }
    setUploading(false);
  };

  return (
    <div data-testid="data-upload-page" className="space-y-6 max-w-4xl">
      {/* Step 1: Download Template */}
      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DownloadSimple size={20} weight="duotone" className="text-teal-600" />
            <h3 className="text-base font-semibold text-slate-900">1. Excel Şablonu İndir</h3>
          </div>
          <Button onClick={downloadTemplate} disabled={downloading} data-testid="download-template-btn"
            className="bg-teal-600 hover:bg-teal-700 text-white">
            {downloading ? "İndiriliyor..." : "Şablonu İndir"}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Aşağıdaki 7 sayfayı içeren boş Excel şablonunu indirin, verilerinizle doldurun ve 2. adımda yükleyin.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SHEET_INFO.map((s) => (
            <div key={s.name} className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs font-semibold text-slate-700">{s.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Upload */}
      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CloudArrowUp size={20} weight="duotone" className="text-teal-600" />
          <h3 className="text-base font-semibold text-slate-900">2. Doldurulmuş Excel'i Yükle</h3>
        </div>
        <div
          data-testid="file-dropzone"
          className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-all ${
            dragActive ? "border-teal-500 bg-teal-50/50" : "border-slate-300 hover:border-slate-400 bg-slate-50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUpload(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={(e) => { if (e.target.files[0]) handleUpload(e.target.files[0]); e.target.value = ""; }} className="hidden" data-testid="file-input" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
              <CloudArrowUp size={24} weight="duotone" className="text-teal-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">Dosyayı sürükleyin veya tıklayarak seçin</p>
            <p className="text-xs text-slate-400">Excel (.xlsx) formatında · Mevcut veriler silinip yenisi yüklenecek</p>
            <span className="flex items-center gap-1.5 text-xs text-slate-400 mt-1"><FileXls size={14} className="text-emerald-500" />.xlsx</span>
          </div>
          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-teal-600 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600" /> Veriler yükleniyor ve işleniyor...
            </div>
          )}
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div data-testid="upload-result" className={`mt-4 p-4 rounded-md border flex items-start gap-3 ${
            uploadResult.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
          }`}>
            {uploadResult.success ? <CheckCircle size={20} weight="fill" className="text-emerald-600 mt-0.5" /> : <XCircle size={20} weight="fill" className="text-red-600 mt-0.5" />}
            <div>
              <p className={`text-sm font-medium ${uploadResult.success ? "text-emerald-700" : "text-red-700"}`}>{uploadResult.message}</p>
              {uploadResult.counts && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(uploadResult.counts).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium">{k}: {v}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Data Summary */}
      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database size={20} weight="duotone" className="text-teal-600" />
            <h3 className="text-base font-semibold text-slate-900">Mevcut Veri Durumu</h3>
          </div>
          <Button variant="outline" onClick={resetToDemo} disabled={uploading} data-testid="reset-data-btn"
            className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowClockwise size={14} className="mr-1.5" /> Demo Veriye Dön
          </Button>
        </div>
        {dataSummary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Çalışan</p>
              <p className="text-xl font-bold text-slate-900">{dataSummary.headcount || 0}</p>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">İşe Alınan</p>
              <p className="text-xl font-bold text-emerald-600">{dataSummary.hires || 0}</p>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ayrılan</p>
              <p className="text-xl font-bold text-red-600">{dataSummary.leaves || 0}</p>
            </div>
            <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Devir Oranı</p>
              <p className="text-xl font-bold text-amber-600">%{dataSummary.turnover_rate || 0}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-50 rounded-md">
            <Database size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Henüz veri yüklenmemiş</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700 space-y-1">
          <p className="font-medium">Veri Yükleme Kuralları:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-blue-600">
            <li>Her yüklemede mevcut müşteri verileri silinip yenileri yazılır</li>
            <li>Çalışan ID'leri tüm sheet'lerde tutarlı olmalı (Yetkinlikler, Eğitimler, Bağlılık şeetlerinde aynı ID)</li>
            <li>Tarih formatı: YYYY-MM-DD (ör: 2025-03-15)</li>
            <li>Performans ve yetkinlik seviyeleri 1-5 arası olmalı</li>
          </ul>
        </div>
      </div>

      {/* Database Connection - Coming Soon */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <Database size={18} weight="duotone" className="text-teal-600" />
          <h3 className="text-sm font-medium text-slate-800">Veritabanı Bağlantısı</h3>
          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 font-medium">Yakında</span>
        </div>
        <p className="text-xs text-slate-500">HRIS veritabanınıza doğrudan bağlanarak gerçek zamanlı analitik. Desteklenen: SAP SuccessFactors, Oracle HCM, Workday, Custom SQL.</p>
      </div>
    </div>
  );
}
