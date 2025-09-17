// --- File: src/services/behavior.ts ---

/**
 * Analyzes a user's transaction history to classify their on-chain behavior.
 * @param {Array<object>} transactions An array of Helius classified transactions.
 * @returns {object} A behavior analysis object with a profile and metrics.
 */
export function classifyUserBehavior(transactions: any[]): { profile: string, metrics: { [key: string]: number } } {
  if (!transactions || transactions.length === 0) {
      return {
          profile: "Inactive",
          metrics: { totalTransactions: 0 }
      };
  }

  let metrics = {
      totalTransactions: transactions.length,
      swapCount: 0,
      nftCount: 0,
      defiCount: 0,
      stakingCount: 0,
      uniquePrograms: new Set<string>()
  };

  transactions.forEach(tx => {
      // Count unique programs the user interacted with
      if (tx.account_info?.length > 0) {
          tx.account_info.forEach((info: any) => {
              if (info.is_signer === false && info.program_id) {
                  metrics.uniquePrograms.add(info.program_id);
              }
          });
      }
      
      // Count swaps
      const isSwap = tx.instructions.some((ix: any) => 
          ix.program_id === "9XngA73vW9Xk5J26Q69dD3n53yv9M5dE3J5p9" // Example: Jupiter Swap Program ID
      );
      if (isSwap) {
          metrics.swapCount++;
      }

      // Count NFT activity (mint, trade)
      const isNftTx = tx.type === "NFT_MINT" || tx.type === "NFT_SALE";
      if (isNftTx) {
          metrics.nftCount++;
      }

      // Count DeFi interactions (lending, borrowing, etc.)
      const isDeFi = tx.type === "LOAN" || tx.type === "UNLOAN" || tx.type === "BORROW" || tx.type === "UNBORROW";
      if (isDeFi) {
          metrics.defiCount++;
      }

      // Count staking interactions (this is a simple example)
      if (tx.type === "STAKE_DELEGATE") {
          metrics.stakingCount++;
      }
  });

  // --- Determine User Profile based on metrics ---
  let profile = "Default User";
  if (metrics.defiCount > 0 || metrics.stakingCount > 0) {
      profile = "DeFi Participant";
  }
  if (metrics.swapCount > 5) { // Arbitrary threshold
      profile = "Active Trader";
  }
  if (metrics.totalTransactions > 0 && metrics.totalTransactions < 5 && metrics.defiCount === 0 && metrics.swapCount === 0) {
      profile = "Long-term Holder";
  }
  if (metrics.uniquePrograms.size > 10) { // Arbitrary threshold for diversity
      profile = "Degen Explorer";
  }

  return {
      profile,
      metrics: {
          totalTransactions: metrics.totalTransactions,
          swapCount: metrics.swapCount,
          nftCount: metrics.nftCount,
          defiCount: metrics.defiCount,
          stakingCount: metrics.stakingCount,
          uniquePrograms: metrics.uniquePrograms.size,
      }
  };
}