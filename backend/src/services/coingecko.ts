import { Request, Response } from 'express';
import axios from 'axios';
import * as fs from 'fs'; 
import * as path from 'path'; 

// --- CACHING CONFIGURATION ---
const CACHE_FILE_PATH = path.join(__dirname, 'coingecko_ohlc_cache.json');
// Set TTL to 24 hours (24 * 60 * 60 * 1000 ms)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; 

interface CacheEntry {
    data: number[][] | null;
    expiry: number; // Unix timestamp for expiry
}

interface CacheContent {
    [key: string]: CacheEntry;
}


/**
 * Reads the entire cache file.
 * @returns The cache content object or an empty object if the file is missing/invalid.
 */
function readCache(): CacheContent {
    if (!fs.existsSync(CACHE_FILE_PATH)) {
        return {};
    }
    try {
        const fileContent = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (e) {
        console.warn('Could not read or parse cache file. Starting fresh.', e);
        return {};
    }
}

/**
 * Writes the entire cache content to the JSON file.
 * @param cache The updated cache content object.
 */
function writeCache(cache: CacheContent): void {
    try {
        // Use synchronous write for simplicity in a server startup/single-function context
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (e) {
        console.error('Failed to write to cache file:', e);
    }
}


/**
 * Fetches OHLC data for multiple cryptocurrencies, prioritizing the local cache.
 * @param coinIds An array of cryptocurrency IDs.
 * @param days The number of days of data to retrieve for each coin.
 * @returns A promise that resolves to an object with coin IDs as keys and their OHLC data as values.
 */
export async function getCoinGeckoOHLCForCoins(
    coinIds: string[],
    days: number = 7
): Promise<Record<string, number[][] | null>> {
    
    // 1. Load the current cache state
    const cache = readCache();
    const results: Record<string, number[][] | null> = {};
    const coinsToFetch: string[] = [];
    
    // 2. Check cache for each coin
    for (const coinId of coinIds) {
        const cacheKey = `${coinId}_${days}d`;
        const cachedEntry = cache[cacheKey];

        if (cachedEntry && Date.now() < cachedEntry.expiry) {
            console.log(`[Cache Hit] Serving OHLC data for ${coinId} from cache.`);
            results[coinId] = cachedEntry.data;
        } else {
            // Cache miss or expired, needs fetching
            coinsToFetch.push(coinId);
            if (cachedEntry) delete cache[cacheKey]; 
        }
    }

    // 3. Fetch data only for missing/expired coins
    if (coinsToFetch.length > 0) {
        console.log(`[API Call] Fetching data for: ${coinsToFetch.join(', ')}`);
        
        // Helper function to fetch a single coin's data (moved inside to access cache/days)
        const fetchSingleCoinData = async (coinId: string) => {
             try {
                const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
                const response = await axios.get(url);

                if (response.status === 429) {
                    console.error(`[Rate Limit] Hit 429 for ${coinId}. Will use null.`);
                    return null; 
                }
                if (response.status !== 200) {
                    console.error(`Error fetching data from CoinGecko: Status code ${response.status}`);
                    return null;
                }
                return response.data;
            } catch (error: any) {
                 if (axios.isAxiosError(error) && error.response?.status === 429) {
                    // Specific handling for 429 error during concurrent fetch
                    console.error(`[Rate Limit] Hit 429 for ${coinId}. Will use null.`);
                } else if (axios.isAxiosError(error)) {
                    // Other Axios errors
                    console.error(`Axios error fetching CoinGecko data for ${coinId}: ${error.message}`);
                } else {
                    console.error(`Unknown error fetching CoinGecko data for ${coinId}:`, error);
                }
                return null;
            }
        };

        const fetchPromises = coinsToFetch.map(coinId => fetchSingleCoinData(coinId));
        const fetchedResults = await Promise.all(fetchPromises);

        // 4. Process new results and update cache
        coinsToFetch.forEach((coinId, index) => {
            const data = fetchedResults[index];
            results[coinId] = data;
            
            // Only cache successful results
            if (data !== null) {
                const cacheKey = `${coinId}_${days}d`;
                cache[cacheKey] = {
                    data: data,
                    expiry: Date.now() + CACHE_TTL_MS
                };
            }
        });
        
        // 5. Save the updated cache file
        writeCache(cache);
    }
    
    return results;
}


async function testFetch() {
    const coins = ['solana', 'usd-coin']; 
    console.log(`Fetching OHLC data for ${coins.join(' and ')}...`);
    const data = await getCoinGeckoOHLCForCoins(coins, 7); 
    console.log('Received data:', Object.keys(data).map(key => `${key} has data: ${data[key] !== null}`));
}

testFetch();