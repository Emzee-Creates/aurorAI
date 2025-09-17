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
            metrics: { 
                totalTransactions: 0,
                swapCount: 0,
                nftCount: 0,
                defiCount: 0,
                stakingCount: 0,
                uniquePrograms: 0
            }
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
        // Collect all unique program IDs involved in the transaction
        tx.instructions.forEach((ix: any) => {
            if (ix.programId) {
                metrics.uniquePrograms.add(ix.programId);
            }
        });

        // Use the API's 'category' field for reliable, broad classification
        const category = tx.category.toUpperCase();

        if (category === "DEX_SWAP") {
            metrics.swapCount++;
            metrics.defiCount++;
        } else if (category.includes("NFT")) { // Covers NFT_MINT, NFT_SALE, etc.
            metrics.nftCount++;
        } else if (category.includes("STAKE")) { // Covers STAKE_DELEGATE, STAKE_DEACTIVATION
            metrics.stakingCount++;
        } else if (category.includes("DEFI")) { // Covers LOAN, BORROW, LIQUIDITY, etc.
            metrics.defiCount++;
        }
    });

    const uniqueProgramsCount = metrics.uniquePrograms.size;

    // --- Determine User Profile based on metrics ---
    let profile = "Default User";
    
    // Prioritize specific profiles first
    if (metrics.defiCount > 0 || metrics.stakingCount > 0) {
        profile = "DeFi Participant";
    }
    if (metrics.swapCount >= 5) {
        profile = "Active Trader";
    }
    if (metrics.uniquePrograms.size > 10) {
        profile = "Degen Explorer";
    }
    if (metrics.nftCount > 0) {
        profile = "NFT Collector";
    }
    if (metrics.totalTransactions > 0 && metrics.totalTransactions <= 5 && metrics.defiCount === 0 && metrics.swapCount === 0 && metrics.nftCount === 0) {
         profile = "Long-term Holder";
    }


    return {
        profile,
        metrics: {
            totalTransactions: metrics.totalTransactions,
            swapCount: metrics.swapCount,
            nftCount: metrics.nftCount,
            defiCount: metrics.defiCount,
            stakingCount: metrics.stakingCount,
            uniquePrograms: uniqueProgramsCount,
        }
    };
}