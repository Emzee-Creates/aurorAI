const express = require("express");
const { z } = require("zod");
const { getPriceByMint, getRouteQuote, getSwapTransaction } = require("../services/jupiter");
import type { QuoteResponse, SwapTransactionResponse } from "../types/jupiter";
import type { infer as ZodInfer } from "zod";

const market = express.Router();
import type { Request, Response, NextFunction } from "express";
import type jupiter = require("../types/jupiter");

// --- Symbol to Mint Address Mapping ---
const SYMBOL_TO_MINT: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  // Add more symbols as needed
};

// Helper function to resolve symbol to mint address
function resolveMint(value: string): string {
  return SYMBOL_TO_MINT[value] ?? value;
}

// --- API Endpoints ---

// --- GET /market/price/:mint ---
// Fetches the price of a given mint address or symbol.
market.get("/price/:mint", async (req: Request<{ mint: string }>, res: Response, next: NextFunction) => {
  try {
    const mint = resolveMint(req.params.mint);
    if (!mint) {
      return res.status(400).json({ error: "mint parameter is required" });
    }
    console.log("[/price] Requesting price for mint:", mint);
    const data = await getPriceByMint(mint);
    console.log("[/price] Price data:", data);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// --- POST /market/swap ---
// Handles the entire swap process in one atomic operation.
// It first fetches a fresh route quote and then immediately requests the swap transaction.
const swapSchema = z.object({
  inputMint: z.string(),
  outputMint: z.string(),
  amount: z.coerce.number().int(),
  userPublicKey: z.string(),
  slippageBps: z.coerce.number().int().min(1).max(5000).optional(),
  wrapUnwrapSOL: z.boolean().optional(),
});

// Infer a type from the Zod schema for type safety
type SwapRequestBody = ZodInfer<typeof swapSchema>;

market.post("/swap", async (req: Request<{}, {}, SwapRequestBody>, res: Response, next: NextFunction) => {
  try {
    // Validate and parse the request body
    const { inputMint, outputMint, amount, userPublicKey, slippageBps, wrapUnwrapSOL } = swapSchema.parse(req.body);

    // Resolve symbols to mint addresses
    const resolvedInputMint = resolveMint(inputMint);
    const resolvedOutputMint = resolveMint(outputMint);

    console.log("[/swap] Fetching fresh route for swap...");
    
    // Step 1: Get a fresh route quote from Jupiter.
    const route: jupiter.QuoteResponse | null = await getRouteQuote({
      inputMint: resolvedInputMint,
      outputMint: resolvedOutputMint,
      amount: String(amount), 
      slippageBps,
    });

    if (!route) {
      return res.status(404).json({ error: "No swap route found for these parameters." });
    }
    
    console.log("[/swap] Route fetched:", route?.routePlan?.length || 0, "steps");

    // Step 2: Immediately request the swap transaction using the fresh route.
    console.log("[/swap] Posting swap for user:", userPublicKey);
    
    const tx: SwapTransactionResponse | null = await getSwapTransaction({
      route,
      userPublicKey,
      wrapUnwrapSOL: wrapUnwrapSOL ?? true,
    });

    if (!tx) {
      return res.status(500).json({ error: "Failed to get swap transaction from Jupiter." });
    }

    console.log("[/swap] Swap transaction result:", tx.txid || "no txid returned");
    res.json(tx);
  } catch (e) {
    console.error("[/swap] Error:", e);
    // Pass the error to the Express error handler
    next(e);
  }
});

// Export the router
module.exports = market;
