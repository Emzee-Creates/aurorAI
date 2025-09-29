interface VaRAnalysis {
  status: "High" | "Medium" | "Low";
  message: string;
  vaRValueUSD: number;
  // NOTE: If you need to show the assets used for the calculation, 
  // the backend must return the `balances` array as well.
}

interface Props {
// 💡 Updated to reflect the backend's VaRAnalysis output
vaRData: VaRAnalysis;
// We'll pass the confidence and time horizon down from the parent component
confidence: number;
timeHorizonDays: number; 
}

// Helper to map status to Tailwind color for visual emphasis
const statusColors: Record<string, string> = {
  "High": "text-red-600",
  "Medium": "text-yellow-600",
  "Low": "text-green-600",
};

export default function RiskResultsCard({ vaRData, confidence, timeHorizonDays }: Props) {

// Safely grab the required properties
const { status, message, vaRValueUSD } = vaRData;
const statusColor = statusColors[status] || "text-gray-600";

return (
  <div className="bg-white p-6 rounded-2xl shadow">
    <h2 className="text-lg font-bold mb-4">Portfolio VaR Analysis</h2>
    
    {/* Risk Status */}
    <p className="mb-2">
      Risk Status: <span className={`font-bold ${statusColor}`}>{status}</span>
    </p>

    {/* VaR Value */}
    <p className="mb-2">
      Value at Risk (VaR): <span className="font-bold text-red-600">
          ${vaRValueUSD.toFixed(2)}
      </span>
    </p>
    
    {/* Calculation Details */}
    <p className="mb-4 text-sm text-gray-600">
      Time Horizon: <span className="font-medium">{timeHorizonDays} day(s)</span>
      {' | '}
      Confidence: <span className="font-medium">{(confidence * 100).toFixed(1)}%</span>
    </p>
    
    <h3 className="mt-4 text-sm font-bold">Risk Message:</h3>
    <p className="text-sm border-l-4 border-gray-200 pl-2 italic">
      {message}
    </p>
    
    {/* NOTE: The "Normalized Weights" section has been removed because 
      the new backend VaR calculation does not return asset-specific weights.
    */}
    
  </div>
);
}