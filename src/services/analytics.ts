// --- File: src/services/analytics.ts ---

import { Connection, PublicKey } from "@solana/web3.js";
const { getAssetsByOwner, getClassifiedTransactions, getHeliusRpcUrl } = require("./helius");
import { analyzeConcentrationRisk } from "./risk";
const { getTokenInfo } = require("./pricing");
// Import the new staking analysis function
import { analyzeSolStaking } from "./staking";
import { classifyUserBehavior } from "./behavior";

const connection = new Connection(getHeliusRpcUrl());
const LAMPORTS_PER_SOL = 1_000_000_000;
const toSol = (lamports: number) => lamports / LAMPORTS_PER_SOL;

export async function getWalletAnalytics(
    walletAddress: string
) {
    try {
        // Step 1: Fetch assets and SOL balance in parallel
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
            
            let price = null;
            // Fetch price data only if we have a symbol and a non-zero amount
            if (symbol && amount > 0) {
                // We no longer need to check for 'candlesticks' here as getTokenInfo no longer returns it for all tokens
                const tokenPricing = await getTokenInfo(asset.id, symbol);
                price = tokenPricing.price;
            }

            const valueUSD = price !== null ? amount * price : null;

            return {
                mint: asset.id,
                name,
                symbol,
                amount,
                price,
                valueUSD,
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
        };
        
        // Step 3: Combine all assets, including SOL, and filter out zero balances
        const allAssets = [solAsset, ...enrichedAssets];
        const cleanAssets = allAssets.filter((asset: any) => asset.amount > 0);

        const totalPortfolioValueUSD = cleanAssets.reduce((sum: number, asset: any) => {
            return sum + (asset.valueUSD || 0);
        }, 0);
        
        // Step 4: Run the analysis functions
        const concentrationRisk = analyzeConcentrationRisk(cleanAssets, totalPortfolioValueUSD);
        const solStakingAnalysis = await analyzeSolStaking(solAmount); // Analyze staking based on the SOL amount
        const userBehavior = classifyUserBehavior(transactions);
        // Step 5: Return the combined data
        return {
            wallet: walletAddress,
            balances: cleanAssets,
            transactions,
            totalPortfolioValueUSD,
            concentrationRisk,
            solStakingAnalysis, 
            userBehavior,
        };

    } catch (err) {
        console.error("Error in getWalletAnalytics:", err);
        throw err;
    }
}

module.exports = { getWalletAnalytics };