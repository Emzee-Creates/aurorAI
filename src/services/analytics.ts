// --- File: src/services/analytics.ts ---

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
// Use the new, more efficient Helius functions
const { getAssetsByOwner, getClassifiedTransactions, getHeliusRpcUrl } =  require("./helius");
import { getTokenCandlesticks } from "./coingecko";

// Use the Helius RPC endpoint
const connection = new Connection(getHeliusRpcUrl());

// This function is no longer needed since we get SOL balance from Helius assets.
// We can remove it to avoid confusion and potential issues.
// async function getSolBalance(walletAddress: string) {
//     const pubkey = new PublicKey(walletAddress);
//     const lamports = await connection.getBalance(pubkey);
//     return lamports / LAMPORTS_PER_SOL;
// }

async function getWalletAnalytics(
    walletAddress: string,
    daysCandlestick: number = 7
) {
    try {
        // 1. Fetch core data streams in parallel. We now rely solely on Helius's DAS API
        // for both tokens and native SOL. We no longer need to call getSolBalance().
        const [assets, transactions] = await Promise.all([
            getAssetsByOwner(walletAddress),
            getClassifiedTransactions(walletAddress, 20),
        ]);

        if (!assets) {
            console.error("Failed to get assets from Helius.");
            return null;
        }

        // 2. Combine and enrich assets with candlestick data
        // We will process all assets here, including the native SOL asset from Helius.
        const enrichedAssets = await Promise.all(assets.map(async (asset: any) => {
            const coinId = asset.content?.metadata?.symbol?.toLowerCase();
            let candlesticks: any = [];

            // Fetch candlestick data for each asset if a CoinGecko ID can be found
            if (coinId) {
                try {
                    candlesticks = await getTokenCandlesticks(coinId, "usd", daysCandlestick);
                } catch (err) {
                    // Log a warning if a specific token's candlestick data fails to fetch
                    console.warn(`Failed to get candlesticks for ${coinId}:`, err);
                }
            }

            // Calculate valueUSD and other metrics
            const amount = asset.token_info?.balance / Math.pow(10, asset.token_info?.decimals || 0);
            const price = asset.token_info?.price_info?.price_per_token || null;
            const valueUSD = price !== null ? amount * price : null;

            return {
                mint: asset.id,
                name: asset.content?.metadata?.name || null,
                symbol: asset.content?.metadata?.symbol || null,
                amount,
                price,
                valueUSD,
                candlesticks,
            };
        }));
        
        // 3. (REMOVED) We are no longer adding native SOL separately, as it's already included
        // in the 'assets' array fetched from Helius. This resolves the duplicate entry.
        
        // 4. Calculate total portfolio value
        const totalPortfolioValueUSD = enrichedAssets.reduce((sum: number, asset: any) => {
            return sum + (asset.valueUSD || 0);
        }, 0);

        return {
            wallet: walletAddress,
            balances: enrichedAssets,
            transactions,
            totalPortfolioValueUSD,
        };
    } catch (err) {
        console.error("Error in getWalletAnalytics:", err);
        throw err;
    }
}

module.exports = { getWalletAnalytics };