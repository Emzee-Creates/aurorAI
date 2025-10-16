import { useState, useEffect } from "react";
import { useWalletContext } from "../context/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { getWalletAnalytics } from "../api/analytics";
import { useUIStore } from "@/lib/store";

/**
 * Simple utility to format a number for a currency
 */
function formatCurrency(amount: number, currency: string) {
  const locales: Record<string, string> = {
    USD: "en-US",
    USDC: "en-US",
    NGN: "en-NG",
  };
  const symbols: Record<string, string> = {
    USD: "USD",
    USDC: "USDC",
    NGN: "NGN",
  };

  try {
    return new Intl.NumberFormat(locales[currency] || "en-US", {
      style: "currency",
      currencyDisplay: "code",
      currency: currency === "USDC" ? "USD" : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Hook to fetch currency conversion rates (USD -> target)
 * Includes fallback for NGN (₦1305 / USD)
 */
function useCurrencyRate(target: "USD" | "USDC" | "NGN") {
  const [rate, setRate] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const FALLBACK_RATE_NGN = 1305;

      if (target === "USD" || target === "USDC") {
        setRate(1);
        return;
      }

      setLoading(true);
      setError(null);

      const cacheKey = `fx_usd_to_${target}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < 30 * 60 * 1000) {
            if (mounted) {
              setRate(parsed.rate);
              setLoading(false);
            }
            return;
          }
        }

        const resp = await fetch(
          `https://api.exchangerate.host/latest?base=USD&symbols=${target}`
        );
        if (!resp.ok) throw new Error(`Rate fetch failed: ${resp.status}`);

        const json = await resp.json();
        const fetched = json?.rates?.[target];

        if (!fetched || fetched < 1) throw new Error("Invalid rate fetched");
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ rate: fetched, ts: Date.now() })
        );

        if (mounted) setRate(fetched);
      } catch (err) {
        console.error("Failed to fetch FX rate:", err);
        if (mounted) {
          if (target === "NGN") {
            setRate(FALLBACK_RATE_NGN);
            setError("Using fallback rate (₦1305/USD)");
          } else {
            setError("Failed to fetch FX rate — showing USD values");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [target]);

  return { rate, loading, error };
}

export default function Dashboard() {
  const { walletAddress, setWalletAddress, clearWallet } = useWalletContext();
  const [inputAddress, setInputAddress] = useState(walletAddress || "");
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);

  const baseCurrency = useUIStore((s) => s.baseCurrency);
  const { rate: usdToBase, loading: fxLoading, error: fxError } =
    useCurrencyRate(baseCurrency);

  const {
    data: walletData,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["walletAnalytics", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      return await getWalletAnalytics(walletAddress);
    },
    enabled: !!walletAddress,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAddress.trim()) return;
    setWalletAddress(inputAddress.trim());
  };

  const handleRefresh = () => refetch();
  const handleClear = () => {
    clearWallet();
    setInputAddress("");
  };

  const convert = (usd: number | undefined) => {
    if (usd === undefined || usd === null) return 0;
    return usd * usdToBase;
  };

  const formatValue = (usd: number | undefined) => {
    const converted = convert(usd);
    if (baseCurrency === "USDC") {
      return `${converted.toFixed(2)} USDC`;
    }
    return formatCurrency(converted, baseCurrency);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 w-full sm:w-auto"
        >
          <input
            type="text"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            placeholder="Enter wallet address"
            className={`flex-1 sm:w-80 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors
              ${
                inputAddress
                  ? "text-green-600 border-green-400"
                  : "text-gray-500 border-gray-300"
              }
            `}
          />

          <button
            type="submit"
            disabled={isFetching}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isFetching ? "Loading..." : "Load"}
          </button>

          {walletAddress && (
            <>
              <button
                type="button"
                onClick={handleRefresh}
                className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-300"
              >
                Clear
              </button>
            </>
          )}
        </form>
      </div>

      {walletAddress && (
        <div className="text-sm text-gray-600">
          Connected wallet:{" "}
          <span className="font-mono">{walletAddress}</span>
        </div>
      )}

      {/* FX info */}
      {fxLoading ? (
        <div className="text-xs text-slate-500">Loading exchange rate...</div>
      ) : fxError ? (
        <div className="text-xs text-yellow-600">{fxError}</div>
      ) : baseCurrency !== "USD" ? (
        <div className="text-xs text-slate-500">
          Showing values in <strong>{baseCurrency}</strong> (1 USD ={" "}
          {usdToBase.toFixed(2)} {baseCurrency})
        </div>
      ) : null}

      {/* Dashboard content */}
      {isFetching && (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-600 mr-3" />
          Loading dashboard data...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center">
          Failed to load data. Please check the wallet address.
        </div>
      )}

      {!isFetching && !error && walletData && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              title="Portfolio Value"
              value={formatValue(walletData.totalPortfolioValueUSD)}
            />
            <Card
              title="SOL Yield / APY"
              value={formatValue(
                (walletData?.solBalance || 0) * (walletData?.solPriceUSD || 0)
              )}
              subtitle={`SOL Price: ${formatValue(walletData?.solPriceUSD)}`}
            />
            {(walletData?.concentrationRisk || walletData?.solStakingAnalysis) && (
              <Card
                title="Risk Summary"
                value={walletData?.concentrationRisk?.level || "Moderate"}
                subtitle={walletData?.solStakingAnalysis?.summary || ""}
              />
            )}
          </section>

          {/* Risky assets */}
          {walletData.riskyAssets?.length > 0 && (
            <Section title="Risky Assets">
              <Table
                headers={["Asset", "Exposure", "Risk Level"]}
                rows={walletData.riskyAssets.map((a: any) => [
                  a.name,
                  formatValue(a.exposure),
                  <span className="text-red-500 font-medium">{a.riskLevel}</span>,
                ])}
              />
            </Section>
          )}

          {/* Token balances */}
          {walletData.balances?.length > 0 && (
            <Section title="Token Balances">
              <Table
                headers={[
                  "Token",
                  "Balance",
                  `Value (${baseCurrency})`,
                ]}
                rows={(showAllTokens
                  ? walletData.balances
                  : walletData.balances.slice(0, 5)
                ).map((t: any) => [t.symbol, t.amount, formatValue(t.valueUSD)])}
              />
              {walletData.balances.length > 5 && (
                <div className="text-center mt-2 text-black">
                  <button
                    onClick={() => setShowAllTokens(!showAllTokens)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {showAllTokens ? "Show Less" : "Show More"}
                  </button>
                </div>
              )}
            </Section>
          )}

          {/* Transactions */}
          {walletData.transactions?.length > 0 && (
            <Section title="Recent Transactions">
              <Table
                headers={["Type", "Amount", "Token", "Date"]}
                rows={(showAllTx
                  ? walletData.transactions
                  : walletData.transactions.slice(0, 5)
                ).map((tx: any) => [
                  tx.type,
                  tx.amount,
                  tx.token,
                  new Date(tx.date).toLocaleDateString(),
                ])}
              />
              {walletData.transactions.length > 5 && (
                <div className="text-center mt-2">
                  <button
                    onClick={() => setShowAllTx(!showAllTx)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {showAllTx ? "Show Less" : "Show More"}
                  </button>
                </div>
              )}
            </Section>
          )}

          {/* User activity */}
          {walletData.userBehavior && (
            <Section title="User Activity Profile">
              <div className="bg-white rounded-xl shadow-sm p-4 border">
                <p className="text-gray-700 mb-2">
                  Behavior Type:{" "}
                  <strong>{walletData.userBehavior.profile}</strong>
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {Object.entries(walletData.userBehavior.metrics || {}).map(
                    ([metric, value]) => (
                      <li key={metric}>
                        {metric}:{" "}
                        <span className="font-medium">{String(value)}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

/* --- Subcomponents --- */
function Card({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (React.ReactNode[])[];
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="text-left text-gray-600 border-b">
            {headers.map((h, i) => (
              <th key={i} className="py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-none">
              {row.map((cell, j) => (
                <td key={j} className="py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
