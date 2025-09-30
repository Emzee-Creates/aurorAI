import type { Request, Response, NextFunction } from "express";

const express = require("express");
const { z } = require("zod");

const { getWalletTokensAndBalance } = require("../services/wallet"); 
const { 
  analyzeConcentrationRisk,
  calculatePortfolioVaR     
} = require("../services/risk"); 

const risk = express.Router();

const varBody = z.object({
    walletAddress: z.string().min(30),
    timeHorizonDays: z.number().positive().optional(),
    confidenceLevel: z.number().min(0.01).max(0.99).optional(),
});


risk.post(
  "/calculate-var",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        walletAddress, 
        timeHorizonDays, 
        confidenceLevel 
      } = varBody.parse(req.body);

      // 🛑 REPLACEMENT: Call the real wallet function
      const balances = await getWalletTokensAndBalance(walletAddress);

      // Check for zero portfolio value, as your risk functions handle it
      if (balances.length === 0) {
           return res.status(200).json(
             calculatePortfolioVaR([], 
                                   timeHorizonDays ?? 1, 
                                   confidenceLevel ?? 0.95)
           );
      }

  
      const out = calculatePortfolioVaR(
        balances, 
        timeHorizonDays ?? 1,
        confidenceLevel ?? 0.95
      );

      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);


module.exports = risk;