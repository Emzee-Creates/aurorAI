interface YieldCardProps {
  apy: number | null | undefined;
  yieldValue: number | null | undefined;
  yieldUsd: number | null | undefined;
}

export default function YieldCard({ apy, yieldValue, yieldUsd }: YieldCardProps) {
  const safeApy =
    apy !== null && apy !== undefined ? (apy * 100).toFixed(2) : "0.00";

  const safeYield =
    yieldValue !== null && yieldValue !== undefined ? yieldValue.toFixed(4) : "0.0000";

  const safeYieldUsd =
    yieldUsd !== null && yieldUsd !== undefined ? yieldUsd.toFixed(2) : "0.00";

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
