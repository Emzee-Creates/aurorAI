// src/pages/YieldOptimizerPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
// 🛑 REMOVED: import { useWallet } from '@solana/wallet-adapter-react'; 
// 🛑 REMOVED: import { PublicKey } from '@solana/web3.js'; 

// ✅ NEW: Import your custom wallet context hook
import { useWalletContext } from '../context/WalletContext'; 

// FIX 2: Use 'import type' for external types
import type { 
    YieldOptimizationData, 
    QuoteResponse, 
} from '../api/yield'; 

import { 
    fetchYieldOptimizationData, 
    executeSwapTransaction, 
} from '../api/yield'; // Keep normal import for functions

import AssetYieldCard from '../components/yield/AssetYieldCard'; 

// FIX 3: Define explicit interface for TransactionModal props
interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    serializedTx: string | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, serializedTx }) => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Confirm Swap</h2>
            {serializedTx ? (
                <>
                    <p className="mb-4">
                        A transaction is ready. Please **sign the transaction** in your wallet to execute the swap.
                    </p>
                    {/* ⚠️ IMPORTANT: The actual signing logic is now dependent on how 
                       you implement wallet connection/signing within your custom context/app structure.
                    */}
                    <div className="text-xs text-gray-500 break-words max-h-20 overflow-y-scroll p-2 bg-gray-100 rounded">
                        Transaction Data: {serializedTx.substring(0, 100)}...
                    </div>
                </>
            ) : (
                <p>Preparing transaction...</p>
            )}
            
            <button 
                onClick={onClose} 
                className="mt-6 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Close
            </button>
        </div>
    </div>
);


export default function YieldOptimizerPage() {
    // 🛑 CHANGE: Use the custom context hook to get walletAddress
    const { walletAddress } = useWalletContext(); 

    // 🛑 REMOVED: const { publicKey } = useWallet(); 
    // 🛑 REMOVED: const walletAddress = publicKey?.toBase58();

    const [data, setData] = useState<YieldOptimizationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSwapping, setIsSwapping] = useState(false);
    const [showTxModal, setShowTxModal] = useState(false);
    const [serializedTransaction, setSerializedTransaction] = useState<string | null>(null);

    useEffect(() => {
        if (!walletAddress) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                setIsLoading(true);
                const result = await fetchYieldOptimizationData(walletAddress);
                setData(result);
            } catch (error) {
                console.error("Failed to load yield data:", error);
                setData(null);
            } finally {
                setIsLoading(false);
            }
        };

        // Reset data when walletAddress changes (or is set)
        setData(null); 
        loadData();
    }, [walletAddress]);


    // --- Comparison and Recommendation Logic ---
    const { solYieldUsd, usdcYieldUsd, recommendedOption, swapQuote } = useMemo(() => {
        const solYield = data?.solStaking.yieldUsd || 0;
        const usdcYield = data?.swapOptimization.usdcYield?.projectedUsdYield || 0;
        const quote = data?.swapOptimization.swapQuote;

        let recommendation: 'SOL' | 'USDC' | 'None' = 'None';
        if (solYield > usdcYield) {
            recommendation = 'SOL';
        } else if (usdcYield > solYield && usdcYield > 0) {
            recommendation = 'USDC';
        }

        return { 
            solYieldUsd: solYield, 
            usdcYieldUsd: usdcYield, 
            recommendedOption: recommendation,
            swapQuote: quote,
        };
    }, [data]);
    

    // --- Swap Execution Handler ---
    const handleExecuteSwap = async (route: QuoteResponse) => {
        // ⚠️ NOTE: We can no longer check for 'publicKey' object existence here
        if (!walletAddress) { 
            alert('Wallet address is missing. Please connect your wallet.');
            return;
        }

        try {
            setIsSwapping(true);
            
            // 1. Get the serialized transaction from the backend
            const txResponse = await executeSwapTransaction(route, walletAddress);
            
            // 2. Pass the serialized transaction to the modal for signing
            setSerializedTransaction(txResponse.swapTransaction);
            setShowTxModal(true);

        } catch (error) {
            console.error("Error initiating swap:", error);
            alert("Failed to create swap transaction. Check console for details.");
        } finally {
            setIsSwapping(false);
        }
    };


    if (!walletAddress) {
        // The display now relies entirely on a connected address being set in your context
        return <div className="p-8 text-center text-gray-700">Please **connect your wallet** to analyze yield opportunities.</div>;
    }

    if (isLoading) {
        return <div className="p-8 text-center text-gray-700">Loading yield optimization data...</div>;
    }

    if (!data || data.solBalance === 0) {
        return <div className="p-8 text-center text-gray-700">No **SOL** found in wallet. Add SOL to enable yield analysis.</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Yield Optimization Analyzer 🧠</h1>
            <p className="text-gray-600 mb-8">Compare potential annual returns from staking SOL vs. swapping SOL to USDC and earning yield.</p>

            <div className="grid md:grid-cols-2 gap-8">
                
                {/* 1. SOL Staking Card */}
                <AssetYieldCard 
                    title="Current SOL Staking Yield"
                    symbol="SOL"
                    apy={data.solStaking.apy}
                    yieldValue={data.solStaking.yield}
                    yieldUsd={data.solStaking.yieldUsd}
                    riskLevel={data.solStaking.riskLevel}
                    isRecommended={recommendedOption === 'SOL'}
                />

                {/* 2. USDC Swap/Yield Card */}
                <AssetYieldCard 
                    title="USDC Swap Yield Opportunity"
                    symbol="USDC"
                    apy={data.swapOptimization.usdcYield?.apy || 0}
                    yieldValue={data.swapOptimization.quotedUsdcAmount} 
                    yieldUsd={data.swapOptimization.usdcYield?.projectedUsdYield || 0}
                    riskLevel="Low (Stablecoin)"
                    isRecommended={recommendedOption === 'USDC'}
                />

            </div>
            
            <hr className="my-10 border-gray-300" />

            {/* 3. Action Section */}
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Optimization Action</h2>
                
                {recommendedOption === 'USDC' && swapQuote && (
                    <>
                        <p className="text-lg text-green-700 mb-4 font-medium">
                            Recommendation: Swapping to USDC is estimated to yield **${(usdcYieldUsd - solYieldUsd).toFixed(2)}** more annually.
                        </p>
                        <button 
                            onClick={() => handleExecuteSwap(swapQuote)}
                            disabled={isSwapping}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 shadow-md"
                        >
                            {isSwapping ? 'Preparing Swap...' : 'Execute SOL to USDC Swap'}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Powered by Jupiter Aggregator</p>
                    </>
                )}
                
                {recommendedOption === 'SOL' && (
                    <>
                        <p className="text-lg text-blue-700 mb-4 font-medium">
                            Recommendation: Keeping and staking your SOL is the optimal yield option.
                        </p>
                        <button 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
                        >
                            Go To SOL Staking Page
                        </button>
                    </>
                )}

                {/* Transaction Modal */}
                <TransactionModal 
                    isOpen={showTxModal} 
                    onClose={() => setShowTxModal(false)} 
                    serializedTx={serializedTransaction} 
                />
            </div>
        </div>
    );
}