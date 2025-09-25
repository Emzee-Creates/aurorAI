// File: src/services/helius.ts

import type { AxiosResponse } from "axios";
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

// Get the API key from environment variables
const HELIUS_API_KEY = process.env.HELIUS_API_KEY as string;

if (!HELIUS_API_KEY) {
    throw new Error("HELIUS_API_KEY not configured in environment variables.");
}

// Construct the base URLs
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_ENHANCED_API_URL = `https://api.helius.xyz/v0`;

// --------------------
// Helper Functions
// --------------------

/**
 * Centralized function for making JSON-RPC requests (POST) to Helius.
 */
async function heliusRpcRequest<T>(method: string, params: any[]): Promise<T> {
    const body = {
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
    };

    try {
        const { data }: AxiosResponse<any> = await axios.post(HELIUS_RPC_URL, body, {
            timeout: 100_000,
            headers: { "Content-Type": "application/json" },
        });

        if (data.error) {
            throw new Error(`Helius RPC Error: ${data.error.message}`);
        }
        return data.result ?? null;
    } catch (error) {
        console.error(`RPC call to ${method} failed:`, error);
        throw error;
    }
}

// --------------------
// Helius API Functions
// --------------------

/**
 * Retrieves all assets (tokens and SOL) for a given owner from Helius DAS API.
 * The response is transformed to a simplified format for the AI core.
 * @param ownerAddress The Solana wallet address of the owner.
 * @returns A simplified array of assets with 'mint', 'symbol', 'balance', and 'price'.
 */
export async function getHeliusAssets(ownerAddress: string): Promise<any[]> {
    const body = {
        jsonrpc: "2.0",
        id: "1",
        method: "getAssetsByOwner",
        params: {
            ownerAddress,
            displayOptions: {
                showFungible: true,
                showNativeBalance: true,
            },
            page: 1, 
            limit: 1000,
        },
    };

    try {
        const { data }: AxiosResponse<any> = await axios.post(HELIUS_RPC_URL, body, {
            timeout: 100_000,
            headers: { "Content-Type": "application/json" },
        });

        if (data.error) {
            throw new Error(`Helius RPC Error: ${data.error.message}`);
        }
        
        // --- DATA TRANSFORMATION ---
        const assets = data.result?.items || [];
        const transformedHoldings = assets
            .filter((asset: { token_info?: { price_info?: any } }) => asset.token_info?.price_info)
            .map((asset: { id: string; token_info: { balance: number; decimals: number; price_info: { price_per_token: number }; symbol: string } }) => {
                const balance = asset.token_info.balance / (10 ** asset.token_info.decimals);
                const price = asset.token_info.price_info.price_per_token;
                const symbol = asset.token_info.symbol;
                const mint = asset.id;
                return { mint, symbol, balance, price };
            });
        
        // Handle native SOL balance, which is a separate field
        if (data.result.nativeBalance?.lamports) {
            const solBalance = data.result.nativeBalance.lamports / 10**9;
            const solPrice = data.result.nativeBalance.price_per_sol;
            transformedHoldings.push({
                mint: 'So11111111111111111111111111111111111111112', // Standard SOL mint
                symbol: 'SOL',
                balance: solBalance,
                price: solPrice,
            });
        }
        
        return transformedHoldings;
    } catch (error) {
        console.error(`RPC call to getAssetsByOwner failed:`, error);
        throw error;
    }
}

/**
 * Gets enhanced and classified transactions for a wallet address using Helius Enhanced API.
 */
export async function getHeliusTransactions(
    address: string,
    limit: number = 50
): Promise<(any & { category: string })[]> {
    try {
        const url = `${HELIUS_ENHANCED_API_URL}/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
        const { data: txs }: AxiosResponse<any[]> = await axios.get(url, {
            timeout: 100_000,
        });

        const CATEGORY_MAP: { [key: string]: string } = {
            "SWAP": "DEX_SWAP", "SWAP_LEGACY": "DEX_SWAP", "JUPITER": "DEX_SWAP", "RAYDIUM": "DEX_SWAP",
            "ORCA": "DEX_SWAP", "PUMP_AMM": "DEX_SWAP", "OPENBOOK": "DEX_SWAP",
            "NFT_MINT": "NFT_ACTIVITY", "NFT_SALE": "NFT_ACTIVITY", "NFT_LISTING": "NFT_ACTIVITY",
            "NFT_TRANSFER": "NFT_ACTIVITY", "NFT_CANCEL_LISTING": "NFT_ACTIVITY",
            "MAGIC_EDEN": "NFT_ACTIVITY", "TENSOR": "NFT_ACTIVITY", "METAPLEX": "NFT_ACTIVITY",
            "HYPERSPACE": "NFT_ACTIVITY",
            "STAKE_DELEGATE": "STAKING", "STAKE_DEACTIVATE": "STAKING", "STAKE_WITHDRAW": "STAKING",
            "STAKE_REWARD": "STAKING",
            "MARINADE": "STAKING_DEFI", "JITO": "STAKING_DEFI",
            "TRANSFER": "TRANSFER", "TRANSFER_SOL": "TRANSFER", "TRANSFER_SPL_TOKEN": "TRANSFER",
            "KAMINO": "DEFI_LENDING", "LEND_BORROW": "DEFI_LENDING", "LIQUIDATE": "DEFI_LENDING",
        };

        const classifyTransaction = (tx: any): string => {
            const type = tx.type?.toUpperCase() ?? "";
            const source = tx.source?.toUpperCase() ?? "";
            
            if (CATEGORY_MAP[type]) return CATEGORY_MAP[type];
            if (CATEGORY_MAP[source]) return CATEGORY_MAP[source];
            
            if (type.includes("SWAP")) return "DEX_SWAP";
            if (type.includes("NFT")) return "NFT_ACTIVITY";
            if (type.includes("STAKE")) return "STAKING";
            if (type.includes("TRANSFER")) return "TRANSFER";
            
            return "UNKNOWN";
        };

        return txs.map((tx) => ({
            ...tx,
            category: classifyTransaction(tx),
            signature: tx.signature || tx.txHash || tx.id || "unknown",
        }));
    } catch (error) {
        console.error(`Enhanced API call for address ${address} failed:`, error);
        throw error;
    }
}