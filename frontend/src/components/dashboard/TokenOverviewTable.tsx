import { useState, useMemo } from "react"; // 1. Import useState and useMemo

interface Token {
  mint: string;
  symbol: string;
  balance: number;
  price: number;
  valueUSD: number;
}

interface Props {
  tokens: Token[];
}

// Set the initial limit for tokens to display
const INITIAL_LIMIT = 10;

export default function TokenOverviewTable({ tokens }: Props) {
  // 2. State to track whether to show all tokens or just the top 10
  const [showAll, setShowAll] = useState(false);
  
  // 3. Sort the tokens once using useMemo for performance
  const sortedTokens = useMemo(() => {
    // Sorts by valueUSD in descending order (highest value first)
    return [...tokens].sort((a, b) => b.valueUSD - a.valueUSD);
  }, [tokens]); // Recalculate only if the 'tokens' prop changes

  // 4. Determine which tokens to display (either limited or all)
  const tokensToDisplay = showAll
    ? sortedTokens
    : sortedTokens.slice(0, INITIAL_LIMIT);

  // Check if there are more than 10 tokens to trigger the button
  const hasMoreThanLimit = sortedTokens.length > INITIAL_LIMIT;

  // Function to toggle the display state
  const handleToggle = () => {
    setShowAll(prev => !prev);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-lg font-bold mb-4">Token Balances</h2>
      
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Token</th>
            <th className="text-right p-2">Amount</th>
            <th className="text-right p-2">Value (USD)</th>
          </tr>
        </thead>
        <tbody>
          {/* 5. Map over the controlled list: tokensToDisplay */}
          {tokensToDisplay.map(token => (
            <tr key={token.mint} className="border-b hover:bg-gray-50">
              <td className="p-2 font-medium">{token.symbol}</td>
              <td className="p-2 text-right">
                {token.balance.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
              </td>
              <td className="p-2 text-right">
                ${token.valueUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* 6. The "Show More/Show Less" Button */}
      {hasMoreThanLimit && (
        <div className="pt-4 text-center">
          <button
            onClick={handleToggle}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {showAll ? "Show Less" : `Show More (${sortedTokens.length - INITIAL_LIMIT} Hidden)`}
          </button>
        </div>
      )}
    </div>
  );
}