// Define a threshold for what constitutes a high concentration risk
const CONCENTRATION_RISK_THRESHOLD = 0.25; // 25%

/**
 * Calculates the concentration risk of a wallet based on its balances.
 * @param balances The balances array from the wallet analytics API.
 * @param totalPortfolioValueUSD The total value of the portfolio in USD.
 * @returns A risk assessment object.
 */
export function analyzeConcentrationRisk(
    balances: any[],
    totalPortfolioValueUSD: number
) {
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

    return {
        status: status,
        message: status === "High Risk"
            ? `Portfolio has high concentration risk in ${riskyAssets.length} asset(s).`
            : "Portfolio has low concentration risk.",
        riskyAssets: riskyAssets,
    };
}