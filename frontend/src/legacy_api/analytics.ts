import axios from "axios";

const API_BASE_URL = "https://aurorai.onrender.com"; 

/**
 * Fetch wallet analytics from backend
 * @param walletAddress string
 * @returns wallet analytics data
 */
export async function getWalletAnalytics(walletAddress: string) {
  if (!walletAddress) {
    throw new Error("Wallet address is required");
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/analytics/${walletAddress}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching wallet analytics:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch wallet analytics."
    );
  }
}
