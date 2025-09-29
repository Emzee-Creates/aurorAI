require("dotenv/config");

const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  env: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",

  jupiter: {
    priceBase: process.env.JUPITER_PRICE_BASE,
    quoteBase: process.env.JUPITER_QUOTE_BASE,
    swapBase: process.env.JUPITER_SWAP_BASE,
  },

  helius: {
    rpc: process.env.HELIUS_RPC,
    apiKey: process.env.HELIUS_API_KEY
  }
};

module.exports = { config };
