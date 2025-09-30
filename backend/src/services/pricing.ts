// --- File: src/services/pricing.ts ---
const axios = require("axios");

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";
const DEXSCREENER_API_URL = "https://api.dexscreener.com/latest/dex/tokens";
const BIRDEYE_API_URL = "https://public-api.birdeye.so/defi/price";

// IMPORTANT: Replace this with your actual Birdeye API Key
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
if (!BIRDEYE_API_KEY) {
    // Note: In a real environment, you might just warn and return null for Birdeye calls, 
    // but throwing here respects the original code's requirement.
    throw new Error("BIRDEYE_API_KEY not configured in environment variables.");
}

// Solana's official mint address
const SOLANA_MINT_ADDRESS = "So11111111111111111111111111111111111111112";

// Cache to store prices and avoid hitting rate limits (In-Memory Cache)
const priceCache = new Map();
const CACHE_LIFETIME = 60 * 1000; // 60 seconds TTL for spot prices

/**
 * Helper function to fetch a single coin's current USD price from CoinGecko, 
 * using the shared in-memory cache. This addresses the 429 errors for spot price checks.
 */
async function fetchCoinGeckoSpotPrice(coinId: string): Promise<number | null> {
    const cacheKey = `spot_price_${coinId}`;
    const cachedData = priceCache.get(cacheKey);

    // CACHE HIT CHECK
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_LIFETIME) {
        // console.log(`[Cache Hit] CoinGecko Spot Price for ${coinId}`); // Optional: reduce log spam
        return cachedData.data.price;
    }

    // API CALL
    try {
        const response = await axios.get(
            `${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`
        );
        const price = response.data[coinId]?.usd || null;

        // CACHE SET (Only on successful price retrieval)
        if (price !== null) {
            priceCache.set(cacheKey, { timestamp: Date.now(), data: { price } });
        }
        return price;
    } catch (err: any) {
        // ERROR HANDLING
        if (axios.isAxiosError(err) && err.response?.status === 429) {
            // Specific handling for rate limit
            console.error(`[Rate Limit] CoinGecko Spot Price for ${coinId} hit 429. Returning null.`);
        } else {
            console.error(`Error fetching CoinGecko Spot Price for ${coinId}:`, err.message);
        }
        return null;
    }
}


/**
 * Fetches historical price data and candlesticks for a specific CoinGecko coin ID.
 * It uses the cached spot price helper and makes a separate OHLC call.
 * * NOTE: The OHLC data call still needs external (file-based) caching 
 * provided by the getCoinGeckoOHLCForCoins function you previously updated.
 * * @param {string} coinId The CoinGecko coin ID (e.g., "solana").
 * @param {number} daysCandlestick The number of days of historical data to fetch.
 * @returns {Promise<object>} An object with the current price and historical candlesticks.
 */
export async function getCoinGeckoInfo(coinId: string, daysCandlestick: number = 7) {
    // 1. Fetch current price using the CACHED helper function
    const price = await fetchCoinGeckoSpotPrice(coinId);

    // 2. Fetch OHLC data (this is the expensive, less frequent call)
    let candlesticks = [];
    try {
        const ohlcResponse = await axios.get(
            `${COINGECKO_API_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${daysCandlestick}`
        );
        candlesticks = ohlcResponse.data || [];
    } catch (err: any) {
         // Log the OHLC error separately
         console.error(`Error fetching OHLC from CoinGecko for ${coinId}:`, err.message);
    }
    
    // 3. Format the data
    const formattedCandlesticks = candlesticks.map((candle: any[]) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
    }));

    return { price, candlesticks: formattedCandlesticks };
}

/**
 * The main function to get a token's real-time price.
 * This is primarily responsible for the price of assets in a wallet.
 * * @param {string} mintAddress The token's Solana mint address.
 * @param {string} symbol The token symbol.
 * @returns {Promise<object>} Token info with price.
 */
export async function getTokenInfo(mintAddress: string, symbol: string) {
    const cacheKey = mintAddress;
    const cachedData = priceCache.get(cacheKey);

    // CACHE HIT CHECK (Uses the token's mint address/key for its price)
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_LIFETIME) {
        // console.log(`[Cache Hit] Token Price for ${symbol}`); // Optional: reduce log spam
        return cachedData.data;
    }
    
    let price = null;

    if (mintAddress === SOLANA_MINT_ADDRESS || symbol.toUpperCase() === "SOL") {
        // Use the CACHED helper function for SOL price
        price = await fetchCoinGeckoSpotPrice('solana');
    } 
    else {
        let fallback = false;
        // 1. Try Birdeye (Primary source)
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

        // 2. Fallback to Dexscreener
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
    // CACHE SET (Only cache non-null prices)
    if (price !== null) {
        priceCache.set(cacheKey, { timestamp: Date.now(), data: result });
    }
    
    return result;
}

/**
 * Fetches the current mSOL staking APY from the Marinade Finance API.
 * This is a good proxy for the general SOL staking APY.
 * @returns {Promise<number>} The current APY as a decimal (e.g., 0.075 for 7.5%).
 */
export async function getMarinadeApy(): Promise<number> {
    // A reliable default APY in case the API call fails or returns an unparsable value
    const DEFAULT_APY = 0.075; 
    
    // API endpoint for 30-day average APY
    const API_ENDPOINT = "https://api.marinade.finance/msol/apy/30d";

    try {
        const response = await axios.get(API_ENDPOINT);
        const rawApyData = response.data; 

        const parsedApy = parseFloat(rawApyData);

        if (!isNaN(parsedApy) && parsedApy > 0.01 && parsedApy < 0.3) {
            return parsedApy;
        }

        // Fallback if the value is 0 or outside the expected range
        console.warn(`Marinade APY API returned an unexpected value (${rawApyData}). Using default APY.`);
        return DEFAULT_APY;
        
    } catch (error) {
        // Return a default value in case of network or other failure
        console.error("Error fetching Marinade APY (Network/API failure). Returning default APY:", error);
        return DEFAULT_APY; 
    }
}