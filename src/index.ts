const express = require("express");
const cors = require("cors");
const  { config }  = require("./lib/config");
const  { logger } = require("./lib/logger");

const  health  = require("./routes/health");
const  market  = require("./routes/market");
const  risk  = require("./routes/risk");
const  wallet  = require("./routes/wallet");
const analyticRoutes = require("./routes/analytics");

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));


app.use("/health", health);
app.use("/market", market);
app.use("/risk", risk);
app.use("/wallet", wallet);
app.use("/analytics", analyticRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

app.listen(config.port, () => {
  logger.info(`API listening on :${config.port} (${config.env})`);
});
