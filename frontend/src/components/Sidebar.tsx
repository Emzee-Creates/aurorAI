import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Gauge, SlidersHorizontal, Settings, Beaker, Menu, X } from "lucide-react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/optimizer", label: "Optimizer", icon: SlidersHorizontal },
  { to: "/strategies", label: "Strategies", icon: Beaker },
  { to: "/backtest", label: "Backtest", icon: Gauge },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-md bg-slate-800 text-slate-100 hover:bg-slate-700"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:static top-0 left-0 z-20 h-full w-60 transform bg-slate-900 border-r border-slate-800 p-4 transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <nav className="space-y-1 mt-12 lg:mt-0">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)} // close on navigation (mobile)
              className={({ isActive }) =>
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition " +
                (isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800/60")
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay on mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-10 lg:hidden"
        ></div>
      )}
    </>
  );
}
