import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/RiskAnalyzer";
import YieldOptimizer from "./pages/YieldOptimizerPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/optimizer" element={<YieldOptimizer />} />
      </Routes>
    </BrowserRouter>
  );
}
