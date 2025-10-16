import express from "express";
import cors from "cors";
const { config } = require("./lib/config");
const { logger } = require("./lib/logger");
import { getRecommendations } from "./services/recommendation";

const health = require("./routes/health");
const market = require("./routes/market");
const risk = require("./routes/risk");
const wallet = require("./routes/wallet");
const analyticRoutes = require("./routes/analytics");
import yieldOptimizerRouter from "./routes/yieldOptimizer";
import backtestRouter from "./routes/backtest";
import optimizerRouter from "./routes/optimizer";

const app = express();

// ✅ Robust CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://aurorai.vercel.app",
  "https://aurorai.onrender.com",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

// ✅ Test endpoint
app.get("/", (_req, res) => {
  res.send("AuroraAI API is running 🚀");
});

app.get("/api/recommendations", async (req, res) => {
  try {
    const walletAddress = req.query.wallet as string;
    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required." });
    }

    const mockHoldings = [
      { symbol: "SOL", balance: 5, price: 150 },
      { symbol: "USDC", balance: 500, price: 1 },
      { symbol: "BONK", balance: 100000, price: 0.00001 },
      { symbol: "LARIX", balance: 5000, price: 0.2 },
    ];
    const mockTransactions: any = [];

    const recommendations = await getRecommendations(walletAddress);
    res.json({ recommendations });
  } catch (error) {
    logger.error({ error }, "Error getting recommendations");
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ API routes
app.use("/health", health);
app.use("/market", market);
app.use("/risk", risk);
app.use("/wallet", wallet);
app.use("/analytics", analyticRoutes);
app.use("/api/optimize-yield", yieldOptimizerRouter);
app.use("/api/backtest", backtestRouter);
app.use("/api/optimizer", optimizerRouter);

// ✅ Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

app.listen(config.port, () => {
  logger.info(`API listening on :${config.port} (${config.env})`);
});
