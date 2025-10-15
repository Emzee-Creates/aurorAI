export const mockPortfolio = {
  totalValue: 12500.23,
  positions: [
    { symbol: 'SOL', amount: 12.3, usdValue: 2100.11, apy: 5.1, risk: 62 },
    { symbol: 'USDC', amount: 5000, usdValue: 5000.0, apy: 4.2, risk: 5 },
    { symbol: 'mSOL', amount: 7.2, usdValue: 1400.5, apy: 7.8, risk: 70 },
    { symbol: 'jlp-SOL/USDC', amount: 23, usdValue: 4000.62, apy: 18.5, risk: 72 },
  ]
}

export const mockRecs = [
  {
    id: 'rec1',
    name: 'Balanced Yield',
    description: 'Blend of SOL staking, mSOL, and stable lending',
    targetApy: 9.2,
    estRisk: 48,
    allocations: [
      { symbol: 'SOL', weight: 0.25 },
      { symbol: 'mSOL', weight: 0.25 },
      { symbol: 'USDC', weight: 0.50 },
    ]
  },
  {
    id: 'rec2',
    name: 'Aggro LP',
    description: 'Leans into SOL/USDC concentrated liquidity',
    targetApy: 16.7,
    estRisk: 74,
    allocations: [
      { symbol: 'jlp-SOL/USDC', weight: 0.60 },
      { symbol: 'SOL', weight: 0.25 },
      { symbol: 'USDC', weight: 0.15 },
    ]
  }
]

export const mockBacktest = Array.from({ length: 60 }, (_, i) => ({
  x: `T${i}`,
  y: 100 * (1 + 0.001 * i + Math.sin(i / 7) * 0.02),
}))
