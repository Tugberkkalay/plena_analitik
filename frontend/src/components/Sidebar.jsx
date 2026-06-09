import { NavLink } from "react-router-dom";
import { ChartBar, Users, UserPlus, ArrowsClockwise, ArrowsLeftRight, Brain, CloudArrowUp, List, X, Funnel, Target, GraduationCap, CurrencyDollar, Smiley, Star, Gear, Compass, UserFocus, Sliders, Binoculars, ShieldWarning, Heartbeat, FilePdf, Crosshair, TreeStructure, Strategy, Bell, UserSwitch, GridNine } from "@phosphor-icons/react";

const NAV_SECTIONS = [
  {
    label: "Workforce",
    items: [
      { path: "/", label: "Overview", icon: ChartBar },
      { path: "/headcount", label: "Headcount", icon: Users },
      { path: "/hires-leaves", label: "Hires & Leaves", icon: UserPlus },
      { path: "/turnover", label: "Turnover", icon: ArrowsClockwise },
      { path: "/movement", label: "Movement", icon: ArrowsLeftRight },
    ],
  },
  {
    label: "Planning",
    items: [
      { path: "/headcount-plan", label: "HC Planning", icon: Crosshair },
      { path: "/workforce-alignment", label: "WF Alignment", icon: Strategy },
      { path: "/org-health", label: "Org Health", icon: TreeStructure },
      { path: "/skills-map-v2", label: "Skills Map", icon: GridNine },
      { path: "/scenario-sim", label: "Scenario Sim", icon: Sliders },
      { path: "/succession", label: "Succession", icon: ShieldWarning },
    ],
  },
  {
    label: "Talent",
    items: [
      { path: "/internal-mobility", label: "Internal Mobility", icon: UserSwitch },
      { path: "/recruitment", label: "Recruitment", icon: Funnel },
      { path: "/performance", label: "Performance", icon: Target },
      { path: "/learning", label: "Learning", icon: GraduationCap },
      { path: "/compensation", label: "Compensation", icon: CurrencyDollar },
      { path: "/engagement", label: "Engagement", icon: Smiley },
      { path: "/career-talent", label: "Career & Talent", icon: Star },
      { path: "/career-dev", label: "Career Dev (AI)", icon: UserFocus },
    ],
  },
  {
    label: "Insights",
    items: [
      { path: "/action-center", label: "Action Center", icon: Bell },
      { path: "/ai-forecast", label: "AI Forecast", icon: Brain },
      { path: "/capability-forecast", label: "Capability", icon: Binoculars },
      { path: "/burnout", label: "Burnout Alert", icon: Heartbeat },
      { path: "/hr-operations", label: "HR Ops", icon: Gear },
    ],
  },
];

const BOTTOM_ITEMS = [
  { path: "/data-upload", label: "Data Management", icon: CloudArrowUp },
];

export default function Sidebar({ open, onToggle }) {
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
            <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center">
              <ChartBar size={20} weight="bold" className="text-white" />
            </div>
            <div>
              <h2 data-testid="sidebar-logo" className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                HRlytic
              </h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400">Analytics Platform</p>
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
                  to={item.path}
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
          <p className="px-3 mb-2 text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium">Settings</p>
          {BOTTOM_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
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
