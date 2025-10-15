import { getCoinGeckoOHLCForCoins } from "./coingecko";

interface BacktestInput {
  assets: string[];
  weights: number[];
  startDate: string;
  endDate: string;
}

interface PortfolioPoint {
  date: number;
  value: number;
}

export async function runBacktest({
  assets,
  weights,
  startDate,
  endDate,
}: BacktestInput) {
  if (!assets || !weights || assets.length !== weights.length) {
    throw new Error("Assets and weights are required and must match in length.");
  }

  // ✅ Auto-balance weights so they sum to 1.0
  const totalWeight = weights.reduce((a, b) => a + (b || 0), 0);
  const normalizedWeights =
    totalWeight > 0 ? weights.map((w) => w / totalWeight) : weights;

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (isNaN(start) || isNaN(end) || start >= end) {
    throw new Error("Invalid date range provided.");
  }

  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const historicalData = await getCoinGeckoOHLCForCoins(assets, days);

  const portfolioTimeline: PortfolioPoint[] = [];

  const baseAsset = assets[0];
  if (!baseAsset) throw new Error("Base asset is undefined.");

  const baseOHLC = historicalData[baseAsset];
  if (!baseOHLC || baseOHLC.length === 0) {
    throw new Error("No OHLC data found for base asset.");
  }

  for (let i = 0; i < baseOHLC.length; i++) {
    let totalValue = 0;

    for (let idx = 0; idx < assets.length; idx++) {
      const asset = assets[idx];
      const assetData = historicalData[asset as keyof typeof historicalData];
      if (!assetData || !assetData[i] || !assetData[0]) continue;

      const closePrice = assetData[i]?.[4];
      const startPrice = assetData[0]?.[4];

      if (
        typeof closePrice === "number" &&
        typeof startPrice === "number" &&
        startPrice > 0
      ) {
        const returnRatio = closePrice / startPrice;
        if (normalizedWeights[idx] !== undefined && returnRatio !== undefined) {
          totalValue += (normalizedWeights[idx] ?? 0) * (returnRatio ?? 0);
        }
      }
    }

    const date = baseOHLC[i]?.[0] ?? Date.now();
    portfolioTimeline.push({
      date: typeof date === "number" ? date : Date.now(),
      value: totalValue * 1000, // assume $1000 start
    });
  }

  const startVal = portfolioTimeline[0]?.value ?? 1000;
  const endVal =
    portfolioTimeline[portfolioTimeline.length - 1]?.value ?? startVal;
  const totalReturn = ((endVal - startVal) / startVal) * 100;

  // ✅ Safe max drawdown computation
  let peak = startVal;
  let maxDrawdown = 0;

  for (const point of portfolioTimeline) {
    if (point.value > peak) peak = point.value;
    const drawdown = ((peak - point.value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return {
    portfolioPerformance: portfolioTimeline,
    summary: {
      totalReturn: totalReturn.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      startDate,
      endDate,
    },
  };
}
