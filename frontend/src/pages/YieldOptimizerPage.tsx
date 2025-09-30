// src/pages/YieldOptimizerPage.tsx

import React, { useState, useEffect, useMemo } from 'react';

// === LAYOUT IMPORTS (NEW) ===
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
// ============================

// ✅ Import your custom wallet context hook
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
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Confirm Swap</h2>
            {serializedTx ? (
                <>
                    <p className="mb-4 text-gray-600">
                        A transaction is ready. Please **sign the transaction** in your wallet to execute the swap.
                    </p>
                    <div className="text-xs text-gray-500 break-words max-h-20 overflow-y-scroll p-2 bg-gray-100 rounded">
                        Transaction Data: {serializedTx.substring(0, 100)}...
                    </div>
                </>
            ) : (
                <p className="text-gray-600">Preparing transaction...</p>
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
    const { walletAddress } = useWalletContext(); 

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

        setData(null); 
        loadData();
    }, [walletAddress]);


    // --- Comparison and Recommendation Logic ---
    const { solYieldUsd, usdcYieldUsd, recommendedOption, swapQuote } = useMemo(() => {
        const solYield = data?.solStaking.yieldUsd || 0;
        const usdcYield = data?.swapOptimization.usdcYield?.projectedUsdYield || 0;
        const quote = data?.swapOptimization.swapQuote;

        let recommendation: 'SOL' | 'USDC' | 'None' = 'None';
        // Note: Logic ensures USDC must be strictly greater and positive to be recommended
        if (solYield > usdcYield) {
            recommendation = 'SOL';
        } else if (usdcYield > solYield && usdcYield > 0) {
            recommendation = 'USDC';
        } else if (solYield > 0) {
             // Default to SOL if yields are zero or near-equal, but SOL has a base yield
             recommendation = 'SOL';
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
        if (!walletAddress) { 
            alert('Wallet address is missing. Please connect your wallet.');
            return;
        }

        try {
            setIsSwapping(true);
            const txResponse = await executeSwapTransaction(route, walletAddress);
            setSerializedTransaction(txResponse.swapTransaction);
            setShowTxModal(true);

        } catch (error) {
            console.error("Error initiating swap:", error);
            alert("Failed to create swap transaction. Check console for details.");
        } finally {
            setIsSwapping(false);
        }
    };


    // --- Dynamic Content Rendering ---
    let mainContent;

    if (!walletAddress) {
        mainContent = <div className="p-8 text-center text-gray-700">Please **connect your wallet** to analyze yield opportunities.</div>;
    } else if (isLoading) {
        mainContent = <div className="p-8 text-center text-gray-700">Loading yield optimization data...</div>;
    } else if (!data || data.solBalance === 0) {
        mainContent = <div className="p-8 text-center text-gray-700">No **SOL** found in wallet. Add SOL to enable yield analysis.</div>;
    } else {
        mainContent = (
            <div className="max-w-6xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold mb-2 text-gray-800">Yield Optimization Analyzer 🧠</h1>
                <p className="text-gray-600 mb-8">Compare potential annual returns from staking SOL vs. swapping SOL to USDC and earning yield.</p>

                <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* 1. SOL Staking Card */}
                    <AssetYieldCard 
                        title="Current SOL Staking Yield"
                        symbol="SOL"
                        apy={data.solStaking.apy}
                        yieldValue={data.solBalance} // Using solBalance for yieldValue
                        yieldUsd={data.solStaking.yieldUsd}
                        riskLevel={data.solStaking.riskLevel}
                        isRecommended={recommendedOption === 'SOL'}
                        details={`Analysis based on your current ${data.solBalance.toFixed(4)} SOL balance.`}
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
                        details={`Projected yield if ${data.solBalance.toFixed(4)} SOL were swapped to USDC.`}
                    />
                </div>
                
                <hr className="my-8 border-gray-200" />

                {/* 3. Action Section */}
                <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 text-center">
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
                            <p className="text-lg text-indigo-700 mb-4 font-medium">
                                Recommendation: Keeping and staking your SOL is the optimal yield option.
                            </p>
                            <button 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
                            >
                                Go To SOL Staking Page
                            </button>
                        </>
                    )}
                </div>

                {/* Transaction Modal */}
                <TransactionModal 
                    isOpen={showTxModal} 
                    onClose={() => setShowTxModal(false)} 
                    serializedTx={serializedTransaction} 
                />
            </div>
        );
    }


    // --- Final Render with Dashboard Layout ---
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-col flex-1">
                <Header />

                <main className="p-6 space-y-6 bg-gray-50 flex-1">
                    {mainContent}
                </main>

                <Footer />
            </div>
        </div>
    );
}