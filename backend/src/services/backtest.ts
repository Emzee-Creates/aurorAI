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

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

  const historicalData = await getCoinGeckoOHLCForCoins(assets, days);

  const portfolioTimeline: PortfolioPoint[] = [];

  const baseAsset = assets[0];
  if (!baseAsset) {
    throw new Error("Base asset is undefined.");
  }
  const baseOHLC = historicalData[baseAsset];

  if (!baseOHLC || baseOHLC.length === 0) {
    throw new Error("No OHLC data found for base asset.");
  }

  baseOHLC.forEach((_: number[], i: number) => {
    let totalValue = 0;

    assets.forEach((asset, idx) => {
      const assetData = historicalData[asset];
      if (assetData && assetData[i] && assetData[0]) {
        const closePrice = assetData[i][4];
        const startPrice = assetData[0][4];
        if (closePrice !== undefined && startPrice !== undefined) {
          const returnRatio = closePrice / startPrice;
          if (weights[idx] !== undefined && returnRatio !== undefined) {
            totalValue += weights[idx] * returnRatio;
          }
        }
      }
    });

    portfolioTimeline.push({
      date:
        baseOHLC[i] && baseOHLC[i][0] !== undefined
          ? baseOHLC[i][0]
          : Date.now(),
      value: totalValue * 1000, // assume $1000 start
    });
  });

  const startVal = portfolioTimeline[0]?.value ?? 1000;
  const endVal =
    portfolioTimeline[portfolioTimeline.length - 1]?.value ?? startVal;
  const totalReturn = ((endVal - startVal) / startVal) * 100;

  // Compute max drawdown safely
  let peak = startVal;
  let maxDrawdown = 0;

  portfolioTimeline.forEach((point) => {
    if (point.value > peak) peak = point.value;
    const drawdown = ((peak - point.value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

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
