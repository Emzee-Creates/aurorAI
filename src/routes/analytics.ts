// --- File: src/routes/analytics.ts ---

import { Router } from "express";
const { getWalletAnalytics } = require("../services/analytics");

const router = Router();

router.get("/:wallet", async (req, res) => {
  const { wallet } = req.params;
  try {
    const data = await getWalletAnalytics(wallet);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wallet analytics" });
  }
});

module.exports = router;
