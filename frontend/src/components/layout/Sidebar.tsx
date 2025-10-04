import { Home, LineChart, FileText } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkClasses =
    "flex items-center gap-2 p-2 rounded-lg transition hover:bg-green-100";

  const activeClasses = "bg-green-200 font-medium";

  return (
    <aside className="w-64 bg-white border-r shadow-sm p-4">
      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkClasses} ${isActive ? activeClasses : ""}`
          }
        >
          <Home size={18} /> Dashboard
        </NavLink>
        <NavLink
          to="/optimizer"
          className={({ isActive }) =>
            `${linkClasses} ${isActive ? activeClasses : ""}`
          }
        >
          <LineChart size={18} /> Yield Optimizer
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `${linkClasses} ${isActive ? activeClasses : ""}`
          }
        >
          <FileText size={18} /> Reports
        </NavLink>
      </nav>
    </aside>
  );
}
