import { useState, useEffect } from "react";
import DataTable from "@/components/DataTable";
import ChartCard from "@/components/ChartCard";
import { useUIStore } from "@/lib/store";

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

  const risk = useUIStore((s) => s.riskTolerance);
  const setRisk = useUIStore((s) => s.setRiskTolerance);

  const rec = strategies[selected];

  // ✅ Use process.env instead of import.meta.env
  const API_URL =
    process.env.REACT_APP_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://aurorai.onrender.com";

  useEffect(() => {
    const fetchStrategies = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/api/optimizer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: "YOUR_WALLET_ADDRESS_HERE",
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
  }, [risk, API_URL]);

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
                    Target APY: <span className="font-semibold">{r.targetApy.toFixed(2)}%</span> · Est. Risk:{" "}
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

              <div className="mt-4">
                <button className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500">
                  Simulate
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
