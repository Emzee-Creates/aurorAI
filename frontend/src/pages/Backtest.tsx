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
  const [asset1, setAsset1] = useState("solana");
  const [asset2, setAsset2] = useState("usd-coin");
  const [weight1, setWeight1] = useState(0.6);
  const [weight2, setWeight2] = useState(0.4);
  const [startDate, setStartDate] = useState("2024-10-01");
  const [endDate, setEndDate] = useState("2025-10-01");
  const [data, setData] = useState<ChartPoint[]>([]);
  const [summary, setSummary] = useState<BacktestResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://aurorai.onrender.com/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assets: [asset1, asset2],
          weights: [weight1, weight2],
          startDate,
          endDate,
        }),
      });

      const result: BacktestResponse = await res.json();

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
          {/* Asset 1 */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Asset 1</label>
            <select
              value={asset1}
              onChange={(e) => setAsset1(e.target.value)}
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
            >
              <option value="solana">Solana</option>
              <option value="usd-coin">USD Coin</option>
            </select>
          </div>

          {/* Weight 1 */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Weight 1</label>
            <select
              value={weight1}
              onChange={(e) => setWeight1(parseFloat(e.target.value))}
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
            >
              {Array.from({ length: 10 }, (_, i) => (i + 1) / 10).map((w) => (
                <option key={w} value={w}>
                  {w.toFixed(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Asset 2 */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Asset 2</label>
            <select
              value={asset2}
              onChange={(e) => setAsset2(e.target.value)}
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
            >
              <option value="solana">Solana</option>
              <option value="usd-coin">USD Coin</option>
            </select>
          </div>

          {/* Weight 2 */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Weight 2</label>
            <select
              value={weight2}
              onChange={(e) => setWeight2(parseFloat(e.target.value))}
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
            >
              {Array.from({ length: 10 }, (_, i) => (i + 1) / 10).map((w) => (
                <option key={w} value={w}>
                  {w.toFixed(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
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
