/**
 * Represents the response object from the Jupiter `/quote` API endpoint.
 * This is the object that contains the route plan and other details for a swap.
 */
export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: 'ExactIn' | 'ExactOut';
  slippageBps: number;
  platformFee: {
    amount: string;
    feeBps: number;
  } | null;
  priceImpactPct: string;
  routePlan: RouteStep[];
  contextSlot: number;
  timeTaken: number;
  swapUsdValue: string;
}

/**
 * Represents a single step in the `routePlan` array from the Jupiter API quote.
 * This details the specific AMM and token pair used for that part of the swap.
 */
export interface RouteStep {
  swapInfo: SwapInfo;
  percent: number;
  bps: number;
}

/**
 * Details of the swap operation for a single `RouteStep`.
 */
export interface SwapInfo {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

/**
 * Represents the response from the Jupiter `/swap` API endpoint.
 * This object contains the serialized transaction and a transaction ID, if available.
 */
export interface SwapTransactionResponse {
  swapTransaction: string;
  lastValidBlockHeight?: number;
  txid?: string; // Corrected: This property is now optional.
}