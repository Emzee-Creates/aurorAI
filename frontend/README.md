# AI Risk + Yield Optimizer — Frontend

React + TypeScript + Vite + Tailwind starter focused on the UI for an AI-driven risk & yield optimizer (Solana DeFi + Analytics track).

## Quickstart
```bash
npm install
npm run dev
```

## Tech
- React + Vite + TS
- TailwindCSS
- React Router
- TanStack Query
- Zustand
- Recharts
- Axios

## API Contracts (to wire later)
- `GET /portfolio` → `{ totalValue: number, positions: { symbol, amount, usdValue, apy?, risk? }[] }`
- `GET /optimizer/recommendations?risk=0..100` → `Recommendation[]`
- `POST /optimizer/simulate` body: `{ allocations, start, end }` → `{ equityCurve: {x,y}[], risk: {volatility, drawdown, sharpe, var95} }`

Until the backend is ready, the UI uses simple mocks in `src/lib/mock.ts`.
