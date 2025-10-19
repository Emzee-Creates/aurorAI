import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Optimizer from "./pages/Optimizer";
import Strategies from "./pages/Strategies";
import Backtest from "./pages/Backtest";
import Settings from "./pages/Settings";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Header (adds left padding on mobile to account for sidebar toggle) */}
        <Header />

        {/* Main Section */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 bg-slate-950">
          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Main pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/optimizer" element={<Optimizer />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/backtest" element={<Backtest />} />
            <Route path="/settings" element={<Settings />} />

            {/* Fallback */}
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center h-full text-slate-400">
                  404 — Page Not Found
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
