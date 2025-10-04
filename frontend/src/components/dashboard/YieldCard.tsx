interface YieldCardProps {
  solBalance: number; // pass in wallet SOL balance
  solPrice: number;   // pass in current SOL price in USD
}

export default function YieldCard({ solBalance, solPrice }: YieldCardProps) {
  // Hardcoded APY
  const apy = 7.35;

  // Calculate expected yield
  const yieldSol = (solBalance * apy) / 100;
  const yieldUsd = yieldSol * solPrice;

  return (
    <div className="bg-white p-6 rounded-2xl shadow text-center">
      <h3 className="text-lg font-bold mb-2">Staking Yield</h3>
      <p className="text-gray-600">APY: {apy.toFixed(2)}%</p>
      <p className="text-gray-600">
        Annual Yield: {yieldSol.toFixed(4)} SOL (~${yieldUsd.toFixed(2)})
      </p>
    </div>
  );
}
