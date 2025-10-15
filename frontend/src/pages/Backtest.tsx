import { useState, useEffect } from "react";
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
  const [range, setRange] = useState("365"); // default to 1 year
  const [data, setData] = useState<ChartPoint[]>([]);
  const [summary, setSummary] = useState<BacktestResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Load cached data
  useEffect(() => {
    const cached = localStorage.getItem("backtestResult");
    if (cached) {
      const parsed = JSON.parse(cached);
      setData(parsed.data);
      setSummary(parsed.summary);
    }
  }, []);

  const handleRunBacktest = async () => {
    setLoading(true);

    // Derive start and end dates based on selected range
    const endDate = new Date();
    const startDate = new Date();

    if (range !== "max") {
      startDate.setDate(endDate.getDate() - parseInt(range));
    } else {
      startDate.setFullYear(endDate.getFullYear() - 5); // Approx 5 years for "max"
    }

    try {
      const res = await fetch("https://aurorai.onrender.com/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assets: assets.split(",").map((a) => a.trim()),
          weights: weights.split(",").map((w) => parseFloat(w)),
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        }),
      });

      if (!res.ok) {
        throw new Error(`Backtest failed: ${res.statusText}`);
      }

      const result: BacktestResponse = await res.json();

      const chartData: ChartPoint[] = result.portfolioPerformance.map((p) => ({
        x: new Date(p.date).toLocaleDateString(),
        y: p.value,
      }));

      // ✅ Cache to localStorage
      localStorage.setItem(
        "backtestResult",
        JSON.stringify({ data: chartData, summary: result.summary })
      );

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
      {/* Inputs */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Asset Dropdown */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Assets</label>
            <select
              multiple
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
              value={assets.split(",")}
              onChange={(e) =>
                setAssets(Array.from(e.target.selectedOptions).map((o) => o.value).join(","))
              }
            >
              <option value="solana">Solana</option>
              <option value="usd-coin">USDC</option>
            </select>
          </div>

          {/* Weight Dropdown */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Weights</label>
            <select
              multiple
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
              value={weights.split(",")}
              onChange={(e) =>
                setWeights(Array.from(e.target.selectedOptions).map((o) => o.value).join(","))
              }
            >
              {Array.from({ length: 10 }, (_, i) => (i + 1) / 10).map((w) => (
                <option key={w} value={w.toFixed(1)}>
                  {w.toFixed(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Valid Range Dropdown */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Date Range</label>
            <select
              className="w-full rounded bg-slate-800 border border-slate-700 p-2 text-slate-100"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="1">1 Day</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="180">180 Days</option>
              <option value="365">365 Days</option>
              <option value="max">Max</option>
            </select>
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

      {/* Chart */}
      {data.length > 0 ? (
        <ChartCard title="Backtest Equity Curve" data={data} />
      ) : (
        <div className="text-slate-400 text-center mt-8">
          Run a backtest to visualize performance.
        </div>
      )}

      {/* Summary */}
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
