interface RiskyAsset {
    mint: string;
    symbol: string;
    balance: number;
    price: number;
    valueUSD: number;
    percentage: number;
    isHighRisk: boolean;
  }
  
  interface RiskSummaryCardProps {
    concentrationRisk?: {
      status?: "High Risk" | "Low Risk"; // Use union type for stricter status
      message?: string;
      riskyAssets?: RiskyAsset[];
    };
    solStakingAnalysis?: {
      yield?: number;
      yieldUsd?: number;
      volatility?: number;
      riskLevel?: "High" | "Medium" | "Low"; // Use union type for stricter risk level
      apy?: number;
      summary?: string;
    };
  }
  
  // Helper function to map risk status to color classes
  const getStatusColor = (status: string | undefined): string => {
    switch (status) {
      case "High Risk":
      case "High":
        return "text-red-600 font-bold";
      case "Medium":
        return "text-yellow-600 font-bold";
      case "Low Risk":
      case "Low":
        return "text-green-600 font-bold";
      default:
        return "text-gray-500";
    }
  };
  
  
  export default function RiskSummaryCard({ concentrationRisk, solStakingAnalysis }: RiskSummaryCardProps) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow space-y-6">
        <h3 className="text-xl font-extrabold text-gray-800 border-b pb-2">Risk Summary</h3>
  
        {/* --- Concentration Risk Section --- */}
        {concentrationRisk && (
          <div className="space-y-2">
              <h4 className="font-semibold text-base text-gray-900 border-b border-gray-100 pb-1">Concentration</h4>
            {concentrationRisk.status && (
              <p className="text-gray-700">
                <strong>Status:</strong> 
                <span className={`ml-1 ${getStatusColor(concentrationRisk.status)}`}>
                   {concentrationRisk.status}
                </span>
              </p>
            )}
            {concentrationRisk.message && (
              <p className="text-gray-600 text-sm italic border-l-2 border-gray-300 pl-2">
                  {concentrationRisk.message}
              </p>
            )}
  
            {concentrationRisk.riskyAssets && concentrationRisk.riskyAssets.length > 0 && (
              <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-800">High-Risk Assets:</h4>
                <ul className="list-disc ml-5 text-sm">
                  {concentrationRisk.riskyAssets.map((asset) => (
                    <li key={asset.mint}>
                      {asset.symbol} — 
                      {asset.percentage
                        ? <span className="font-medium">{` ${(asset.percentage * 100).toFixed(2)}%`}</span>
                        : " N/A"} of portfolio
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
  
        {/* --- Staking Analysis Section --- */}
        {solStakingAnalysis && (
          <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-base text-gray-900 border-b border-gray-100 pb-1">SOL Staking</h4>
  
            {solStakingAnalysis.riskLevel && (
              <p className="text-gray-700">
                <strong>Risk Level:</strong> 
                <span className={`ml-1 ${getStatusColor(solStakingAnalysis.riskLevel)}`}>
                  {solStakingAnalysis.riskLevel}
                </span>
              </p>
            )}
  
            {typeof solStakingAnalysis.apy === "number" && (
              <p className="text-gray-700">
                <strong>APY:</strong> 
                <span className="font-medium ml-1">
                  {(solStakingAnalysis.apy * 100).toFixed(2)}%
                </span>
              </p>
            )}
            
            {typeof solStakingAnalysis.volatility === "number" && (
              <p className="text-gray-700">
                <strong>Volatility:</strong> 
                <span className="font-medium ml-1">
                  {solStakingAnalysis.volatility.toFixed(2)}
                </span>
              </p>
            )}
  
            {solStakingAnalysis.yield !== undefined && solStakingAnalysis.yieldUsd !== undefined && (
              <p className="text-gray-700">
                <strong>Estimated Yield:</strong> 
                <span className="font-medium ml-1">
                  {solStakingAnalysis.yield.toFixed(4)} SOL (${solStakingAnalysis.yieldUsd.toFixed(2)})
                </span>
              </p>
            )}
  
            {solStakingAnalysis.summary && (
              <p className="text-gray-600 mt-2 text-sm italic border-l-2 border-gray-300 pl-2">
                  {solStakingAnalysis.summary}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }