import { Request, Response } from 'express';
import { getHeliusAssets, getHeliusTransactions } from './helius';
import { analyzeConcentrationRisk } from './risk';
import { analyzeSolStaking } from './staking';
import { classifyUserBehavior } from './behavior';
// This import is correct and uses the cached function name:
import { getCoinGeckoOHLCForCoins } from './coingecko';

// The type for a single asset holding, ensuring the symbol property is always present
interface Holding {
    symbol: string;
    balance: number;
    price?: number;
    [key: string]: any;
}

export interface WalletAnalytics {
    wallet: string;
    // Update the balances type to use the new Holding interface
    balances: Array<Holding & { valueUSD: number }>;
    transactions: any[];
    totalPortfolioValueUSD: number;
    concentrationRisk: ReturnType<typeof analyzeConcentrationRisk>;
    solStakingAnalysis: ReturnType<typeof analyzeSolStaking>;
    userBehavior: ReturnType<typeof classifyUserBehavior>;
    // Update the type to handle multiple coin data
    candlestickData?: Record<string, number[][] | null> | null;
}

export async function getWalletAnalytics(
    walletAddress: string
): Promise<WalletAnalytics | null> {
    try {
        // 1. ADDED: Initial validation check for the wallet address
        if (!walletAddress) {
            console.error("Wallet address is missing.");
            return null;
        }

        const [holdings, transactions] = await Promise.all([
            getHeliusAssets(walletAddress),
            getHeliusTransactions(walletAddress),
        ]);

        if (!holdings) {
            console.error("Failed to get assets from Helius.");
            return null;
        }

        // Find the SOL holding on the original array, which has the `symbol` property
        const solHolding = holdings.find((h: Holding) => h.symbol === 'SOL');

        // Calculate and add the USD value to each asset, preserving all original properties
        const holdingsWithValues = holdings.map((asset: Holding) => ({
            ...asset,
            valueUSD: asset.balance * (asset.price || 0)
        }));

        const totalPortfolioValueUSD = holdingsWithValues.reduce((sum: number, asset: any) => {
            return sum + (asset.valueUSD || 0);
        }, 0);

        const solStakingAnalysis = analyzeSolStaking(solHolding?.balance || 0);
        const userBehavior = classifyUserBehavior(transactions);

        // Define the coins you want to fetch candlestick data for
        const coinsToFetch = ['solana', 'usd-coin'];

        // LINE 60 CORRECTION CHECK: This line now definitively uses the correct, cached function name
        const candlestickData = await getCoinGeckoOHLCForCoins(coinsToFetch, 30);


        return {
            wallet: walletAddress,
            balances: holdingsWithValues,
            transactions,
            totalPortfolioValueUSD,
            concentrationRisk: analyzeConcentrationRisk(holdingsWithValues, totalPortfolioValueUSD),
            solStakingAnalysis,
            userBehavior,
            candlestickData,
        };

    } catch (err) {
        // Ensure errors are logged before being re-thrown (if needed) or returning null
        console.error("Error in getWalletAnalytics:", err);
        // It's often better to return null in an async handler than to re-throw and crash the request listener
        return null;
    }
}