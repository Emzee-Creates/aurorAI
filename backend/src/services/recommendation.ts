// File: src/engine/recommendation.ts

import { classifyUserBehavior } from '../services/behavior';
import { getHeliusAssets, getHeliusTransactions } from '../services/helius'; // Import Helius service functions
const { getRouteQuote, resolveMint } = require('../services/jupiter');

// Official JitoSOL mint address
const JITOSOL_MINT = 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn';

/**
 * Generates personalized yield and risk recommendations.
 * @param {string} userAddress The user's wallet address.
 * @returns {Promise<Array<object>>} A ranked list of recommendations with executable actions.
 */
export async function getRecommendations(userAddress: string): Promise<any[]> {
    // 1. Fetch live data from Helius
    const holdings = await getHeliusAssets(userAddress);
    const transactions = await getHeliusTransactions(userAddress);

    // 2. Classify user behavior based on live transactions
    const { profile } = classifyUserBehavior(transactions);

    const recommendations = [];

    // --- Rule 1: Staking recommendation for SOL holders ---
    const solHolding = holdings.find(h => h.symbol === 'SOL');
    if (solHolding && solHolding.balance > 0 && (profile === "DeFi Participant" || profile === "Long-term Holder")) {
        const inputMint = resolveMint('SOL');
        const outputMint = JITOSOL_MINT;
        const amount = solHolding.balance.toFixed(6);

        try {
            const jupiterQuote = await getRouteQuote({ inputMint, outputMint, amount });
            
            recommendations.push({
                type: 'Staking',
                title: 'Earn yield with liquid staking via Jito',
                description: 'Convert your SOL to JitoSOL to earn staking rewards and MEV revenue while keeping your assets liquid.',
                action: {
                    protocol: 'Jupiter',
                    type: 'stake',
                    fromToken: 'SOL',
                    toToken: 'JitoSOL',
                    jupiterQuote: jupiterQuote
                },
                priority: 1
            });
        } catch (error) {
            console.error(`Failed to get Jupiter quote for JitoSOL:`, error);
        }
    }

    // --- Rule 2: Concentration Risk Management ---
    const totalValueUsd = holdings.reduce((sum, h) => sum + (h.balance * h.price), 0);
    const concentrationThreshold = 0.5;
    const largestHolding = holdings.reduce((max, h) => (h.balance * h.price) > (max.balance * max.price) ? h : max, { balance: 0, price: 0 });

    if (totalValueUsd > 0 && (largestHolding.balance * largestHolding.price) / totalValueUsd > concentrationThreshold) {
        const inputMint = resolveMint(largestHolding.symbol);
        const outputMint = resolveMint('USDC');
        const amount = (largestHolding.balance * 0.2).toFixed(6);

        try {
            const jupiterQuote = await getRouteQuote({ inputMint, outputMint, amount });
            
            recommendations.push({
                type: 'Risk Management',
                title: `Reduce concentration in ${largestHolding.symbol}`,
                description: `Your portfolio is heavily concentrated in ${largestHolding.symbol}. Diversify by swapping a portion into a stablecoin like USDC to reduce risk.`,
                action: {
                    protocol: 'Jupiter',
                    type: 'swap',
                    fromToken: largestHolding.symbol,
                    toToken: 'USDC',
                    jupiterQuote: jupiterQuote
                },
                priority: 2
            });
        } catch (error) {
            console.error(`Failed to get Jupiter quote for ${largestHolding.symbol}:`, error);
        }
    }
    
    // --- Rule 3: Yield Farming for Balanced Portfolios ---
    const usdHolding = holdings.find(h => h.symbol === 'USDC');
    const isBalanced = holdings.length >= 2 && totalValueUsd > 100;
    
    if ((profile === 'DeFi Participant' || profile === 'Active Trader') && isBalanced && solHolding && usdHolding) {
        recommendations.push({
            type: 'Yield Farming',
            title: 'Earn yield on your SOL and USDC',
            description: 'Provide liquidity to the SOL/USDC pool on Orca to earn trading fees.',
            action: {
                protocol: 'Orca',
                type: 'addLiquidity',
                tokens: ['SOL', 'USDC']
            },
            priority: 3
        });
    }
    
    // Fallback: If no other recommendations were found, suggest a general one.
    if (recommendations.length === 0 && holdings.length > 0) {
        recommendations.push({
            type: 'General',
            title: 'Welcome to the AI Yield and Risk Optimizer!',
            description: 'No specific recommendations were found for your portfolio. Consider exploring the available DeFi and staking opportunities to get started.',
            priority: 4
        });
    }

    // Sort recommendations by priority and return
    return recommendations.sort((a, b) => a.priority - b.priority);
}