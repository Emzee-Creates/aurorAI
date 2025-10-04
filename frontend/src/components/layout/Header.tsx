import { Wallet } from "lucide-react";
import { useWalletContext } from "../../context/WalletContext";

export default function Header() {
  const { walletAddress, setWalletAddress, clearWallet } = useWalletContext();

  return (
    <header className="flex justify-between items-center bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow p-4">
      <h1 className="text-xl font-bold tracking-wide">
        aurorAI • Yield & Risk Optimizer
      </h1>

      <div className="flex items-center gap-4">
        {walletAddress ? (
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
            <span className="text-sm font-medium">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
            <button
              onClick={clearWallet}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-sm"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter wallet address"
              onChange={(e) => setWalletAddress(e.target.value)}
              className="p-2 border rounded text-sm text-gray-700"
            />
            <button
              className="flex items-center gap-2 bg-white text-green-700 px-3 py-1 rounded-lg hover:bg-gray-100 text-sm font-medium"
              onClick={() => {
                if (!walletAddress.trim()) return;
              }}
            >
              <Wallet size={18} />
              Connect
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
