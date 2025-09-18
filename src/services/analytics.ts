// File: src/services/analytics.ts

const { getHeliusAssets, getHeliusTransactions } = require("./helius");
import { analyzeConcentrationRisk } from "./risk";
import { analyzeSolStaking } from "./staking";
import { classifyUserBehavior } from "./behavior";

export async function getWalletAnalytics(
    walletAddress: string
) {
    try {
        const [holdings, transactions] = await Promise.all([
            getHeliusAssets(walletAddress),
            getHeliusTransactions(walletAddress),
        ]);

        if (!holdings) {
            console.error("Failed to get assets from Helius.");
            return null;
        }
        
        // Calculate and add the USD value to each asset
        const holdingsWithValues = holdings.map((asset: { balance: number; price?: number; [key: string]: any }) => ({
            ...asset,
            valueUSD: asset.balance * (asset.price || 0)
        }));

        const totalPortfolioValueUSD = holdingsWithValues.reduce((sum: number, asset: any) => {
            return sum + (asset.valueUSD || 0);
        }, 0);
        
        const solHolding = holdingsWithValues.find((h: { symbol: string; [key: string]: any }) => h.symbol === 'SOL');
        const solStakingAnalysis = await analyzeSolStaking(solHolding?.balance || 0);
        const userBehavior = classifyUserBehavior(transactions);

        return {
            wallet: walletAddress,
            balances: holdingsWithValues, // Use the new array with USD values
            transactions,
            totalPortfolioValueUSD,
            concentrationRisk: analyzeConcentrationRisk(holdingsWithValues, totalPortfolioValueUSD),
            solStakingAnalysis, 
            userBehavior,
        };

    } catch (err) {
        console.error("Error in getWalletAnalytics:", err);
        throw err;
    }
}