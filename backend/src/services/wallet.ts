// --- File: src/services/wallet.ts ---
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
const pricing = require("./pricing"); // Your pricing service from the previous step

const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";

// Placeholder for the getTokenInfo function from your pricing service
// We'll import the real one from your pricing file.
// const { getTokenInfo } = require('./pricing');

/**
 * Fetches all SPL tokens for a given Solana wallet, their balances,
 * and their USD values.
 *
 * @param {string} walletAddress The public key of the wallet as a string.
 * @returns {Promise<Array<Object>>} An array of token objects with balance and value.
 */
export async function getWalletTokensAndBalance(walletAddress: string) {
    const connection = new Connection(SOLANA_RPC_URL, "confirmed");
    const ownerPublicKey = new PublicKey(walletAddress);

    try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            ownerPublicKey,
            { programId: TOKEN_PROGRAM_ID }
        );

        const portfolio = [];
        let solBalance = 0; // To handle native SOL separately

        // Fetch native SOL balance
        const nativeSolBalanceLamports = await connection.getBalance(ownerPublicKey);
        solBalance = nativeSolBalanceLamports / 1e9; // Convert from lamports to SOL

        // Create a list of token mint addresses to fetch prices for
        const tokenMintAddresses = tokenAccounts.value.map(account => 
            account.account.data.parsed.info.mint
        );

        // Fetch prices for all tokens in one go (if you've implemented a multi-price function)
        // For now, we'll fetch them individually to keep it simple.
        
        // Handle native SOL
        if (solBalance > 0) {
             const solInfo = await pricing.getTokenInfo("So11111111111111111111111111111111111111112", "SOL");
             const solValue = solBalance * (solInfo.price || 0);
             portfolio.push({
                 mint: "So11111111111111111111111111111111111111112",
                 symbol: "SOL",
                 balance: solBalance,
                 valueUSD: solValue,
             });
        }
        
        // Handle other SPL tokens
        for (const account of tokenAccounts.value) {
            const tokenInfo = account.account.data.parsed.info;
            const mintAddress = tokenInfo.mint;
            const amount = tokenInfo.tokenAmount.uiAmount;

            if (amount > 0) { // Only process tokens with a non-zero balance
                const priceInfo = await pricing.getTokenInfo(mintAddress, "");
                const tokenValue = amount * (priceInfo.price || 0);

                portfolio.push({
                    mint: mintAddress,
                    symbol: tokenInfo.symbol || "UNKNOWN", // Some tokens might not have a symbol
                    balance: amount,
                    valueUSD: tokenValue,
                });
            }
        }

        return portfolio;

    } catch (error) {
        console.error("Error fetching wallet tokens:", error);
        return [];
    }
}

/**
 * Calculates the Herfindahl-Hirschman Index (HHI) for a portfolio.
 *
 * @param {Array<Object>} portfolio An array of token objects with a 'value' property.
 * @returns {number} The HHI score.
 */
export function calculateHHI(portfolio: { value: number }[]) {
    const totalValue = portfolio.reduce((sum, token) => sum + token.value, 0);

    if (totalValue === 0) {
        return 0; // Avoid division by zero
    }

    const hhi = portfolio.reduce((sum, token) => {
        const weight = token.value / totalValue;
        return sum + Math.pow(weight, 2);
    }, 0);

    // HHI is typically reported on a 0-10,000 scale
    return hhi * 10000;
}