import { Request, Response } from 'express';
import { getHeliusAssets, getHeliusTransactions } from './helius';
import { analyzeConcentrationRisk } from './risk';
import { analyzeSolStaking } from './staking';
import { classifyUserBehavior } from './behavior';
import { getCoinGeckoOHLC } from './coingecko';

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
    candlestickData?: number[][] | null; // Allow null for type compatibility
}

export async function getWalletAnalytics(
    walletAddress: string
): Promise<WalletAnalytics | null> {
    try {
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

        // Fetch candlestick data for a key asset, e.g., Solana
        // We'll use "solana" as the CoinGecko ID
        const solanaCandlestickData = await getCoinGeckoOHLC('solana', 30);


        return {
            wallet: walletAddress,
            balances: holdingsWithValues,
            transactions,
            totalPortfolioValueUSD,
            concentrationRisk: analyzeConcentrationRisk(holdingsWithValues, totalPortfolioValueUSD),
            solStakingAnalysis,
            userBehavior,
            candlestickData: solanaCandlestickData,
        };

    } catch (err) {
        console.error("Error in getWalletAnalytics:", err);
        throw err;
    }
}
