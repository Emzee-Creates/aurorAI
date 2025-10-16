import express from "express";
import { runBacktest } from "../services/backtest";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let { allocations, assets, weights, startDate, endDate } = req.body;

    // Normalize request shape
    if (allocations && Array.isArray(allocations)) {
      assets = allocations.map((a: any) => a.symbol);
      weights = allocations.map((a: any) => a.weight);
    }

    if (!assets || !weights || assets.length !== weights.length) {
      throw new Error("Invalid or missing portfolio data.");
    }

    // Run the backtest simulation
    const results = await runBacktest({ assets, weights, startDate, endDate });
    res.json(results);
  } catch (error: any) {
    console.error("Error in /api/backtest:", error);
    res.status(400).json({
      error: error.message || "Failed to run backtest",
    });
  }
});

export default router;
