import { Request, Response, Router } from "express";
import { getWalletAnalytics } from "../services/analytics";
import { analyzeSolStaking } from "../services/staking";
import { getRouteQuote, SYMBOL_TO_MINT } from "../services/jupiter";

const optimizerRouter = Router();

optimizerRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { walletAddress, riskTolerance } = req.body;

    if (!walletAddress || riskTolerance === undefined) {
      return res.status(400).json({ error: "walletAddress and riskTolerance are required." });
    }

    // Get wallet analytics to know balances
    const analytics = await getWalletAnalytics(walletAddress);
    const solHolding = analytics?.balances.find(h => h.symbol === "SOL");
    const solBalance = solHolding?.balance || 0;

    // Run staking analysis
    const solStaking = await analyzeSolStaking(solBalance);

    // Generate strategy recommendations based on risk
    const strategies = [
      {
        id: "yield_focus",
        name: "Yield-Focused Strategy",
        description: "Prioritize stable yield via staking and USDC swaps.",
        targetApy: solStaking.apy ? solStaking.apy * 100 : 8.0,
        estRisk: Math.min(40, riskTolerance),
        allocations: [
          { symbol: "SOL", weight: 0.4 },
          { symbol: "USDC", weight: 0.6 },
        ],
      },
      {
        id: "growth_focus",
        name: "Growth-Oriented Strategy",
        description: "Higher exposure to SOL and ETH for growth.",
        targetApy: 14.8,
        estRisk: Math.max(70, riskTolerance),
        allocations: [
          { symbol: "SOL", weight: 0.6 },
          { symbol: "ETH", weight: 0.3 },
          { symbol: "USDC", weight: 0.1 },
        ],
      },
    ];

    return res.json({ strategies });
  } catch (error) {
    console.error("Error in optimizer:", error);
    res.status(500).json({ error: "Failed to generate optimized strategies." });
  }
});

export default optimizerRouter;
