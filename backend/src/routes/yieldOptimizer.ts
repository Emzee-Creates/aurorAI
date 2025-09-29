import { Request, Response, Router } from 'express';
// Import your service functions
import { getWalletAnalytics } from '../services/analytics';
import { analyzeSolStaking } from '../services/staking';
import { getRouteQuote, SYMBOL_TO_MINT } from '../services/jupiter';

// Define the decimals for SOL
const SOL_DECIMALS = 9;

// Import a manual APY source (REQUIRED for comparison)
const STABLECOIN_APY_PLACEHOLDER = 0.04; // e.g., 4% annual yield on USDC

const yieldOptimizerRouter = Router();

// Endpoint: /api/optimize-yield/:walletAddress
yieldOptimizerRouter.get('/:walletAddress', async (req: Request, res: Response) => {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required." });
    }

    try {
        // 1. Fetch Core Wallet Data
        const analyticsData = await getWalletAnalytics(walletAddress);
        console.log("Full Analytics Data:", JSON.stringify(analyticsData, null, 2));
        if (!analyticsData) {
            return res.status(404).json({ error: "Could not fetch wallet data." });
        }
        
        // Find SOL Balance and Run Staking Analysis
        const solHolding = analyticsData.balances.find(h => h.symbol === 'SOL');
        console.log("SOL Holding Object:", solHolding);
        const solBalance = solHolding?.balance || 0; // Floating point value (e.g., 13.822092881)
        
        // 2. Run SOL Staking Analysis
        const solStakingAnalysis = await analyzeSolStaking(solBalance);
        
        // 3. Get USDC Swap Quote
        let SWAP_AMOUNT_SOL_TO_QUOTE: string;

        if (solBalance > 0) {
            // ⭐ CORE FIX: Convert floating-point SOL balance to integer lamport string (10^9 units)
            // We multiply by 10^9 and use Math.round to handle float precision issues
            const multiplier = Math.pow(10, SOL_DECIMALS);
            const lamportAmount = solBalance * multiplier;
            
            // Use Math.round() to ensure a clean integer string for Jupiter
            SWAP_AMOUNT_SOL_TO_QUOTE = Math.round(lamportAmount).toString(); 
            
            console.log(`Sending to Jupiter with lamport amount: ${SWAP_AMOUNT_SOL_TO_QUOTE}`);
        } else {
            // If no SOL, use a baseline amount (e.g., 1 SOL in lamports)
            SWAP_AMOUNT_SOL_TO_QUOTE = "1000000000"; 
        }

        const usdcMint = SYMBOL_TO_MINT.USDC;
        const solMint = SYMBOL_TO_MINT.SOL;

        let swapQuote = null;
        if (solBalance > 0) {
            swapQuote = await getRouteQuote({
                inputMint: solMint || '',
                outputMint: usdcMint || '',
                amount: SWAP_AMOUNT_SOL_TO_QUOTE, // NOW a large integer string
                slippageBps: 50 // 0.5% slippage
            });
        }
        
        // Calculate estimated USDC yield from the quote
        let estimatedUsdcYield = null;
        let quotedUsdcAmount = 0;

        if (swapQuote) {
            // Jupiter quote outAmount is in the smallest unit (e.g., tiny units for USDC)
            // Assuming USDC has 6 decimal places (typical for Solana USDC)
            const USDC_DECIMALS = 6; 
            const quotedUsdcAmountInUnits = swapQuote.outAmount;
            
            // Convert outAmount back to full USDC units (floating point)
            quotedUsdcAmount = parseFloat(quotedUsdcAmountInUnits) / Math.pow(10, USDC_DECIMALS);
            
            // Calculate annual yield from the quoted USDC
            const projectedUsdcYieldUSD = quotedUsdcAmount * STABLECOIN_APY_PLACEHOLDER;
            estimatedUsdcYield = {
                targetToken: "USDC",
                apy: STABLECOIN_APY_PLACEHOLDER,
                projectedUsdYield: projectedUsdcYieldUSD,
            };
        }

        // 4. Aggregate and Send to Frontend
        return res.json({
            wallet: walletAddress,
            solBalance,
            totalPortfolioValueUSD: analyticsData.totalPortfolioValueUSD,
            solStaking: {
                ...solStakingAnalysis,
                currentPriceUSD: solHolding?.price || 0,
            },
            swapOptimization: {
                quoteBasis: solBalance > 0 ? "Full Balance" : "N/A",
                swapQuote: swapQuote,
                quotedUsdcAmount,
                usdcYield: estimatedUsdcYield,
            },
        });

    } catch (error) {
        // Log the error for backend debugging
        console.error("Error fetching yield optimization data:", error); 
        
        // If the error originated from Jupiter, it often returns a useful 400 status.
        // We can check if the status code exists and use it, otherwise default to 500.
        const statusCode = (error as any).response?.status || 500;
        const errorMessage = (error as any).response?.data?.error || "Internal server error during yield optimization analysis.";

        return res.status(statusCode).json({ error: errorMessage });
    }
});

export default yieldOptimizerRouter;