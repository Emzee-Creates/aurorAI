// --- File: src/services/moralis.ts ---

import Moralis from "moralis";
const dotenv = require("dotenv");

dotenv.config();

const API_KEY = process.env.MORALIS_API_KEY;
if (!API_KEY) {
  throw new Error("MORALIS_API_KEY not configured in environment variables.");
}

async function startMoralis() {
  try {
    await Moralis.start({ apiKey: API_KEY });
    console.log("✅ Moralis SDK initialized.");
  } catch (err) {
    console.error("❌ Failed to initialize Moralis SDK:", err);
    process.exit(1);
  }
}

const moralisInitialization = startMoralis();

/**
 * Get current token price.
 */
async function getTokenPrice(mintAddress: string) {
  await moralisInitialization;
  try {
    const response = await Moralis.SolApi.token.getTokenPrice({
      address: mintAddress,
      network: "mainnet",
    });
    const data = response.toJSON();
    return { mint: mintAddress, priceInUsd: data.usdPrice };
  } catch (err: any) {
    console.error(`Error fetching token price for ${mintAddress}:`, err.message);
    return null;
  }
}

/**
 * Get token metadata.
 */
async function getTokenMetadata(mintAddress: string) {
  await moralisInitialization;
  try {
    const response = await Moralis.SolApi.token.getTokenMetadata({
      address: mintAddress,
      network: "mainnet",
    });
    return response.toJSON();
  } catch (err: any) {
    console.error(`Error fetching metadata for ${mintAddress}:`, err.message);
    return null;
  }
}

/**
 * Get multiple token prices.
 */
async function getMultiTokenPrices(mintAddresses: string[]) {
  await moralisInitialization;
  try {
    const results = await Promise.all(mintAddresses.map((mint) => getTokenPrice(mint)));
    return results.filter((r) => r !== null);
  } catch (err: any) {
    console.error("Error fetching multi-token prices:", err.message);
    return [];
  }
}

// --------------------
// Exports
// --------------------
module.exports = {
  getTokenPrice,
  getTokenMetadata,
  getMultiTokenPrices,
};
