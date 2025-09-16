// Import the function you want to test
const { getWalletAnalytics } = require ('../services/analytics');

// Import the dependencies of the function you want to test
const { getAssetsByOwner, getClassifiedTransactions } = require ('../services/helius');
const { getTokenCandlesticks } = require('../services/coingecko');
import { Connection } from '@solana/web3.js';

// ---- MOCK EXTERNAL DEPENDENCIES ----
// We use `jest.mock` to replace the real modules with mock versions.
// This prevents our tests from making real network requests.

jest.mock('../services/helius');
jest.mock('../services/coingecko');

// We also need to mock the `@solana/web3.js` library, specifically the `Connection` class.
// This allows us to control the `getBalance` method's return value.
jest.mock('@solana/web3.js', () => ({
  // The `jest.fn()` creates a mock function.
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue(1000000000), // Mock a SOL balance of 1 SOL (10^9 lamports)
  })),
  // We need to provide mock implementations for other exports used in analytics.ts
  PublicKey: jest.fn(),
  LAMPORTS_PER_SOL: 1000000000,
}));

// We need to type the mocked modules to access their properties correctly
const mockGetAssetsByOwner = getAssetsByOwner as jest.Mock;
const mockGetClassifiedTransactions = getClassifiedTransactions as jest.Mock;
const mockGetTokenCandlesticks = getTokenCandlesticks as jest.Mock;


// ---- TEST SUITE FOR getWalletAnalytics ----
describe('getWalletAnalytics', () => {

  // This function runs before each test to clear any mock data.
  // This ensures that each test is independent and doesn't affect others.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a complete wallet analysis with correct calculations', async () => {
    // ---- 1. ARRANGE: Set up the mock data for a successful test case ----
    const mockHeliusAssets = [
      {
        id: 'token_mint_1',
        content: { metadata: { symbol: 'USDC', name: 'USD Coin' } },
        token_info: { price_info: { price_per_token: 1.0 }, balance: 500000000, decimals: 6 },
      },
      {
        id: 'token_mint_2',
        content: { metadata: { symbol: 'MSOL', name: 'Marinade Staked SOL' } },
        token_info: { price_info: { price_per_token: 150.0 }, balance: 100000000, decimals: 9 },
      },
      // Mock the SOL token returned by Helius DAS API
      {
        id: 'So11111111111111111111111111111111111111112',
        content: { metadata: { symbol: 'SOL', name: 'Solana' } },
        token_info: { price_info: { price_per_token: 150.0 }, balance: 1000000000, decimals: 9 },
      },
    ];

    const mockTransactions = [
      { signature: 'sig1', type: 'SWAP', source: 'JUPITER' },
      { signature: 'sig2', type: 'TRANSFER_SPL_TOKEN' },
    ];

    const mockCandlesticks = [
      [1672531200000, 100, 105, 95, 102], // Sample OHLCV data
    ];

    // ---- 2. ACT: Configure the mock functions to return the mock data ----
    mockGetAssetsByOwner.mockResolvedValue(mockHeliusAssets);
    mockGetClassifiedTransactions.mockResolvedValue(mockTransactions);
    mockGetTokenCandlesticks.mockResolvedValue(mockCandlesticks);

    // Call the function you are testing
    const walletAddress = 'mock_wallet_address';
    const result = await getWalletAnalytics(walletAddress, 7);

    // ---- 3. ASSERT: Verify the output ----
    expect(result).toBeDefined();
    expect(result.wallet).toBe(walletAddress);
    expect(result.balances).toHaveLength(3); // SOL + USDC + MSOL
    expect(result.transactions).toEqual(mockTransactions);

    // Check that the calculations are correct
    const usdc = result.balances.find((b: any) => b.symbol === 'USDC');
    expect(usdc.amount).toBe(500); // 500 million balance / 10^6 decimals
    expect(usdc.valueUSD).toBe(500.0);

    const msol = result.balances.find((b: any) => b.symbol === 'MSOL');
    expect(msol.amount).toBe(0.1); // 100 million balance / 10^9 decimals
    expect(msol.valueUSD).toBe(15.0); // 0.1 * 150

    const sol = result.balances.find((b: any) => b.symbol === 'SOL');
    expect(sol.amount).toBe(1.0); // 1,000,000,000 lamports / 10^9
    expect(sol.valueUSD).toBe(150.0);

    // Calculate the total portfolio value and assert it is correct
    const expectedTotalValue = 500.0 + 15.0 + 150.0;
    expect(result.totalPortfolioValueUSD).toBeCloseTo(expectedTotalValue);

    // Verify that the correct API calls were made with the correct arguments
    expect(mockGetAssetsByOwner).toHaveBeenCalledWith(walletAddress);
    expect(mockGetClassifiedTransactions).toHaveBeenCalledWith(walletAddress, 20);
    expect(mockGetTokenCandlesticks).toHaveBeenCalledWith('sol', 'usd', 7);
    expect(mockGetTokenCandlesticks).toHaveBeenCalledWith('usdc', 'usd', 7);
    expect(mockGetTokenCandlesticks).toHaveBeenCalledWith('msol', 'usd', 7);
  });
  
  it('should handle API errors gracefully and return an empty result', async () => {
    // ---- 1. ARRANGE: Set up a failure scenario ----
    const errorMessage = "Failed to fetch assets";
    mockGetAssetsByOwner.mockRejectedValue(new Error(errorMessage));
    
    // ---- 2. ACT & ASSERT: Wrap the call in a `try/catch` or use `expect().rejects.toThrow()` ----
    await expect(getWalletAnalytics('test-address')).rejects.toThrow(errorMessage);
  });
  
});