// --- File: src/services/pricing.ts ---
const axios = require("axios");

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";
const DEXSCREENER_API_URL = "https://api.dexscreener.com/latest/dex/tokens";
const BIRDEYE_API_URL = "https://public-api.birdeye.so/defi/price";

// IMPORTANT: Replace this with your actual Birdeye API Key
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
if (!BIRDEYE_API_KEY) {
    throw new Error("BIRDEYE_API_KEY not configured in environment variables.");
}

// Solana's official mint address
const SOLANA_MINT_ADDRESS = "So11111111111111111111111111111111111111112";

// Cache to store prices and avoid hitting rate limits
const priceCache = new Map();
const CACHE_LIFETIME = 60 * 1000; // 60 seconds

/**
 * Fetches historical price data and candlesticks for a specific CoinGecko coin ID.
 * @param {string} coinId The CoinGecko coin ID (e.g., "solana").
 * @param {number} daysCandlestick The number of days of historical data to fetch.
 * @returns {Promise<object>} An object with the current price and historical candlesticks.
 */
export async function getCoinGeckoInfo(coinId: string, daysCandlestick: number = 7) {
    try {
        const ohlcResponse = await axios.get(
            `${COINGECKO_API_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${daysCandlestick}`
        );
        const candlesticks = ohlcResponse.data || [];

        const priceResponse = await axios.get(
            `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`
        );
        const price = priceResponse.data[coinId]?.usd || null;

        const formattedCandlesticks = candlesticks.map((candle: any[]) => ({
            timestamp: candle[0],
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4],
        }));

        return { price, candlesticks: formattedCandlesticks };
    } catch (err) {
        console.error(`Error fetching from CoinGecko for ${coinId}:`, err);
        return { price: null, candlesticks: [] };
    }
}

/**
 * The main function to get a token's real-time price.
 * @param {string} mintAddress The token's Solana mint address.
 * @param {string} symbol The token symbol.
 * @returns {Promise<object>} Token info with price.
 */
export async function getTokenInfo(mintAddress: string, symbol: string) {
    const cacheKey = mintAddress;
    const cachedData = priceCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_LIFETIME) {
        return cachedData.data;
    }
    
    let price = null;

    if (mintAddress === SOLANA_MINT_ADDRESS || symbol.toUpperCase() === "SOL") {
        try {
            const response = await axios.get(`${COINGECKO_API_URL}/simple/price?ids=solana&vs_currencies=usd`);
            price = response.data.solana?.usd || null;
        } catch (err) {
            console.error("Error fetching SOL price from CoinGecko:", err);
        }
    } 
    else {
        let fallback = false;
        try {
            const url = `${BIRDEYE_API_URL}?address=${mintAddress}`;
            const response = await axios.get(url, {
                headers: {
                    'accept': 'application/json',
                    'X-API-KEY': BIRDEYE_API_KEY
                }
            });
            if (response.data?.data?.value) {
                price = response.data.data.value;
            } else {
                fallback = true;
            }
        } catch (err) {
            console.warn(`Birdeye failed for ${mintAddress}. Falling back to Dexscreener.`);
            fallback = true;
        }

        if (price === null || fallback) {
            try {
                const { data } = await axios.get(`${DEXSCREENER_API_URL}/${mintAddress}`);
                if (data?.pairs && data.pairs.length > 0) {
                    price = parseFloat(data.pairs[0].priceUsd);
                }
            } catch (err) {
                console.error(`Dexscreener also failed for ${mintAddress}.`, err);
            }
        }
    }

    const result = { price };
    priceCache.set(cacheKey, { timestamp: Date.now(), data: result });
    
    return result;
}

/**
 * Fetches the current mSOL staking APY from the Marinade Finance API.
 * This is a good proxy for the general SOL staking APY.
 * @returns {Promise<number>} The current APY as a decimal (e.g., 0.075 for 7.5%).
 */
export async function getMarinadeApy() {
    // A reliable default APY in case the API call fails
    const DEFAULT_APY = 0.075; 
    try {
        const response = await axios.get("https://api.marinade.finance/msol/apy/30d");
        
        // --- Add a check to ensure the response is valid and has the 'apy' field ---
        const apy = response.data?.apy || response.data?.value || response.data?.apy_5_epochs;
        if (response.status === 200 && response.data?.value) {
            // Ensure the value is a number
            const parsedApy = parseFloat(apy);
            if (!isNaN(parsedApy)) {
                return parsedApy;
            }
        }

        // Fallback to the default APY if the response is not as expected
        console.warn("Marinade APY API returned an unexpected response. Using default APY.");
        return DEFAULT_APY;
    } catch (error) {
        console.error("Error fetching Marinade APY:", error);
        return DEFAULT_APY; // Return a default value in case of network or other failure
    }
}