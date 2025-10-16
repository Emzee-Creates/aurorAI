import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import ChartCard from "@/components/ChartCard";
import { useUIStore } from "@/lib/store";
import { useWalletContext } from "@/context/WalletContext";

interface Allocation {
  symbol: string;
  weight: number;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  targetApy: number;
  estRisk: number;
  allocations: Allocation[];
}

export default function Optimizer() {
  const [selected, setSelected] = useState(0);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simData, setSimData] = useState<{ x: number; y: number }[] | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const risk = useUIStore((s) => s.riskTolerance);
  const setRisk = useUIStore((s) => s.setRiskTolerance);
  const { walletAddress } = useWalletContext();

  const rec = strategies[selected];

  // API base
  const API_URL =
    process.env.REACT_APP_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://aurorai.onrender.com";

  // Fetch strategies when risk or wallet changes
  useEffect(() => {
    if (!walletAddress) return; // wait until wallet is connected
    const fetchStrategies = async () => {
      setLoading(true);
      setError(null);
      setSimData(null); // reset simulation when new strategies are fetched

      try {
        const res = await fetch(`${API_URL}/api/optimizer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            riskTolerance: risk,
          }),
        });

        if (!res.ok) throw new Error(`Failed with status ${res.status}`);
        const data = await res.json();
        setStrategies(data.strategies || []);
      } catch (err: any) {
        console.error("Error fetching strategies:", err);
        setError("Failed to load optimized strategies.");
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, [risk, walletAddress, API_URL]);

  // --- Simulate button logic ---
  const handleSimulate = async () => {
    if (!rec) return;
    setSimLoading(true);
    setSimData(null);

    try {
      const res = await fetch(`${API_URL}/api/backtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocations: rec.allocations,
          startDate: "2024-01-01",
          endDate: "2025-01-01",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimData(data.results || []); // use backend results
      } else {
        console.warn("Backtest unavailable, using mock data...");
        throw new Error("Backtest failed");
      }
    } catch {
      // --- Mock fallback ---
      const mockSim = Array.from({ length: 12 }, (_, i) => ({
        x: i + 1,
        y: 100 * (1 + (i * rec.targetApy) / 100 / 12),
      }));
      setSimData(mockSim);
    } finally {
      setSimLoading(false);
    }
  };

  if (!walletAddress) {
    return (
      <div className="text-center text-slate-400 mt-10">
        Please connect your wallet to view optimization strategies.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* --- RISK SLIDER --- */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Risk Tolerance</div>
            <div className="text-2xl font-semibold">{risk}/100</div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
            className="w-80 accent-brand-500"
          />
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* LEFT: STRATEGY LIST */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 text-sm text-slate-400">Recommended Strategies</div>

          {loading ? (
            <div className="text-slate-400 text-sm animate-pulse">Loading strategies...</div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : strategies.length === 0 ? (
            <div className="text-slate-400 text-sm">No strategies available for this risk level.</div>
          ) : (
            <div className="space-y-2">
              {strategies.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(i)}
                  className={`w-full rounded-md border px-3 py-2 text-left transition ${
                    selected === i
                      ? "border-brand-500 bg-slate-800"
                      : "border-slate-800 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-slate-400">{r.description}</div>
                  <div className="mt-1 text-sm text-slate-300">
                    Target APY:{" "}
                    <span className="font-semibold">{r.targetApy.toFixed(2)}%</span> · Est. Risk:{" "}
                    <span className="font-semibold">{r.estRisk}/100</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: STRATEGY DETAILS */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          {!rec ? (
            <div className="text-slate-400 text-sm">Select a strategy to view details.</div>
          ) : (
            <>
              <div className="mb-2 text-sm text-slate-400">Allocation</div>
              <DataTable
                columns={[
                  { key: "symbol", header: "Asset" },
                  {
                    key: "weight",
                    header: "Weight",
                    format: (v) => `${(v * 100).toFixed(0)}%`,
                  },
                ]}
                rows={rec.allocations}
              />

              <div className="mt-4">
                <ChartCard
                  title="Projected Growth"
                  data={Array.from({ length: 30 }, (_, i) => ({
                    x: i + 1,
                    y: 100 * (1 + i * (rec.targetApy / 100) / 12),
                  }))}
                />
              </div>

              {simData && (
                <div className="mt-4">
                  <ChartCard title="Simulated Backtest" data={simData} />
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={handleSimulate}
                  disabled={simLoading}
                  className={`rounded-md px-3 py-2 text-sm font-medium text-white ${
                    simLoading ? "bg-slate-600" : "bg-brand-600 hover:bg-brand-500"
                  }`}
                >
                  {simLoading ? "Simulating..." : "Simulate"}
                </button>
                <button className="ml-2 rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">
                  Execute via Wallet
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
