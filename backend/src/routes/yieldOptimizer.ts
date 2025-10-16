import { Request, Response, Router } from "express";
import { getWalletAnalytics } from "../services/analytics";
import { analyzeSolStaking } from "../services/staking";
import { getRouteQuote, SYMBOL_TO_MINT } from "../services/jupiter";

const SOL_DECIMALS = 9;
const STABLECOIN_APY_PLACEHOLDER = 0.04;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache lifespan

const yieldOptimizerRouter = Router();

// Simple in-memory cache
const cache: Record<
  string,
  { data: any; timestamp: number }
> = {};

/**
 * Helper to check if cached data is still valid
 */
function isCacheValid(entry?: { timestamp: number }) {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Endpoint: GET /api/yield-optimizer/saved
 * Returns all cached strategies for UI display (e.g., "Saved Strategies" page)
 */
yieldOptimizerRouter.get("/saved", (req: Request, res: Response) => {
  const allCached = Object.entries(cache)
    .filter(([_, entry]) => isCacheValid(entry))
    .map(([wallet, entry]) => ({
      wallet,
      timestamp: entry.timestamp,
      strategy: entry.data,
    }));

  if (allCached.length === 0) {
    return res.status(404).json({ message: "No saved strategies found." });
  }

  res.json({ count: allCached.length, strategies: allCached });
});

/**
 * Endpoint: GET /api/yield-optimizer/:walletAddress
 * Runs yield analysis OR returns cached result
 */
yieldOptimizerRouter.get("/:walletAddress", async (req: Request, res: Response) => {
  const { walletAddress } = req.params;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required." });
  }

  // Serve from cache if available
  const cached = cache[walletAddress];
  if (isCacheValid(cached)) {
    console.log(`Serving cached result for ${walletAddress}`);
    return res.json({ cached: true, ...(cached?.data || {}) });
  }

  try {
    // Fetch Core Wallet Data
    const analyticsData = await getWalletAnalytics(walletAddress);
    if (!analyticsData) {
      return res.status(404).json({ error: "Could not fetch wallet data." });
    }

    const solHolding = analyticsData.balances.find((h) => h.symbol === "SOL");
    const solBalance = solHolding?.balance || 0;

    // Run SOL staking analysis
    const solStakingAnalysis = await analyzeSolStaking(solBalance);

    // Prepare Jupiter quote request
    let SWAP_AMOUNT_SOL_TO_QUOTE: string;
    if (solBalance > 0) {
      const multiplier = Math.pow(10, SOL_DECIMALS);
      SWAP_AMOUNT_SOL_TO_QUOTE = Math.round(solBalance * multiplier).toString();
    } else {
      SWAP_AMOUNT_SOL_TO_QUOTE = "1000000000"; // 1 SOL baseline
    }

    const usdcMint = SYMBOL_TO_MINT.USDC;
    const solMint = SYMBOL_TO_MINT.SOL;

    let swapQuote = null;
    if (solBalance > 0) {
      swapQuote = await getRouteQuote({
        inputMint: solMint || "",
        outputMint: usdcMint || "",
        amount: SWAP_AMOUNT_SOL_TO_QUOTE,
        slippageBps: 50,
      });
    }

    // Calculate estimated yield
    let estimatedUsdcYield = null;
    let quotedUsdcAmount = 0;

    if (swapQuote) {
      const USDC_DECIMALS = 6;
      quotedUsdcAmount = parseFloat(swapQuote.outAmount) / Math.pow(10, USDC_DECIMALS);
      estimatedUsdcYield = {
        targetToken: "USDC",
        apy: STABLECOIN_APY_PLACEHOLDER,
        projectedUsdYield: quotedUsdcAmount * STABLECOIN_APY_PLACEHOLDER,
      };
    }

    const result = {
      wallet: walletAddress,
      solBalance,
      totalPortfolioValueUSD: analyticsData.totalPortfolioValueUSD,
      solStaking: {
        ...solStakingAnalysis,
        currentPriceUSD: solHolding?.price || 0,
      },
      swapOptimization: {
        quoteBasis: solBalance > 0 ? "Full Balance" : "N/A",
        swapQuote,
        quotedUsdcAmount,
        usdcYield: estimatedUsdcYield,
      },
    };

    // Save to cache
    cache[walletAddress] = { data: result, timestamp: Date.now() };

    return res.json({ cached: false, ...result });
  } catch (error) {
    console.error("Error fetching yield optimization data:", error);

    const statusCode = (error as any).response?.status || 500;
    const errorMessage =
      (error as any).response?.data?.error ||
      "Internal server error during yield optimization analysis.";

    return res.status(statusCode).json({ error: errorMessage });
  }
});

export default yieldOptimizerRouter;
