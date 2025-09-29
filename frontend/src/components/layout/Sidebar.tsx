import { Home, LineChart, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-100 p-4 border-r">
      <nav className="space-y-2">
        <Link to="/dashboard" className="flex items-center gap-2 p-2 rounded hover:bg-gray-200">
          <Home size={18} /> Dashboard
        </Link>
        <Link to="/optimizer" className="flex items-center gap-2 p-2 rounded hover:bg-gray-200">
          <LineChart size={18} /> Yield Optimizer
        </Link>
        <Link to="/reports" className="flex items-center gap-2 p-2 rounded hover:bg-gray-200">
          <FileText size={18} /> Reports
        </Link>
      </nav>
    </aside>
  );
}
