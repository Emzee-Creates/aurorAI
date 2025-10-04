import { Request, Response } from 'express';
import { getHeliusAssets, getHeliusTransactions } from './helius';
import { analyzeConcentrationRisk } from './risk';
import { analyzeSolStaking } from './staking';
import { classifyUserBehavior } from './behavior';
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
    balances: Array<Holding & { valueUSD: number }>;
    transactions: any[];
    totalPortfolioValueUSD: number;
    concentrationRisk: ReturnType<typeof analyzeConcentrationRisk>;
    solStakingAnalysis: ReturnType<typeof analyzeSolStaking>;
    userBehavior: ReturnType<typeof classifyUserBehavior>;
    candlestickData?: Record<string, number[][] | null> | null;

    // ✅ Added explicit fields for frontend use
    solBalance: number;
    solPriceUSD: number;
}

export async function getWalletAnalytics(
    walletAddress: string
): Promise<WalletAnalytics | null> {
    try {
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

        // Find the SOL holding
        const solHolding = holdings.find((h: Holding) => h.symbol === 'SOL');

        // Calculate USD values for all holdings
        const holdingsWithValues = holdings.map((asset: Holding) => ({
            ...asset,
            valueUSD: asset.balance * (asset.price || 0)
        }));

        const totalPortfolioValueUSD = holdingsWithValues.reduce((sum: number, asset: any) => {
            return sum + (asset.valueUSD || 0);
        }, 0);

        const solBalance = solHolding?.balance || 0;
        const solPriceUSD = solHolding?.price || 0;

        const solStakingAnalysis = analyzeSolStaking(solBalance);
        const userBehavior = classifyUserBehavior(transactions);

        const coinsToFetch = ['solana', 'usd-coin'];
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

            // ✅ Explicitly include for frontend
            solBalance,
            solPriceUSD,
        };

    } catch (err) {
        console.error("Error in getWalletAnalytics:", err);
        return null;
    }
}
