// src/components/AssetYieldCard.tsx

interface AssetYieldCardProps {
  title: string;          // e.g., "SOL Staking" or "USDC Swapped"
  symbol: string;         // e.g., "SOL" or "USDC"
  apy: number;
  yieldValue: number;
  yieldUsd: number;
  
  // ⭐ THE FIX: ADDING THE REQUIRED 'details' PROP
  details: string;        // e.g., "Projected yield on swapping 13.8 SOL to USDC."

  // Optional props
  riskLevel?: string; 
  isRecommended?: boolean; // Highlight the better option
}

export default function AssetYieldCard({ 
  title, 
  symbol, 
  apy, 
  yieldValue, 
  yieldUsd,
  riskLevel,
  isRecommended = false,
  details, // ⭐ Destructure the new prop
}: AssetYieldCardProps) {
  
  const safeApy = apy ? (apy * 100).toFixed(2) : "0.00";
  const safeYield = yieldValue ? yieldValue.toFixed(4) : "0.0000";
  const safeYieldUsd = yieldUsd ? yieldUsd.toFixed(2) : "0.00";

  const cardClasses = `p-6 rounded-2xl shadow-lg transition-all duration-300 
    ${isRecommended 
      ? 'bg-green-50 border-2 border-green-500 scale-[1.02]' 
      : 'bg-white border border-gray-200'
    }`;
  
  const titleColor = isRecommended ? 'text-green-700' : 'text-gray-800';

  return (
      <div className={cardClasses}>
          <h3 className={`text-xl font-extrabold mb-3 ${titleColor}`}>
              {title} 
              {isRecommended && <span className="ml-2 text-sm bg-green-500 text-white px-2 py-0.5 rounded-full">✨ Recommended</span>}
          </h3>
          
          <div className="space-y-2 text-left">
              {/* APY */}
              <p className="text-gray-600 font-semibold flex justify-between">
                  <span className="text-sm text-gray-500">Current APY:</span> 
                  <span className="text-lg text-indigo-600 font-bold">{safeApy}%</span>
              </p>

              {/* Annual Yield (Token) */}
              <p className="text-gray-600 font-semibold flex justify-between border-t pt-2 mt-2">
                  <span className="text-sm text-gray-500">Annual Yield:</span> 
                  <span className="text-lg font-bold">
                      {safeYield} {symbol}
                  </span>
              </p>
              
              {/* Estimated USD Yield */}
              <p className="text-gray-600 font-semibold flex justify-between">
                  <span className="text-sm text-gray-500">Est. USD Yield:</span> 
                  <span className="text-xl text-green-700 font-extrabold">
                      ${safeYieldUsd}
                  </span>
              </p>

              {/* Risk Level */}
              {riskLevel && (
                  <p className="text-gray-600 flex justify-between border-t pt-2">
                      <span className="text-sm text-gray-500">Risk Level:</span>
                      <span className={`font-semibold ${riskLevel === 'High' ? 'text-red-500' : riskLevel === 'Moderate' ? 'text-yellow-600' : 'text-green-500'}`}>
                          {riskLevel}
                      </span>
                  </p>
              )}

              {/* ⭐ NEW: Details/Context */}
              <p className="text-xs text-gray-400 mt-4 pt-2 border-t border-dashed">
                  {details}
              </p>
          </div>
      </div>
  );
}