import { useEffect, useState } from "react";
import { useWalletContext } from "@/context/WalletContext";



interface YieldStrategy {
  id?: string;
  name: string;
  protocol: string;
  apy: number;
  riskLevel: string;
  description?: string;
  assets: string[];
}

export default function Strategies() {
  const { walletAddress } = useWalletContext(); // ✅ Get wallet from context
  const [strategies, setStrategies] = useState<YieldStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL =
    process.env.REACT_APP_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://aurorai.onrender.com";

  useEffect(() => {
    const fetchStrategies = async () => {
      if (!walletAddress) {
        setError("No wallet connected.");
        return;
      }

      setError(null);

      // ✅ Check cache per wallet
      const cached = sessionStorage.getItem(`yield_strategies_${walletAddress}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setStrategies(parsed);
        console.log(`Loaded yield strategies for ${walletAddress} from cache.`);
        return;
      }

      // ✅ Fetch from API if no cache
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/optimize-yield/${walletAddress}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`Failed with status ${res.status}`);

        const data = await res.json();

        // Backend might return structured data instead of array, so normalize
        const fetchedStrategies: YieldStrategy[] = Array.isArray(data)
          ? data
          : [
              {
                id: "1",
                name: "SOL Staking Optimization",
                protocol: "Jito / Jupiter",
                apy: data.solStaking?.estimatedApy || 6.5,
                riskLevel: "Low",
                description:
                  "Earn staking rewards by converting SOL to JitoSOL and maximize yield.",
                assets: ["SOL", "JitoSOL"],
              },
              {
                id: "2",
                name: "USDC Stable Yield",
                protocol: "Orca / Jupiter",
                apy: (data.swapOptimization?.usdcYield?.apy || 0.04) * 100,
                riskLevel: "Low",
                description:
                  "Provide liquidity in SOL/USDC pools to earn stable yield.",
                assets: ["SOL", "USDC"],
              },
            ];

        setStrategies(fetchedStrategies);

        // ✅ Cache the fetched data (per wallet)
        sessionStorage.setItem(
          `yield_strategies_${walletAddress}`,
          JSON.stringify(fetchedStrategies)
        );
      } catch (err: any) {
        console.error("Error fetching yield strategies:", err);
        setError("Failed to load yield strategies.");
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, [walletAddress, API_URL]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-200">
            Yield Optimization Strategies
          </h2>
          {walletAddress && (
            <span className="text-xs text-slate-400">
              Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-slate-400 animate-pulse text-sm">
            Loading yield strategies...
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : strategies.length === 0 ? (
          <div className="text-slate-300 text-sm">
            No strategies yet. Run the optimizer to generate personalized results.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-700">
            <table className="min-w-full text-sm text-left text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Protocol</th>
                  <th className="px-4 py-3">APY</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Assets</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((s, idx) => (
                  <tr
                    key={s.id || idx}
                    className="border-t border-slate-800 hover:bg-slate-800/60 transition"
                  >
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3">{s.protocol}</td>
                    <td className="px-4 py-3 text-green-400">
                      {s.apy.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          s.riskLevel === "Low"
                            ? "bg-green-900 text-green-300"
                            : s.riskLevel === "Medium"
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {s.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.assets.join(", ")}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {s.description || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
