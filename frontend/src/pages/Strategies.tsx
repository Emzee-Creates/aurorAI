import { useEffect, useState } from "react";

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
  const [strategies, setStrategies] = useState<YieldStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL =
    process.env.REACT_APP_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://aurorai.onrender.com";

  useEffect(() => {
    const fetchStrategies = async () => {
      setError(null);

      // ✅ 1. Check cache first
      const cached = sessionStorage.getItem("yield_strategies");
      if (cached) {
        const parsed = JSON.parse(cached);
        setStrategies(parsed);
        console.log("Loaded yield strategies from cache.");
        return;
      }

      // ✅ 2. Fetch from API if no cache
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/optimize-yield`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`Failed with status ${res.status}`);

        const data = await res.json();
        const fetchedStrategies = data.strategies || data || [];

        setStrategies(fetchedStrategies);

        // ✅ 3. Cache the fetched data
        sessionStorage.setItem(
          "yield_strategies",
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
  }, [API_URL]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="text-sm text-slate-400 mb-3">Saved Strategies</div>

        {loading ? (
          <div className="text-slate-400 animate-pulse text-sm">
            Loading yield strategies...
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : strategies.length === 0 ? (
          <div className="text-slate-300 text-sm">
            No strategies yet. Create one from the Optimizer tab.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((s, idx) => (
              <div
                key={s.id || idx}
                className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 hover:bg-slate-800 transition"
              >
                <div className="text-lg font-semibold text-white mb-1">
                  {s.name}
                </div>
                <div className="text-sm text-slate-400 mb-2">
                  Protocol:{" "}
                  <span className="text-slate-200">{s.protocol}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-green-400 font-medium">
                    {s.apy.toFixed(2)}% APY
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${
                      s.riskLevel === "Low"
                        ? "bg-green-900 text-green-300"
                        : s.riskLevel === "Medium"
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {s.riskLevel} Risk
                  </div>
                </div>
                <div className="text-slate-400 text-sm mb-3">
                  {s.description || "No description available."}
                </div>
                <div className="text-xs text-slate-500">
                  Assets:{" "}
                  <span className="text-slate-300">
                    {s.assets?.join(", ") || "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
