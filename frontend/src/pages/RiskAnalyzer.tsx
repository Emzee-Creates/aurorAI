// --- File: src/pages/RiskAnalyzer.tsx ---
import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import RiskSummaryCard from "../components/risk/RiskSummaryCard";
import YieldCard from "../components/dashboard/YieldCard";
import RiskyAssetsTable from "../components/risk/RiskyAssetsTable";
import ActivityProfileCard from "../components/user/ActivityProfileCard";
import { getWalletAnalytics } from "../api/analytics";
import { useWalletContext } from "../context/WalletContext";

export default function RiskAnalyzer() {
  const { walletAddress } = useWalletContext();

  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    async function loadRiskData() {
      try {
        setLoading(true);
        setError(null);

        const analytics = await getWalletAnalytics(walletAddress);
        console.log("Wallet analytics fetched:", analytics);

        setWalletData(analytics);
      } catch (err) {
        console.error("Error loading risk data:", err);
        setError("Failed to load risk data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadRiskData();
  }, [walletAddress]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />

        <main className="p-6 space-y-6 bg-gray-50 flex-1">
          {/* Loading and error states */}
          {loading && <div className="p-4 text-center">Loading risk data...</div>}
          {error && <div className="p-4 text-center text-red-600">{error}</div>}

          {!walletAddress && !loading && (
            <div className="p-4 text-center text-gray-600">
              Please connect a wallet to analyze risk.
            </div>
          )}

          {/* Main content */}
          {!loading && walletAddress && walletData && (
            <>
              {/* Top Section: Risk Summary + Yield Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(walletData?.concentrationRisk || walletData?.solStakingAnalysis) && (
                  <RiskSummaryCard
                    concentrationRisk={walletData?.concentrationRisk}
                    solStakingAnalysis={walletData?.solStakingAnalysis}
                  />
                )}

                {/* ✅ Updated YieldCard usage */}
                <YieldCard
                  solBalance={walletData.solBalance || 0}
                  solPrice={walletData.solStakingAnalysis?.currentPriceUSD || 0}
                />
              </div>

              {/* Risky Assets Table */}
              {walletData.concentrationRisk?.riskyAssets?.length > 0 && (
                <RiskyAssetsTable assets={walletData.concentrationRisk.riskyAssets} />
              )}

              {/* User Behavior Section */}
              {walletData.userBehavior?.metrics && (
                <ActivityProfileCard
                  profile={walletData.userBehavior.profile}
                  metrics={walletData.userBehavior.metrics}
                />
              )}
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
