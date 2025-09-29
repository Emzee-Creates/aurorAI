// src/api/risk.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export type RiskSimResponse = {
  // backend returns normalized weights + var/cvar or similar keys
  weights?: number[];
  var?: number;    // value at risk (might be negative)
  cvar?: number;   // conditional VaR
  // allow for additional fields
  [k: string]: any;
};

export async function simulateRisk(
  series: number[][],
  weights: number[],
  confidence = 0.95
): Promise<RiskSimResponse> {
  const payload = { series, weights, confidence };
  const res = await axios.post(`${BASE_URL}/risk/simulate`, payload, {
    timeout: 60000,
  });
  return res.data;
}
