interface Metrics {
  totalTransactions?: number;
  swapCount?: number;
  nftCount?: number;
  defiCount?: number;
  stakingCount?: number;
  uniquePrograms?: number;
}

interface ActivityProfileCardProps {
  profile?: string;
  metrics?: Metrics;
}

export default function ActivityProfileCard({ profile, metrics }: ActivityProfileCardProps) {
  // Provide fallback default metrics if undefined
  const safeMetrics: Metrics = metrics || {
    totalTransactions: 0,
    swapCount: 0,
    nftCount: 0,
    defiCount: 0,
    stakingCount: 0,
    uniquePrograms: 0,
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h3 className="text-lg font-bold mb-4">Wallet Activity Profile</h3>

      {/* Safely show profile */}
      <p className="mb-4">
        <strong>Profile:</strong> {profile || "Unknown"}
      </p>

      <div className="grid grid-cols-2 gap-4 text-gray-700">
        <p><strong>Total Transactions:</strong> {safeMetrics.totalTransactions}</p>
        <p><strong>Swaps:</strong> {safeMetrics.swapCount}</p>
        <p><strong>NFTs:</strong> {safeMetrics.nftCount}</p>
        <p><strong>DeFi:</strong> {safeMetrics.defiCount}</p>
        <p><strong>Staking:</strong> {safeMetrics.stakingCount}</p>
        <p><strong>Unique Programs:</strong> {safeMetrics.uniquePrograms}</p>
      </div>
    </div>
  );
}
