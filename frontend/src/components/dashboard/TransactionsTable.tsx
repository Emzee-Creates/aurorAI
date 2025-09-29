import { useState, useMemo } from "react";

interface Transaction {
  description: string;
  type: string;
  category: string;
  signature: string;
  // timestamp is in seconds since epoch for Solana, so we multiply by 1000 for JS Date
  timestamp: number; 
}

interface Props {
  transactions: Transaction[];
}

// Set the initial limit for transactions to display
const INITIAL_LIMIT = 10;

export default function TransactionsTable({ transactions }: Props) {
  // State to track whether to show all transactions or just the most recent 10
  const [showAll, setShowAll] = useState(false);
  
  // Sort the transactions by timestamp once (descending for most recent)
  const sortedTransactions = useMemo(() => {
    // Sorts by timestamp in descending order (most recent first)
    return [...transactions].sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]); // Recalculate only if the 'transactions' prop changes

  // Determine which transactions to display (either limited or all)
  const transactionsToDisplay = showAll
    ? sortedTransactions
    : sortedTransactions.slice(0, INITIAL_LIMIT);

  // Check if there are more than 10 transactions to trigger the button
  const hasMoreThanLimit = sortedTransactions.length > INITIAL_LIMIT;

  // Function to toggle the display state
  const handleToggle = () => {
    setShowAll(prev => !prev);
  };

  // Helper function to format the timestamp
  const formatDate = (timestamp: number) => {
    // Solana timestamps are usually in seconds, so multiply by 1000 for JS
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Description</th>
            <th className="text-left p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {/* Map over the controlled list: transactionsToDisplay */}
          {transactionsToDisplay.map(tx => (
            <tr key={tx.signature} className="border-b hover:bg-gray-50">
              <td className="p-2">{tx.type}</td>
              <td className="p-2">{tx.category}</td>
              <td className="p-2">{tx.description || "-"}</td>
              <td className="p-2">{formatDate(tx.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* The "Show More/Show Less" Button */}
      {hasMoreThanLimit && (
        <div className="pt-4 text-center">
          <button
            onClick={handleToggle}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {showAll ? "Show Less" : `Show More (${sortedTransactions.length - INITIAL_LIMIT} Hidden)`}
          </button>
        </div>
      )}
    </div>
  );
}