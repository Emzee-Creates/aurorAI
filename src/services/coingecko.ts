import { Request, Response } from 'express';
import axios from 'axios';

// Function to fetch OHLC (Open, High, Low, Close) data from CoinGecko
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

        // The data is returned as an array of arrays, so we can return it directly.
        return ohlcData;

    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error(`Axios error fetching CoinGecko data: ${error.message}`);
            if (error.response) {
                console.error(`Response status: ${error.response.status}`);
                console.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
        } else {
            console.error("Unknown error fetching CoinGecko data:", error);
        }
        return null;
    }
}
