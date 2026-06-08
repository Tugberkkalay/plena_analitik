import { NavLink } from "react-router-dom";
import { ChartBar, Users, UserPlus, ArrowsClockwise, ArrowsLeftRight, Brain, CloudArrowUp, List, X, Funnel, Target, GraduationCap, CurrencyDollar, Smiley, Star, Gear, Compass, UserFocus } from "@phosphor-icons/react";

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
    label: "People",
    items: [
      { path: "/recruitment", label: "Recruitment", icon: Funnel },
      { path: "/performance", label: "Performance", icon: Target },
      { path: "/learning", label: "Learning", icon: GraduationCap },
      { path: "/compensation", label: "Compensation", icon: CurrencyDollar },
      { path: "/engagement", label: "Engagement", icon: Smiley },
      { path: "/career-talent", label: "Career & Talent", icon: Star },
      { path: "/skills-map", label: "Skills Map", icon: Compass },
      { path: "/career-dev", label: "Career Dev (AI)", icon: UserFocus },
    ],
  },
  {
    label: "Insights",
    items: [
      { path: "/ai-forecast", label: "AI Forecast", icon: Brain },
      { path: "/hr-operations", label: "HR Operations", icon: Gear },
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
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-slate-800 text-slate-200"
      >
        {open ? <X size={20} /> : <List size={20} />}
      </button>

      <aside
        data-testid="sidebar"
        className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:sticky top-0 left-0 z-40 w-64 h-screen bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300`}
      >
        <div className="px-5 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center">
              <ChartBar size={20} weight="bold" className="text-white" />
            </div>
            <div>
              <h2 data-testid="sidebar-logo" className="text-lg font-bold text-slate-50 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                HRlytic
              </h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-slate-500">Analytics Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-3">
              <p className="px-3 mb-2 text-[10px] tracking-[0.2em] uppercase text-slate-500 font-medium">{section.label}</p>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-teal-500/15 text-teal-300 border border-teal-500/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
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

        <div className="px-3 py-4 border-t border-slate-800">
          <p className="px-3 mb-2 text-[10px] tracking-[0.2em] uppercase text-slate-500 font-medium">Settings</p>
          {BOTTOM_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-teal-500/15 text-teal-300 border border-teal-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
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
