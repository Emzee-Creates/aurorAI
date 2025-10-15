const express = require("express");
const cors = require("cors");
const { config } = require("./lib/config");
const { logger } = require("./lib/logger");
const { getRecommendations } = require("./services/recommendation"); 

const health = require("./routes/health");
const market = require("./routes/market");
const risk = require("./routes/risk");
const wallet = require("./routes/wallet");
const analyticRoutes = require("./routes/analytics");
import yieldOptimizerRouter from "./routes/yieldOptimizer";
import backtestRouter from "./routes/backtest";

const app = express();


const corsOptions = {
    origin: 'http://localhost:5173', // <--- Your frontend's URL
    methods: 'GET,POST,PUT,DELETE',  // Allow common methods for your API
    credentials: true,               // Allow cookies/authorization headers
};
app.use(cors());


app.use(express.json({ limit: "1mb" }));


app.use(express.static("public"));

app.get("/api/recommendations", async (req: any, res: any) => {
  try {
    const walletAddress = req.query.wallet;
    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required." });
    }


    const mockHoldings = [
      { symbol: 'SOL', balance: 5, price: 150 },
      { symbol: 'USDC', balance: 500, price: 1 },
      { symbol: 'BONK', balance: 100000, price: 0.00001 },
      { symbol: 'LARIX', balance: 5000, price: 0.2 },
    ];
    const mockTransactions: any = []; 

    const recommendations = await getRecommendations(walletAddress, mockTransactions, mockHoldings);

    res.json({ recommendations });
  } catch (error) {
    logger.error({ error }, "Error getting recommendations");
    res.status(500).json({ message: "Internal server error" });
  }
});

// Existing routes
app.use("/health", health);
app.use("/market", market);
app.use("/risk", risk);
app.use("/wallet", wallet);
app.use("/analytics", analyticRoutes);
app.use("/api/optimize-yield", yieldOptimizerRouter);
app.use("/api/backtest", backtestRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

app.listen(config.port, () => {
  logger.info(`API listening on :${config.port} (${config.env})`);
});