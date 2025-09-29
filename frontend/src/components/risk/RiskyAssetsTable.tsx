interface RiskyAsset {
    mint: string;
    symbol: string;
    balance: number;
    price: number;
    valueUSD: number;
    percentage: number;
    isHighRisk: boolean;
  }
  
  interface RiskyAssetsTableProps {
    assets: RiskyAsset[];
  }
  
  export default function RiskyAssetsTable({ assets }: RiskyAssetsTableProps) {
    if (!assets || assets.length === 0) {
      return (
        <div className="bg-white p-6 rounded-2xl shadow mt-4">
          <h3 className="text-lg font-bold mb-4">High-Risk Assets</h3>
          <p className="text-gray-500 italic">No assets exceed the portfolio concentration risk threshold (25%).</p>
        </div>
      );
    }
  
    // Use toLocaleString for better number formatting
    const formatNumber = (num: number, decimalPlaces: number = 2) => 
      num.toLocaleString("en-US", { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
  
    return (
      <div className="bg-white p-6 rounded-2xl shadow mt-4">
        <h3 className="text-lg font-bold mb-4 text-red-700">High-Risk Assets</h3>
        <table className="min-w-full text-sm">
          <thead className="border-b bg-red-50"> {/* Highlight the header */}
            <tr>
              <th className="p-2 text-left">Symbol</th>
              <th className="p-2 text-right">Balance</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Value (USD)</th>
              <th className="p-2 text-right">Portfolio %</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.mint} className="border-b hover:bg-red-50/50">
                <td className="p-2 font-medium text-left">{asset.symbol}</td>
                {/* Use formatNumber and right alignment for consistency */}
                <td className="p-2 text-right">{formatNumber(asset.balance, 4)}</td> 
                <td className="p-2 text-right">${formatNumber(asset.price, 4)}</td>
                <td className="p-2 text-right font-semibold">${formatNumber(asset.valueUSD, 2)}</td>
                <td className="p-2 text-right font-bold text-red-600">
                    {formatNumber(asset.percentage * 100, 2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }