import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";
import PortfolioValueCard from "../components/dashboard/PortfolioValueCard";
import TokenOverviewTable from "../components/dashboard/TokenOverviewTable";
import TransactionsTable from "../components/dashboard/TransactionsTable";


import YieldCard from "../components/dashboard/YieldCard";
import RiskSummaryCard from "../components/risk/RiskSummaryCard";
import RiskyAssetsTable from "../components/risk/RiskyAssetsTable";
import ActivityProfileCard from "../components/user/ActivityProfileCard";

import { getWalletAnalytics } from "../api/analytics";
import { useWalletContext } from "../context/WalletContext";

export default function Dashboard() {
  const { walletAddress } = useWalletContext();

  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load data whenever wallet address changes
  useEffect(() => {
    if (!walletAddress) return;

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch wallet analytics from backend
        const analytics = await getWalletAnalytics(walletAddress);
        setWalletData(analytics);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError("Failed to load dashboard data. Please check the wallet address.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [walletAddress]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />

        <main className="p-6 space-y-6 bg-gray-50 flex-1">

          {loading && <div className="p-4 text-center">Loading...</div>}
          {error && <div className="p-4 text-center text-red-600">{error}</div>}

          {!loading && !error && walletData && (
            <>
              {/* --- Top Section --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Portfolio Total Value */}
                <PortfolioValueCard value={walletData.totalPortfolioValueUSD} />

                {/* Yield / APY */}
                <YieldCard
                  solBalance={walletData?.solBalance || 0} 
                  solPrice={walletData?.solPriceUSD || 0}
                />

                {/* Risk Summary */}
                {(walletData?.concentrationRisk || walletData?.solStakingAnalysis) && (
  <RiskSummaryCard
    concentrationRisk={walletData?.concentrationRisk}
    solStakingAnalysis={walletData?.solStakingAnalysis}
  />
)}

              </div>

              {/* --- Risky Assets --- */}
              {walletData.riskyAssets && walletData.riskyAssets.length > 0 && (
                <RiskyAssetsTable assets={walletData.riskyAssets} />
              )}

              {/* --- Token Balances --- */}
              <TokenOverviewTable tokens={walletData.balances} />

              {/* --- Transactions --- */}
              <TransactionsTable transactions={walletData.transactions} />

              {/* --- Activity Profile --- */}
              <ActivityProfileCard
                profile={walletData.userBehavior.profile}
                metrics={walletData.userBehavior.metrics}
              />
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
