export type RiskMetric = {
  volatility: number
  drawdown: number
  sharpe: number
  var95: number
}

export type AssetPosition = {
  symbol: string
  amount: number
  usdValue: number
  apy?: number
  risk?: number
}

export type Recommendation = {
  id: string
  name: string
  description: string
  targetApy: number
  estRisk: number
  allocations: { symbol: string; weight: number }[]
}

export type BacktestPoint = { x: string; y: number }
