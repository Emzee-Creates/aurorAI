// Define a threshold for what constitutes a high concentration risk
const CONCENTRATION_RISK_THRESHOLD = 0.25; // 25%

/**
 * Interface to explicitly define the structure of a balance object.
 */
interface Balance {
    symbol: string;
    valueUSD: number;
    // Add other properties as needed from your data source
}

/**
 * Interface to define the return type of the concentration risk analysis.
 */
interface ConcentrationRiskAnalysis {
    status: "High Risk" | "Low Risk";
    message: string;
    riskyAssets: Array<{
        symbol: string;
        valueUSD: number;
        percentage: number;
    }>;
}

/**
 * Interface to define the return type of the VaR calculation.
 */
interface VaRAnalysis {
    status: "High" | "Medium" | "Low";
    message: string;
    vaRValueUSD: number;
}

/**
 * Calculates the concentration risk of a wallet based on its balances.
 * @param balances The balances array from the wallet analytics API.
 * @param totalPortfolioValueUSD The total value of the portfolio in USD.
 * @returns A risk assessment object.
 */
export function analyzeConcentrationRisk(
    balances: Balance[],
    totalPortfolioValueUSD: number
): ConcentrationRiskAnalysis {
    if (totalPortfolioValueUSD === 0) {
        return {
            status: "Low Risk",
            message: "Portfolio value is zero or contains only unpriced assets.",
            riskyAssets: [],
        };
    }

    const riskyAssets = balances
        .map((balance) => {
            const percentage = balance.valueUSD / totalPortfolioValueUSD;
            return {
                ...balance,
                percentage: percentage,
                isHighRisk: percentage >= CONCENTRATION_RISK_THRESHOLD,
            };
        })
        .filter((asset) => asset.isHighRisk)
        .sort((a, b) => b.percentage - a.percentage); // Sort descending

    const status = riskyAssets.length > 0 ? "High Risk" : "Low Risk";
    const riskyAssetSymbols = riskyAssets.map(asset => asset.symbol).join(', ');

    return {
        status: status,
        message: status === "High Risk" ?
            `Portfolio has high concentration risk in the following asset(s): ${riskyAssetSymbols}.` :
            "Portfolio has low concentration risk.",
        riskyAssets: riskyAssets,
    };
}

/**
 * Calculates a simulated Portfolio Value at Risk (VaR) based on mock historical data.
 * NOTE: This is a simplified, mock implementation. In a production environment,
 * you would use real-time historical data from a price feed API.
 * @param balances The balances array from the wallet analytics API.
 * @param timeHorizonDays The time period over which to calculate risk (e.g., 1 day, 7 days).
 * @param confidenceLevel The confidence level (e.g., 0.95 for 95% confidence).
 * @returns A VaR analysis object.
 */
export function calculatePortfolioVaR(
    balances: Balance[],
    timeHorizonDays: number,
    confidenceLevel: number
): VaRAnalysis {
    // A simplified, hardcoded simulation of potential market volatility.
    // In a real application, this would be based on historical price changes.
    const mockVolatilityFactor = 0.05; // 5% potential daily loss
    const totalPortfolioValueUSD = balances.reduce((sum, asset) => sum + asset.valueUSD, 0);

    // This is a placeholder calculation.
    const vaRValue = totalPortfolioValueUSD * mockVolatilityFactor * timeHorizonDays;

    let status: "High" | "Medium" | "Low" = "Low";
    if (vaRValue > totalPortfolioValueUSD * 0.1) {
        status = "High";
    } else if (vaRValue > totalPortfolioValueUSD * 0.05) {
        status = "Medium";
    }

    return {
        status: status,
        message: `Calculated VaR indicates a potential loss of up to $${vaRValue.toFixed(2)} with a ${confidenceLevel * 100}% confidence over ${timeHorizonDays} day(s).`,
        vaRValueUSD: vaRValue,
    };
}
