import express from "express";
import { runBacktest } from "../services/backtest";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { assets, weights, startDate, endDate } = req.body;
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
