// Import the functions you want to test from your Helius wrapper
const { getAssetsByOwner, getClassifiedTransactions } = require('../services/helius');

// Import the `axios` library, which is the dependency we need to mock
import axios from 'axios';

// ---- MOCK EXTERNAL DEPENDENCY ----
// `jest.mock('axios')` tells Jest to replace the real `axios` module
// with a mock version. This prevents any real network requests from being made.
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// ---- TEST SUITE FOR getAssetsByOwner ----
describe('getAssetsByOwner', () => {

  // Clean up mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly call the Helius DAS API and return assets', async () => {
    // ---- 1. ARRANGE: Define the mock response from the Helius API
    const mockHeliusResponse = {
      data: {
        jsonrpc: "2.0",
        result: {
          items: [
            { id: "asset1", content: { metadata: { symbol: "SOL" } } },
            { id: "asset2", content: { metadata: { symbol: "USDC" } } },
          ],
        },
      },
    };

    // ---- 2. ACT: Configure the mock function to return the mock data
    // We use `mockResolvedValue` because `axios.post` returns a Promise.
    mockedAxios.post.mockResolvedValue(mockHeliusResponse);

    const ownerAddress = "test_owner_address";
    const result = await getAssetsByOwner(ownerAddress);

    // ---- 3. ASSERT: Verify the results
    // Check that the function returned the correct data
    expect(result).toEqual(mockHeliusResponse.data.result.items);

    // Check that the `axios.post` function was called exactly once
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    // Check that the `axios.post` function was called with the correct arguments
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('https://mainnet.helius-rpc.com/'),
      expect.objectContaining({
        method: 'getAssetsByOwner',
        params: [
          expect.objectContaining({ ownerAddress: ownerAddress, displayOptions: expect.anything() }),
        ],
      }),
      expect.any(Object) // This represents the config object
    );
  });

  it('should handle API errors and throw an error', async () => {
    // ---- 1. ARRANGE: Set up a failure scenario
    const errorMessage = "Helius RPC Error: Bad Request";
    mockedAxios.post.mockRejectedValue(new Error(errorMessage));

    // ---- 2. ACT & ASSERT: Check that the function throws an error
    await expect(getAssetsByOwner("test_owner_address")).rejects.toThrow(errorMessage);

    // Verify the function was called as expected even when it fails
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});

// ---- TEST SUITE FOR getClassifiedTransactions ----
describe('getClassifiedTransactions', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and classify transactions correctly', async () => {
    // ---- 1. ARRANGE: Define the mock response from the Helius Enhanced API
    const mockTxResponse = {
      data: [
        { type: 'SWAP', source: 'JUPITER' },
        { type: 'TRANSFER', source: 'SYSTEM_PROGRAM' },
        { type: 'NFT_MINT', source: 'METAPLEX' },
      ],
    };

    // ---- 2. ACT: Configure the mock function
    // We use `axios.get` for this endpoint
    mockedAxios.get.mockResolvedValue(mockTxResponse);

    const address = "test_address";
    const result = await getClassifiedTransactions(address);

    // ---- 3. ASSERT: Verify the results
    expect(result).toHaveLength(3);

    // Check that each transaction has the correct classification
    expect(result[0].category).toBe('DEX_SWAP');
    expect(result[1].category).toBe('TRANSFER');
    expect(result[2].category).toBe('NFT_ACTIVITY');
    
    // Verify the correct API call was made
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining(`https://api.helius.xyz/v0/addresses/${address}/transactions`),
      expect.any(Object)
    );
  });
});