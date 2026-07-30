import { NavLink } from "react-router-dom";
import { ChartBar, Users, UserPlus, ArrowsClockwise, ArrowsLeftRight, Brain, CloudArrowUp, List, X, Funnel, Target, GraduationCap, CurrencyDollar, Smiley, Star, Gear, Compass, UserFocus, Sliders, Binoculars, ShieldWarning, Heartbeat, FilePdf, Crosshair, TreeStructure, Strategy, Bell, UserSwitch, GridNine, Buildings, Trophy, MapPin, UsersFour, Scales, ClipboardText, Handshake, ChartLine } from "@phosphor-icons/react";

export const NAV_SECTIONS = [
  {
    label: "İşgücü",
    items: [
      { path: "/", label: "Genel Bakış", icon: ChartBar },
      { path: "/headcount", label: "Kadro", icon: Users },
      { path: "/hires-leaves", label: "Alım & Ayrılma", icon: UserPlus },
      { path: "/turnover", label: "Devir Oranı", icon: ArrowsClockwise },
      { path: "/movement", label: "Hareket", icon: ArrowsLeftRight },
    ],
  },
  {
    label: "Kadro & Ücret",
    items: [
      { path: "/norm-kadro", label: "Norm Kadro", icon: Crosshair },
      { path: "/ek-kadro", label: "Ek Kadro Talepleri", icon: ClipboardText },
      { path: "/teklif-analizi", label: "Teklif Analizi", icon: Handshake },
      { path: "/ucret-benchmark", label: "Ücret Benchmark", icon: Scales },
    ],
  },
  {
    label: "İşe Alım",
    items: [
      { path: "/kaynak-analizi", label: "Kaynak Analizi", icon: Funnel },
      { path: "/universite-analizi", label: "Üniversite Analizi", icon: GraduationCap },
      { path: "/maliyet-analizi", label: "Maliyet Analizi", icon: CurrencyDollar },
      { path: "/aday-hunisi", label: "Aday Hunisi", icon: ChartLine },
    ],
  },
  {
    label: "Planlama",
    items: [
      { path: "/headcount-plan", label: "Kadro Planlama", icon: ChartLine },
      { path: "/workforce-alignment", label: "Strateji Hizalama", icon: Strategy },
      { path: "/org-health", label: "Org. Sağlığı", icon: TreeStructure },
      { path: "/skills-map-v2", label: "Yetkinlik Haritası", icon: GridNine },
      { path: "/scenario-sim", label: "Senaryo Sim.", icon: Sliders },
      { path: "/succession", label: "Yedekleme Planı", icon: ShieldWarning },
    ],
  },
  {
    label: "Satış & Şube",
    items: [
      { path: "/branch-performance", label: "Şube Performansı", icon: Buildings },
      { path: "/commission-targets", label: "Prim & Hedef", icon: Trophy },
      { path: "/branch-staffing", label: "Şube Kadro", icon: UsersFour },
      { path: "/branch-map", label: "Şube Haritası", icon: MapPin },
    ],
  },
  {
    label: "Yetenek",
    items: [
      { path: "/internal-mobility", label: "İç Mobilite", icon: UserSwitch },
      { path: "/recruitment", label: "İşe Alım", icon: Funnel },
      { path: "/performance", label: "Performans", icon: Target },
      { path: "/learning", label: "Eğitim", icon: GraduationCap },
      { path: "/compensation", label: "Ücretlendirme", icon: CurrencyDollar },
      { path: "/engagement", label: "Bağlılık", icon: Smiley },
      { path: "/career-talent", label: "Kariyer & Yetenek", icon: Star },
      { path: "/career-dev", label: "Kariyer (Plena AI)", icon: UserFocus },
    ],
  },
  {
    label: "Öngörü",
    items: [
      { path: "/action-center", label: "Aksiyon Merkezi", icon: Bell },
      { path: "/ai-forecast", label: "Plena AI Tahmin", icon: Brain },
      { path: "/capability-forecast", label: "Yetkinlik Tahm.", icon: Binoculars },
      { path: "/burnout", label: "Tükenmişlik", icon: Heartbeat },
      { path: "/hr-operations", label: "İK Operasyonları", icon: Gear },
    ],
  },
];

const BOTTOM_ITEMS = [
  { path: "/data-upload", label: "Veri Yönetimi", icon: CloudArrowUp },
];

export default function Sidebar({ open, onToggle, basePath = "", brandColor, brandLogo, brandName }) {
  const API_BASE = process.env.REACT_APP_BACKEND_URL;
  const logoSrc = brandLogo ? (brandLogo.startsWith("http") ? brandLogo : `${API_BASE}${brandLogo}`) : null;
  const sidebarColor = brandColor || "#0F766E";

  return (
    <>
      <button
        data-testid="sidebar-toggle-mobile"
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-white border border-slate-200 text-slate-700"
      >
        {open ? <X size={20} /> : <List size={20} />}
      </button>

      <aside
        data-testid="sidebar"
        className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:sticky top-0 left-0 z-40 w-64 h-screen bg-white border-r border-slate-200 flex flex-col transition-transform duration-300`}
      >
        <div className="px-5 py-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <img src={logoSrc} alt={brandName || "Logo"} className="w-9 h-9 rounded-lg object-contain border border-slate-100 p-0.5" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: sidebarColor }}>
                <ChartBar size={20} weight="bold" className="text-white" />
              </div>
            )}
            <div>
              <h2 data-testid="sidebar-logo" className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {brandName || "Plenalitik"}
              </h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400">
                {brandName ? "Plenalitik Raporu" : "Analitik Platformu"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-3">
              <p className="px-3 mb-2 text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium">{section.label}</p>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={basePath ? `${basePath}${item.path}` : item.path}
                  end={item.path === "/"}
                  data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                    }`
                  }
                >
                  <item.icon size={17} weight="duotone" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200">
          <p className="px-3 mb-2 text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium">Ayarlar</p>
          {BOTTOM_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={basePath ? `${basePath}${item.path}` : item.path}
              data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                }`
              }
            >
              <item.icon size={18} weight="duotone" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onToggle} />
      )}
    </>
  );
}
