// src/pages/YieldOptimizerPage.tsx
import { useEffect, useState, useMemo } from "react";
import AssetYieldCard from "../components/yield/AssetYieldCard"; // ✅ check path (adjust if you put inside /yield/ folder)

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

  // ✅ Simulated fetch
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
  const { solYieldSol, solYieldUsd, usdcYieldUsd, recommendedOption, swapQuote } = useMemo(() => {
    const apy = 7.35; // Hardcoded APY

    const solBalance = data?.solBalance || 0;

    // ✅ Derive SOL price from balances if available
    const solHolding = data?.balances?.find((h) => h.symbol === "SOL");
    const solPrice = solHolding?.price || 0;

    // ✅ Calculate SOL staking yield
    const yieldSol = (solBalance * apy) / 100;
    const yieldUsd = yieldSol * solPrice;

    // ✅ USDC yield from API
    const usdcYield = data?.swapOptimization.usdcYield?.projectedUsdYield || 0;
    const quote = data?.swapOptimization.swapQuote;

    // ✅ Recommendation logic
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

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading yield optimizer...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800">
        Yield Optimizer
      </h1>
      <p className="text-gray-600 mb-10">
        Compare staking SOL vs swapping to USDC for optimal yield.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ✅ SOL Staking Option */}
        <AssetYieldCard
          title="Stake SOL (→ mSOL/JitoSOL)"
          symbol="SOL"
          apy={0.0735} // pass as decimal
          yieldValue={solYieldSol}
          yieldUsd={solYieldUsd}
          riskLevel="Low"
          isRecommended={recommendedOption === "SOL"}
          details="Stake SOL to earn validator rewards with liquid staking derivatives."
        />

        {/* ✅ USDC Swap Option */}
        <AssetYieldCard
          title="Swap SOL → USDC"
          symbol="USDC"
          apy={0.05}
          yieldValue={usdcYieldUsd / 1} // treat USD yield as 1:1 USDC
          yieldUsd={usdcYieldUsd}
          riskLevel="Moderate"
          isRecommended={recommendedOption === "USDC"}
          details={`Projected yield if you swap SOL into USDC and deploy into DeFi. Quote: ${swapQuote}`}
        />
      </div>

      {/* ✅ Recommendation Banner */}
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
    </div>
  );
}
