interface YieldCardProps {
  apy: number;
  yieldValue: number;
  yieldUsd: number;
}

export default function YieldCard({ apy, yieldValue, yieldUsd }: YieldCardProps) {
  const safeApy = apy ? (apy * 100).toFixed(2) : "0.00";
  const safeYield = yieldValue ? yieldValue.toFixed(4) : "0.0000";
  const safeYieldUsd = yieldUsd ? yieldUsd.toFixed(2) : "0.00";

  return (
    <div className="bg-white p-6 rounded-2xl shadow text-center">
      <h3 className="text-lg font-bold mb-2">Staking Yield</h3>
      <p className="text-gray-600">APY: {safeApy}%</p>
      <p className="text-gray-600">
        Annual Yield: {safeYield} SOL (~${safeYieldUsd})
      </p>
    </div>
  );
}
