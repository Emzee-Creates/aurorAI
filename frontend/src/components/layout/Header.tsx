import { Wallet } from "lucide-react";
import { useWalletContext } from "../../context/WalletContext";

export default function Header() {
  const { walletAddress, setWalletAddress, clearWallet } = useWalletContext();

  return (
    <header className="flex justify-between items-center bg-white shadow p-4">
      <h1 className="text-xl font-bold text-green-600">aurorAI yield and risk optimizer</h1>

      <div className="flex items-center gap-4">
        {/* If wallet is connected */}
        {walletAddress ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
            <button
              onClick={clearWallet}
              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
            >
              Disconnect
            </button>
          </div>
        ) : (
          // If no wallet connected
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter wallet address"
              onChange={(e) => setWalletAddress(e.target.value)}
              className="p-2 border rounded text-sm"
            />
            <button
              className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
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
