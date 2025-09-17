// --- File: src/services/staking.ts ---
import { getCoinGeckoInfo, getMarinadeApy } from "./pricing";
const stats = require("stats-lite");

/**
 * Analyzes the risk and reward of staking a given amount of SOL.
 *
 * @param {number} solBalance The amount of SOL to analyze.
 * @returns {Promise<object>} An analysis object with yield, volatility, and risk.
 */
export async function analyzeSolStaking(solBalance: number) {
    if (solBalance <= 0) {
        return {
            yield: 0,
            yieldUsd: 0,
            volatility: 0,
            riskLevel: "N/A",
            summary: "No SOL to stake."
        };
    }

    try {
        // --- THIS IS THE KEY CHANGE ---
        // Fetch current APY from the new service function
        const currentApy = await getMarinadeApy();
        
        // Fetch current and historical SOL data
        const solData = await getCoinGeckoInfo("solana", 90);

        const currentSolPrice = solData.price;
        const historicalCandles = solData.candlesticks;

        if (!currentSolPrice || historicalCandles.length < 2) {
            return {
                yield: 0,
                yieldUsd: 0,
                volatility: 0,
                riskLevel: "Data Unavailable",
                summary: "Could not fetch required data for analysis."
            };
        }

        // --- 1. Calculate Potential Yield using the dynamic APY ---
        const projectedSolYield = solBalance * currentApy;
        const projectedUsdYield = projectedSolYield * currentSolPrice;

        // --- 2. Calculate Volatility (Risk) ---
        const prices = historicalCandles.map((candle: any) => candle.close);
        const dailyReturns = [];
        for (let i = 1; i < prices.length; i++) {
            const dailyReturn = (prices[i] - prices[i-1]) / prices[i-1];
            dailyReturns.push(dailyReturn);
        }
        
        const volatility = stats.stdev(dailyReturns) * Math.sqrt(365); // Annualized volatility

        // --- 3. Determine Risk Level ---
        let riskLevel;
        if (volatility > 1.5) {
            riskLevel = "High";
        } else if (volatility > 0.8) {
            riskLevel = "Moderate";
        } else {
            riskLevel = "Low";
        }
        
        const summary = `Based on historical data, SOL has a volatility of ${volatility.toFixed(2)}. Staking could yield ${projectedSolYield.toFixed(2)} SOL or ~$${projectedUsdYield.toFixed(2)} annually at a current APY of ${(currentApy * 100).toFixed(2)}%.`;

        return {
            yield: projectedSolYield,
            yieldUsd: projectedUsdYield,
            volatility: volatility,
            riskLevel: riskLevel,
            apy: currentApy,
            summary: summary
        };

    } catch (error) {
        console.error("Error during SOL staking analysis:", error);
        return {
            yield: 0,
            yieldUsd: 0,
            volatility: 0,
            riskLevel: "Error",
            summary: "An error occurred during analysis."
        };
    }
}