import React, { createContext, useContext, useState } from "react";

interface WalletContextType {
  walletAddress: string;
  setWalletAddress: (address: string) => void;
  clearWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState("");

  const clearWallet = () => setWalletAddress("");

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress, clearWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
};
