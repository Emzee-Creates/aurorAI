// File: src/services/jupiter.ts

import type { AxiosInstance, AxiosResponse } from "axios";
const axios = require("axios");
const { config } = require("../lib/config");
const { logger } = require("../lib/logger");
import type { QuoteResponse, SwapTransactionResponse } from "../types/jupiter";

// --------------------
// Axios clients
// --------------------
const priceClient: AxiosInstance = axios.create({
  baseURL: config.jupiter.priceBase.replace(/\/$/, ""),
  timeout: 12_000,
});

const quoteClient: AxiosInstance = axios.create({
  baseURL: config.jupiter.quoteBase.replace(/\/$/, ""),
  timeout: 12_000,
});

// --------------------
// Types
// --------------------
interface PriceResponse {
  data: {
    [mint: string]: {
      id: string;
      price: number;
      [key: string]: unknown;
    };
  };
}

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string; // Corrected: amount must be a string for Jupiter API
  slippageBps?: number;
}

// Corrected type for swap transaction parameters
interface SwapTransactionParams {
  route: QuoteResponse;
  userPublicKey: string;
  wrapUnwrapSOL?: boolean;
}

async function getPriceByMint(mint: string): Promise<PriceResponse> {
  const url = `/price?ids=${encodeURIComponent(mint)}`;
  logger.debug("Fetching price:", priceClient.defaults.baseURL + url);
  const { data }: AxiosResponse<PriceResponse> = await priceClient.get(url);
  return data;
}

async function getRouteQuote(params: QuoteParams): Promise<QuoteResponse> {
  const { inputMint, outputMint, amount, slippageBps = 50 } = params;
  const { data }: AxiosResponse<QuoteResponse> = await quoteClient.get(
    "/quote",
    {
      params: {
        inputMint,
        outputMint,
        amount,
        slippageBps,
        onlyDirectRoutes: false,
      },
    }
  );

  console.log("Jupiter quote response:", data);
  logger.debug({ routeSummary: data?.routePlan?.length }, "Jupiter quote fetched");
  return data;
}

async function getSwapTransaction(params: SwapTransactionParams): Promise<SwapTransactionResponse> {
  if (!config.jupiter.swapBase) {
    throw new Error("JUPITER_SWAP_BASE not configured");
  }

  // Corrected: send the route and userPublicKey in the request body
  const { data }: AxiosResponse<SwapTransactionResponse> = await axios.post(
    config.jupiter.swapBase + "/swap",
    {
      quoteResponse: params.route, // The API requires this key
      userPublicKey: params.userPublicKey,
      wrapUnwrapSOL: params.wrapUnwrapSOL,
      // These parameters have been added to implement the referral fee.
      feeBps: 100, // 100 bps = 1% fee
      referralAccount: 'CGAqjuGfAsNu1acfbVNkmivwJhbumWQ8iKZhs5VFTwW'
    },
    { timeout: 20_000 }
  );

  return data;
}

const SYMBOL_TO_MINT: { [symbol: string]: string } = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  WSOL: "So11111111111111111111111111111111111111112",
  SRM: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  LARIX: "LARiXr4odFEbS6wX6o5nM7Zc5vsb8V1dfyV3LGkJff9",
};

function resolveMint(symbolOrMint: string): string {
  return SYMBOL_TO_MINT[symbolOrMint] || symbolOrMint;
}

module.exports = {
  getPriceByMint,
  getRouteQuote,
  getSwapTransaction,
  SYMBOL_TO_MINT,
  resolveMint,
};