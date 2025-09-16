// --- File: src/testMoralis.js ---
const {
  getTokenPrice,
  getTokenMetadata,
  getMultiTokenPrices,
} = require('./services/moralis.ts');

const SOLANA_ADDRESS = "So11111111111111111111111111111111111111112";
const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const RAYDIUM_TOKEN_ADDRESS = "4k3Dyjzvzp8eMUKun3hB87T5gGfC71g5dLqEqX1JbPTg";

async function main() {
  console.log("🔹 Fetching a single token's price (SOL)...");
  try {
    const solPrice = await getTokenPrice(SOLANA_ADDRESS);
    if (solPrice) {
      console.log(`✅ SOL Price: $${solPrice.priceInUsd}`);
    } else {
      console.log("❌ Failed to fetch SOL price.");
    }
  } catch (error) {
    console.error("An unexpected error occurred:", error.message);
  }

  console.log("\n🔹 Fetching a single token's metadata (USDC)...");
  try {
    const usdcMetadata = await getTokenMetadata(USDC_ADDRESS);
    if (usdcMetadata) {
      console.log(`✅ USDC Metadata: Name: "${usdcMetadata.name}", Symbol: "${usdcMetadata.symbol}", : Decimals: ${usdcMetadata.decimals}, Logo: ${usdcMetadata.logo}`);
    } else {
      console.log("❌ Failed to fetch USDC metadata.");
    }
  } catch (error) {
    console.error("An unexpected error occurred:", error.message);
  }

  console.log("\n🔹 Fetching multiple token prices...");
  try {
    const addressesToFetch = [
      SOLANA_ADDRESS,
      USDC_ADDRESS,
      RAYDIUM_TOKEN_ADDRESS,
      "invalid-address",
    ];

    const prices = await getMultiTokenPrices(addressesToFetch);

    console.log("✅ Multi-token prices fetched:");
    prices.forEach(item => {
      console.log(`- Mint Address: ${item.mint}, Price: $${item.priceInUsd}`);
    });
    
    // Check if the list is empty, which could indicate a total failure
    if (prices.length === 0) {
      console.log("❌ No prices were returned. Check your addresses and API key.");
    }

  } catch (error) {
    console.error("An unexpected error occurred while fetching multi-prices:", error.message);
  }
}

main();