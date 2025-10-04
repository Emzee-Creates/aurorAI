// src/pages/YieldOptimizerPage.tsx
import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AssetYieldCard from "../components/yield/AssetYieldCard";

interface YieldOptimizationData {
  solBalance: number;
  balances: Array<{ symbol: string; balance: number; price?: number }>;
  solStaking: {
    yieldSol: number;
    yieldUsd: number;
  };
  swapOptimization: {
    usdcYield: { projectedUsdYield: number };
    swapQuote: string;
  };
}

export default function YieldOptimizerPage() {
  const [data, setData] = useState<YieldOptimizationData | null>(null);

  // Simulated fetch
  useEffect(() => {
    const simulated: YieldOptimizationData = {
      solBalance: 12.5,
      balances: [
        { symbol: "SOL", balance: 12.5, price: 150 },
        { symbol: "USDC", balance: 500, price: 1 },
      ],
      solStaking: {
        yieldSol: 0.9,
        yieldUsd: 135,
      },
      swapOptimization: {
        usdcYield: { projectedUsdYield: 110 },
        swapQuote: "Swap 12.5 SOL → 1875 USDC",
      },
    };
    setTimeout(() => setData(simulated), 600);
  }, []);

  // --- Comparison and Recommendation Logic ---
  const { solYieldSol, solYieldUsd, usdcYieldUsd, recommendedOption, swapQuote } =
    useMemo(() => {
      const apy = 7.35; // Hardcoded APY
      const solBalance = data?.solBalance || 0;

      const solHolding = data?.balances?.find((h) => h.symbol === "SOL");
      const solPrice = solHolding?.price || 0;

      const yieldSol = (solBalance * apy) / 100;
      const yieldUsd = yieldSol * solPrice;

      const usdcYield = data?.swapOptimization.usdcYield?.projectedUsdYield || 0;
      const quote = data?.swapOptimization.swapQuote;

      let recommendation: "SOL" | "USDC" | "None" = "None";
      if (yieldUsd > usdcYield) {
        recommendation = "SOL";
      } else if (usdcYield > yieldUsd && usdcYield > 0) {
        recommendation = "USDC";
      } else if (yieldUsd > 0) {
        recommendation = "SOL";
      }

      return {
        solYieldSol: yieldSol,
        solYieldUsd: yieldUsd,
        usdcYieldUsd: usdcYield,
        recommendedOption: recommendation,
        swapQuote: quote,
      };
    }, [data]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        <Header />

        <main className="p-6 space-y-6 bg-gray-50 flex-1">
          {!data ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Loading yield optimizer...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">
                  Yield Optimizer
                </h1>
                {/* ✅ Action button restored */}
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition">
                  Optimize Now
                </button>
              </div>
              <p className="text-gray-600">
                Compare staking SOL vs swapping to USDC for optimal yield.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SOL Staking Option */}
                <AssetYieldCard
                  title="Stake SOL (→ mSOL/JitoSOL)"
                  symbol="SOL"
                  apy={0.0735}
                  yieldValue={solYieldSol}
                  yieldUsd={solYieldUsd}
                  riskLevel="Low"
                  isRecommended={recommendedOption === "SOL"}
                  details="Stake SOL to earn validator rewards with liquid staking derivatives."
                />

                {/* USDC Swap Option */}
                <AssetYieldCard
                  title="Swap SOL → USDC"
                  symbol="USDC"
                  apy={0.05}
                  yieldValue={usdcYieldUsd / 1}
                  yieldUsd={usdcYieldUsd}
                  riskLevel="Moderate"
                  isRecommended={recommendedOption === "USDC"}
                  details={`Projected yield if you swap SOL into USDC and deploy into DeFi. Quote: ${swapQuote}`}
                />
              </div>

              {/* Recommendation Banner */}
              <div className="mt-10 p-6 bg-indigo-50 border border-indigo-200 rounded-xl">
                <h2 className="text-xl font-bold text-indigo-700 mb-2">
                  Recommendation
                </h2>
                {recommendedOption === "SOL" && (
                  <p className="text-gray-700">
                    Staking SOL offers higher projected returns. Consider staking into
                    mSOL or JitoSOL.
                  </p>
                )}
                {recommendedOption === "USDC" && (
                  <p className="text-gray-700">
                    Swapping to USDC and deploying in DeFi pools may provide better
                    yield.
                  </p>
                )}
                {recommendedOption === "None" && (
                  <p className="text-gray-700">
                    Both options provide comparable yield. Diversification may be best.
                  </p>
                )}
              </div>
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
