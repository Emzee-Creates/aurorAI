// src/api/yield.ts
import axios from "axios";

// Configuration for the base URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

// --- INLINE TYPE DEFINITIONS (To avoid cross-project path issues) ---
// These are simplified definitions matching the critical fields needed by the frontend

export interface QuoteResponse {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    // The full response contains much more, but these are essential
    // We include routePlan as it's often needed for display/logging
    routePlan: any[]; 
    [key: string]: any;
}

export interface SwapTransactionResponse {
    // This is the serialized, unsigned transaction base64 string
    swapTransaction: string; 
}

// --- Types to Match Backend's /optimize-yield Response ---

interface SolStakingAnalysis {
    yield: number;
    yieldUsd: number;
    volatility: number;
    riskLevel: "Low" | "Moderate" | "High" | "N/A";
    summary: string;
    apy: number;
    currentPriceUSD: number;
}

interface UsdcYieldAnalysis {
    targetToken: string;
    apy: number;
    projectedUsdYield: number;
}

export interface YieldOptimizationData {
    wallet: string;
    solBalance: number;
    totalPortfolioValueUSD: number;
    solStaking: SolStakingAnalysis;
    swapOptimization: {
        quoteBasis: string;
        // The QuoteResponse is now defined inline above
        swapQuote: QuoteResponse | null; 
        quotedUsdcAmount: number;
        usdcYield: UsdcYieldAnalysis | null;
    };
}

// 1. Function to fetch the comparative data
export async function fetchYieldOptimizationData(
    walletAddress: string
): Promise<YieldOptimizationData> {
    
    // We assume the backend route is set up as /api/optimize-yield/WALLET_ADDRESS
    const url = `${BASE_URL}/api/optimize-yield/${walletAddress}`;
    
    const res = await axios.get(url, {
        timeout: 60000,
    });
    
    return res.data;
}


// 2. Function to execute the swap (gets the unsigned transaction)
export async function executeSwapTransaction(
    route: QuoteResponse, // The winning route/quote fetched from the previous step
    userPublicKey: string, // The public key of the wallet signing the transaction
): Promise<SwapTransactionResponse> {
    
    const payload = { 
        route, 
        userPublicKey,
    };
    
    // NOTE: This assumes the backend route /jupiter/swap is correctly implemented
    const url = `${BASE_URL}/jupiter/swap`; 
    
    const res = await axios.post(url, payload, {
        timeout: 120000, // Longer timeout for transaction assembly
    });
    
    return res.data;
}