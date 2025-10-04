import { useState, useMemo } from "react";

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

const INITIAL_LIMIT = 10;

export default function TokenOverviewTable({ tokens }: Props) {
  const [showAll, setShowAll] = useState(false);

  const sortedTokens = useMemo(() => {
    return [...tokens].sort((a, b) => b.valueUSD - a.valueUSD);
  }, [tokens]);

  const tokensToDisplay = showAll
    ? sortedTokens
    : sortedTokens.slice(0, INITIAL_LIMIT);

  const hasMoreThanLimit = sortedTokens.length > INITIAL_LIMIT;

  return (
    <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        Token Balances
      </h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-gray-600">
            <th className="text-left p-2">Token</th>
            <th className="text-right p-2">Amount</th>
            <th className="text-right p-2">Value (USD)</th>
          </tr>
        </thead>
        <tbody>
          {tokensToDisplay.map((token) => (
            <tr
              key={token.mint}
              className="border-b hover:bg-gray-50 transition"
            >
              <td className="p-2 font-medium">{token.symbol}</td>
              <td className="p-2 text-right">
                {token.balance.toLocaleString("en-US", {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4,
                })}
              </td>
              <td className="p-2 text-right text-green-600 font-medium">
                ${token.valueUSD.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
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
              : `Show More (${sortedTokens.length - INITIAL_LIMIT} Hidden)`}
          </button>
        </div>
      )}
    </div>
  );
}
