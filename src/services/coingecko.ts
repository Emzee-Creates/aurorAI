import { Request, Response } from 'express';
import axios from 'axios';

/**
 * Fetches OHLC (Open, High, Low, Close) data for a single cryptocurrency from CoinGecko.
 * @param coinId The ID of the cryptocurrency (e.g., 'solana', 'usd-coin').
 * @param days The number of days of data to retrieve.
 * @returns A promise that resolves to a 2D array of OHLC data, or null on error.
 */
export async function getCoinGeckoOHLC(
    coinId: string,
    days: number = 7
): Promise<number[][] | null> {
    try {
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
        const response = await axios.get(url);

        if (response.status !== 200) {
            console.error(`Error fetching data from CoinGecko: Status code ${response.status}`);
            return null;
        }

        // CoinGecko's OHLC data is an array of arrays, e.g., [[timestamp, open, high, low, close], ...]
        // The timestamp is in Unix milliseconds.
        const ohlcData: number[][] = response.data;

        return ohlcData;

    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error(`Axios error fetching CoinGecko data for ${coinId}: ${error.message}`);
            if (error.response) {
                console.error(`Response status: ${error.response.status}`);
                console.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
        } else {
            console.error(`Unknown error fetching CoinGecko data for ${coinId}:`, error);
        }
        return null;
    }
}

/**
 * Fetches OHLC data for multiple cryptocurrencies concurrently.
 * @param coinIds An array of cryptocurrency IDs.
 * @param days The number of days of data to retrieve for each coin.
 * @returns A promise that resolves to an object with coin IDs as keys and their OHLC data as values.
 */
export async function getCoinGeckoOHLCForCoins(
    coinIds: string[],
    days: number = 7
): Promise<Record<string, number[][] | null>> {
    // Create a promise for each coin to fetch its OHLC data
    const promises = coinIds.map(coinId => getCoinGeckoOHLC(coinId, days));

    // Use Promise.all to run all fetch requests concurrently
    const results = await Promise.all(promises);

    // Map the results back to an object for easier access
    const data: Record<string, number[][] | null> = {};
    coinIds.forEach((coinId, index) => {
        data[coinId] = results[index] ?? null;
    });

    return data;
}

// Example usage of the new function
async function testFetch() {
    const coins = ['solana', 'usd-coin'];
    console.log(`Fetching OHLC data for ${coins.join(' and ')}...`);
    const data = await getCoinGeckoOHLCForCoins(coins, 7);
    console.log('Received data:', Object.keys(data).map(key => `${key} has data: ${data[key] !== null}`));
}

// To run the test, uncomment the line below.
 testFetch();
