import { useState, useMemo } from "react";

interface Transaction {
  description: string;
  type: string;
  category: string;
  signature: string;
  timestamp: number;
}

interface Props {
  transactions: Transaction[];
}

const INITIAL_LIMIT = 10;

export default function TransactionsTable({ transactions }: Props) {
  const [showAll, setShowAll] = useState(false);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);

  const transactionsToDisplay = showAll
    ? sortedTransactions
    : sortedTransactions.slice(0, INITIAL_LIMIT);

  const hasMoreThanLimit = sortedTransactions.length > INITIAL_LIMIT;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        Recent Transactions
      </h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-gray-600">
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Description</th>
            <th className="text-left p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactionsToDisplay.map((tx) => (
            <tr
              key={tx.signature}
              className="border-b hover:bg-gray-50 transition"
            >
              <td className="p-2 font-medium">{tx.type}</td>
              <td className="p-2">{tx.category}</td>
              <td className="p-2 text-gray-600">{tx.description || "-"}</td>
              <td className="p-2 text-gray-500">{formatDate(tx.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMoreThanLimit && (
        <div className="pt-4 text-center">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {showAll
              ? "Show Less"
              : `Show More (${sortedTransactions.length - INITIAL_LIMIT} Hidden)`}
          </button>
        </div>
      )}
    </div>
  );
}
