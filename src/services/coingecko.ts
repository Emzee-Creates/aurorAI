// --- File: src/services/coingecko.ts ---

import axios from "axios";

// Simply change 'async function' to 'export async function'
export async function getTokenCandlesticks(
    id: string,
    vsCurrency: string = "usd",
    days: number = 1
): Promise<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}[]> {
    try {
        const url = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=${vsCurrency}&days=${days}`;
        const { data } = await axios.get(url);

        return data.map((d: [number, number, number, number, number]) => ({
            time: d[0],
            open: d[1],
            high: d[2],
            low: d[3],
            close: d[4],
        }));
    } catch (err: any) {
        console.error(`CoinGecko OHLCV fetch error for ${id}:`, err.message);
        return [];
    }
}
// Remove the 'module.exports' line entirely
// module.exports = { getTokenCandlesticks };