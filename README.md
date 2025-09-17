Backend API Documentation: Wallet Analytics Endpoint
Yo, the core backend API for wallet analytics is now live and ready to be integrated. This documentation provides a breakdown of the functional route, the data it returns, and how to use it in the frontend.

API Endpoint
Method: GET

URL: http://localhost:5000/analytics/:walletAddress

Description: This endpoint fetches a comprehensive snapshot of a Solana wallet, including token balances, historical transactions, and portfolio value.

URL Parameter:

:walletAddress (required): The public key of the Solana wallet to analyze. use 9dFBCrJfjPVJUFwR4peJpKyNSAB4F2Di2HGa9JG6m3in just for testing

Example Request
You can test this route by making a GET request using a tool like Postman, or by simply pasting the URL into your browser:

http://localhost:5000/analytics/9dFBCrJfjPVJUFwR4peJpKyNSAB4F2Di2HGa9JG6m3in
JSON Response Structure
A successful request will return a JSON object with the following structure. This is the data your frontend should expect and be built to display.

JSON

{
  "wallet": "FGi6gUdHhecqNgnU5u3hDAcXTWgs6eRoJMiJqPZXuq6f",
  "balances": [
    {
      "mint": "So11111111111111111111111111111111111111112",
      "name": "Solana",
      "symbol": "SOL",
      "amount": 0.040260951,
      "price": 150,
      "valueUSD": 6.03914265,
      "candlesticks": [
        [1758051540000, 150.12, 150.35, 149.88, 150.05, 12345]
      ]
    },
    {
      "mint": "Es9HD91t63w5j8t3GfF6x2Pz3yXhJ4qS2P9mP6V5n3c7",
      "name": "USDC",
      "symbol": "USDC",
      "amount": 500,
      "price": 1,
      "valueUSD": 500,
      "candlesticks": []
    }
  ],
  "transactions": [
    {
      "description": "...",
      "type": "TRANSFER",
      "source": "SYSTEM_PROGRAM",
      "category": "TRANSFER",
      "signature": "...",
      "timestamp": 1758062342
    }
  ],
  "totalPortfolioValueUSD": 506.03914265
}
Key Data Points to Highlight:
wallet: The public key of the wallet that was analyzed.

balances: An array of objects, each representing a fungible token (like SOL, USDC, or other tokens) or an NFT.

mint: The unique identifier for the token. This is crucial for fetching images and further details on the frontend.

name & symbol: Human-readable names for the asset.

amount: The quantity of the token the wallet holds.

valueUSD: The current value of this specific token in USD.

candlesticks: An array of historical price data points for charting. It will be empty for tokens without a listed price (like most NFTs).

transactions: An array of the wallet's recent on-chain activities.

category: A custom field we added to classify transactions (e.g., DEX_SWAP, NFT_ACTIVITY, TRANSFER). This is perfect for filtering and organizing the transaction history on the frontend.

totalPortfolioValueUSD: A single sum of all assets that have a USD value. This will be 0 if the wallet only contains NFTs or unlisted tokens.

Frontend Integration Guidelines
Input Field: Create a text input field on the frontend for the user to enter their Solana wallet address.

API Call: When the user submits their address, construct the API request URL dynamically by appending the wallet address to the base URL.

Data Display:

Use the totalPortfolioValueUSD field to show the total value in a prominent card or header.

Iterate through the balances array to display each asset. You can use the mint address to fetch asset images from a service like the Solana Token List.

Display a table or list of recent transactions by iterating through the transactions array, using the category field to add labels or icons.

I am available if you or your teammate have any questions on the data or its structure.
