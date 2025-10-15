import { useState } from "react";
import ChartCard from "@/components/ChartCard";

interface PortfolioPoint {
  date: number;
  value: number;
}

interface ChartPoint {
  x: string | number;
  y: number;
}

interface BacktestResponse {
  portfolioPerformance: PortfolioPoint[];
  summary: {
    totalReturn: string;
    maxDrawdown: string;
    startDate: string;
    endDate: string;
  };
}

export default function Backtest() {
  const [assets, setAssets] = useState("solana,usd-coin");
  const [weights, setWeights] = useState("0.6,0.4");
  const [startDate, setStartDate] = useState("2024-10-01");
  const [endDate, setEndDate] = useState("2025-10-01");
  const [data, setData] = useState<ChartPoint[]>([]);
  const [summary, setSummary] = useState<BacktestResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assets: assets.split(",").map((a) => a.trim()),
          weights: weights.split(",").map((w) => parseFloat(w)),
          startDate,
          endDate,
        }),
      });
      const result: BacktestResponse = await res.json();

      // Transform data to match ChartCard's expected shape
      const chartData: ChartPoint[] = result.portfolioPerformance.map((point) => ({
        x: new Date(point.date).toLocaleDateString(),
        y: point.value,
      }));

      setData(chartData);
      setSummary(result.summary);
    } catch (err) {
      console.error("Backtest failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Assets (comma-separated)
            </label>
            <input
              type="text"
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
              value={assets}
              onChange={(e) => setAssets(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Weights (comma-separated)
            </label>
            <input
              type="text"
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
              value={weights}
              onChange={(e) => setWeights(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Start Date</label>
            <input
              type="date"
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">End Date</label>
            <input
              type="date"
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={handleRunBacktest}
          disabled={loading}
          className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {loading ? "Running..." : "Run Backtest"}
        </button>
      </div>

      {data.length > 0 ? (
        <ChartCard title="Backtest Equity Curve" data={data} />
      ) : (
        <div className="text-slate-400 text-center mt-8">
          Run a backtest to visualize performance.
        </div>
      )}

      {summary && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-slate-300">
          <div className="text-sm text-slate-400 mb-2">Summary</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Total Return:</strong> {summary.totalReturn}%
            </div>
            <div>
              <strong>Max Drawdown:</strong> {summary.maxDrawdown}%
            </div>
            <div>
              <strong>Start:</strong> {summary.startDate}
            </div>
            <div>
              <strong>End:</strong> {summary.endDate}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
