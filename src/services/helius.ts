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
 * @param method The JSON-RPC method to call.
 * @param params The parameters for the method.
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
            timeout: 20_000,
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
 * Retrieves all assets (tokens and NFTs) for a given owner using Helius DAS API.
 * This is a significant performance improvement as it returns rich metadata and price info.
 * @param ownerAddress The Solana wallet address of the owner.
 * @returns An array of assets, including their metadata, balance, and price information.
 */
async function getAssetsByOwner(ownerAddress: string): Promise<any[]> {
    const params = {
        ownerAddress: ownerAddress,
        displayOptions: {
            showFungible: true,
            showUnwrapped: true,
            showInscription: true,
        },
        // Helius limits results to 1000 per page. For large wallets, you would
        // need to implement pagination with `page` and `sortBy` parameters.
        page: 1, 
        limit: 1000,
    };
    const result = await heliusRpcRequest<any>("getAssetsByOwner", [params]);
    return result?.items || [];
}

/**
 * Gets enhanced transactions for a wallet address using Helius Enhanced API.
 * @param address The Solana wallet address.
 * @param limit The number of transactions to retrieve.
 * @returns An array of enhanced transactions with a custom category.
 */
async function getClassifiedTransactions(
    address: string,
    limit: number = 50
): Promise<(any & { category: string })[]> {
    try {
        const url = `${HELIUS_ENHANCED_API_URL}/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
        const { data: txs }: AxiosResponse<any[]> = await axios.get(url, {
            timeout: 20_000,
        });

        // The transaction classification logic
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
        }));
    } catch (error) {
        console.error(`Enhanced API call for address ${address} failed:`, error);
        throw error;
    }
}

// --------------------
// Exports
// --------------------
module.exports = {
    getAssetsByOwner,
    getClassifiedTransactions,
    getHeliusRpcUrl: () => HELIUS_RPC_URL,
};