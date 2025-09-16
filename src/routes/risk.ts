// src/routes/risk.ts (CommonJS + TypeScript)
import type { Request, Response, NextFunction } from "express";

const express = require("express");
const { z } = require("zod");
const { portfolioVaR } = require("../services/risk");

const risk = express.Router();

const simBody = z.object({
  // Price history per asset (close prices)
  series: z.array(z.array(z.number().positive())).min(1),
  // Weights that sum approximately to 1
  weights: z.array(z.number()).min(1),
  confidence: z.number().optional(),
});


risk.post(
  "/simulate",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { series, weights, confidence } = simBody.parse(req.body);

      if (weights.length !== series.length) {
        return res
          .status(400)
          .json({ error: "weights length must equal number of series" });
      }

      
      const s = weights.reduce((a: number, b: number) => a + b, 0);
      const norm = weights.map((w: number) => w / s);

      // Calculate portfolio VaR
      const out = portfolioVaR(norm, series, confidence ?? 0.95);
      res.json({ weights: norm, ...out });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = risk;
