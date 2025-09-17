// --- File: src/services/analytics.ts ---

import { Connection, PublicKey } from "@solana/web3.js";
const { getAssetsByOwner, getClassifiedTransactions, getHeliusRpcUrl } = require("./helius");
import { analyzeConcentrationRisk } from "./risk";
const { getTokenInfo } = require("./pricing");

const connection = new Connection(getHeliusRpcUrl());
const LAMPORTS_PER_SOL = 1_000_000_000;
const toSol = (lamports: number) => lamports / LAMPORTS_PER_SOL;


async function getWalletAnalytics(
    walletAddress: string,
    daysCandlestick: number = 7
) {
    try {
        // Step 1: Fetch assets and SOL balance in parallel for robustness
        const [assets, solBalanceLamports, transactions] = await Promise.all([
            getAssetsByOwner(walletAddress),
            connection.getBalance(new PublicKey(walletAddress)),
            getClassifiedTransactions(walletAddress, 20),
        ]);

        if (!assets) {
            console.error("Failed to get assets from Helius.");
            return null;
        }

        const enrichedAssets = await Promise.all(assets.map(async (asset: any) => {
            const amount = asset.token_info?.balance / Math.pow(10, asset.token_info?.decimals || 0);
            const symbol = asset.content?.metadata?.symbol || null;
            const name = asset.content?.metadata?.name || null;
            
            // Fetch price data only if we have a symbol and a non-zero amount
            let price = null;
            let candlesticks = [];
            if (symbol && amount > 0) {
                const tokenPricing = await getTokenInfo(asset.id, symbol);
                price = tokenPricing.price;
                candlesticks = tokenPricing.candlesticks;
            }

            const valueUSD = price !== null ? amount * price : null;

            return {
                mint: asset.id,
                name,
                symbol,
                amount,
                price,
                valueUSD,
                candlesticks,
            };
        }));
        
        // Step 2: Create a dedicated object for the native SOL balance
        const solPriceInfo = await getTokenInfo("11111111111111111111111111111111", "SOL");
        const solAmount = toSol(solBalanceLamports);
        const solValueUSD = solPriceInfo.price !== null ? solAmount * solPriceInfo.price : null;
        
        const solAsset = {
            mint: "11111111111111111111111111111111",
            name: "Solana",
            symbol: "SOL",
            amount: solAmount,
            price: solPriceInfo.price,
            valueUSD: solValueUSD,
            candlesticks: solPriceInfo.candlesticks
        };
        
        // Step 3: Combine all assets, including SOL, and filter out zero balances
        const allAssets = [solAsset, ...enrichedAssets];
        const cleanAssets = allAssets.filter((asset: any) => asset.amount > 0);

        const totalPortfolioValueUSD = cleanAssets.reduce((sum: number, asset: any) => {
            return sum + (asset.valueUSD || 0);
        }, 0);
        
        const concentrationRisk = analyzeConcentrationRisk(cleanAssets, totalPortfolioValueUSD);

        return {
            wallet: walletAddress,
            balances: cleanAssets,
            transactions,
            totalPortfolioValueUSD,
            concentrationRisk,
        };
    } catch (err) {
        console.error("Error in getWalletAnalytics:", err);
        throw err;
    }
}

module.exports = { getWalletAnalytics };