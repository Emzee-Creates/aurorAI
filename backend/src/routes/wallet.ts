// src/routes/wallet.ts (CommonJS + TypeScript)
import type { Request, Response, NextFunction } from "express";

const express = require("express");
const { z } = require("zod");
const { getSignaturesForAddress, getTokenAccountsByOwner } = require("../services/helius");

const wallet = express.Router();

const addr = z.object({ address: z.string() });


wallet.get(
  "/tokens/:address",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { address }: { address: string } = addr.parse(req.params);

      const accounts: unknown = await getTokenAccountsByOwner(address);

      res.json({ address, accounts });
    } catch (e) {
      next(e);
    }
  }
);


wallet.get(
  "/txs/:address",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { address }: { address: string } = addr.parse(req.params);

      const sigs: unknown = await getSignaturesForAddress(address, 50);

      res.json({ address, signatures: sigs });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = wallet;
