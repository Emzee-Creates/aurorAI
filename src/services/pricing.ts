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

// Function to get SOL price specifically from Birdeye
async function getBirdeyePrice(tokenAddress: string) {
    try {
        const url = `${BIRDEYE_API_URL}?address=${tokenAddress}`;
        const response = await axios.get(url, {
            headers: {
                'accept': 'application/json',
                'X-API-KEY': BIRDEYE_API_KEY
            }
        });

        if (response.data && response.data.data && response.data.data.value) {
            return {
                price: response.data.data.value,
                candlesticks: [] // Birdeye has separate historical data endpoints, not included in this simple price call
            };
        }
    } catch (err) {
        console.error(`Error fetching from Birdeye for ${tokenAddress}:`, err);
    }
    return { price: null, candlesticks: [] };
}

// Existing CoinGecko function (remains the same)
async function getCoinGeckoInfo(coinId: string, daysCandlestick: number = 7) {
    try {
        const [priceResponse, candlestickResponse] = await Promise.all([
            axios.get(`${COINGECKO_API_URL}/simple/price?ids=${coinId}&vs_currencies=usd`),
            axios.get(`${COINGECKO_API_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${daysCandlestick}`)
        ]);

        const price = priceResponse.data[coinId]?.usd || null;
        const candlesticks = candlestickResponse.data || [];

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

// Existing Dexscreener function (remains the same)
async function getDexscreenerPrice(mintAddress: string) {
    try {
        const { data } = await axios.get(`${DEXSCREENER_API_URL}/${mintAddress}`);

        if (data?.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            return {
                price: parseFloat(pair.priceUsd),
                candlesticks: [],
            };
        }
    } catch (err) {
        console.error(`Error fetching from Dexscreener for ${mintAddress}:`, err);
    }
    return { price: null, candlesticks: [] };
}

async function getTokenInfo(mintAddress: string, symbol: string) {
    const cacheKey = mintAddress;
    const cachedData = priceCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_LIFETIME) {
        return cachedData.data;
    }
    
    let price = null;
    let candlesticks = [];

    // Use Birdeye strictly for Solana price
    if (mintAddress === SOLANA_MINT_ADDRESS || symbol.toUpperCase() === "SOL") {
        const birdeyeData = await getBirdeyePrice(SOLANA_MINT_ADDRESS);
        price = birdeyeData.price;
        candlesticks = birdeyeData.candlesticks;
    } 
    // For all other tokens, fall back to CoinGecko and Dexscreener
    else {
        const cgData = await getCoinGeckoInfo(mintAddress);
        price = cgData.price;
        candlesticks = cgData.candlesticks;

        if (price === null) {
            const dsData = await getDexscreenerPrice(mintAddress);
            price = dsData.price;
        }
    }

    const result = { price, candlesticks };
    priceCache.set(cacheKey, { timestamp: Date.now(), data: result });
    
    return result;
}

module.exports = { getTokenInfo };