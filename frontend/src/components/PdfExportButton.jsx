import { useState } from "react";
import { FilePdf } from "@phosphor-icons/react";

/**
 * PDF Export component.
 * Uses html2canvas + jsPDF to capture current view as PDF.
 */
export default function PdfExportButton({ tenantName, sectionLabel }) {
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Find the content area to capture
      const contentEl = document.querySelector(".hrlytic-content") || document.querySelector("[data-testid='report-content']") || document.querySelector("main") || document.body;

      const canvas = await html2canvas(contentEl, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        onclone: (doc) => {
          // Hide buttons and interactive elements in clone
          doc.querySelectorAll("button, nav, [data-testid='sidebar'], .print\\:hidden").forEach((el) => {
            el.style.display = "none";
          });
        },
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      // If content is taller than one page, split into pages
      const pageHeight = 297; // A4 height in mm
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Add footer to last page
      const lastPage = pdf.getNumberOfPages();
      pdf.setPage(lastPage);
      pdf.setFontSize(7);
      pdf.setTextColor(150);
      pdf.text(`${tenantName || "Plenalitik"} Raporu · ${new Date().toLocaleDateString("tr-TR")} · Powered by Plenalitik`, 10, 290);

      const fileName = `${(tenantName || "plenalitik").toLowerCase().replace(/\s+/g, "-")}-${(sectionLabel || "rapor").toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF export error:", err);
      // Fallback to browser print
      window.print();
    }
    setExporting(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportPdf}
        disabled={exporting}
        data-testid="pdf-download-btn"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors disabled:opacity-50 print:hidden"
        title="PDF olarak indir"
      >
        {exporting ? (
          <><div className="animate-spin rounded-full h-3 w-3 border-b border-white" /> PDF Oluşturuluyor...</>
        ) : (
          <><FilePdf size={14} weight="bold" /> PDF İndir</>
        )}
      </button>
    </div>
  );
}
