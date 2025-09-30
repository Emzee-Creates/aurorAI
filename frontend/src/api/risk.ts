// src/api/risk.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://aurorai.onrender.com";

// --- New Type to Match Backend's VaRAnalysis ---
export type VaRAnalysisResponse = {
    status: "High" | "Medium" | "Low";
    message: string;
    vaRValueUSD: number;
    // We'll also return the balances and total value used for clarity
    balances: Array<{ valueUSD: number }>;
    totalPortfolioValueUSD: number;
};

// Assuming the backend exposes an endpoint to run the simple VaR calculation.
// Since the backend logic uses simple mock data, the frontend only needs to signal
// the parameters (Time Horizon, Confidence). The wallet's actual balances will 
// likely be fetched and used directly on the backend.

export async function calculateVaR(
    // We are adapting to the simple backend, so we send the parameters it uses 
    // in the function signature, even if the backend ultimately fetches balances internally.
    walletAddress: string,
    timeHorizonDays: number = 1,
    confidenceLevel: number = 0.95
): Promise<VaRAnalysisResponse> {
    const payload = { 
        walletAddress, 
        timeHorizonDays, 
        confidenceLevel 
    };
    
    // We assume the backend route /risk/calculate-var is created to run the simple logic
    const res = await axios.post(`${BASE_URL}/risk/calculate-var`, payload, {
      timeout: 60000,
    });
    
    return res.data;
}

// --- Frontend logic for Concentration Risk ---
// Since the risk analysis is done as part of the overall wallet analytics,
// we assume the backend endpoint (which you used in Dashboard/RiskAnalyzer) 
// already returns this data.

// The concentration risk analysis data should be part of the response 
// from your existing `getWalletAnalytics` call:
// const analytics = await getWalletAnalytics(walletAddress);
// const concentrationData = analytics.concentrationRisk;