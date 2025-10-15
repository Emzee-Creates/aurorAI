import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UIState = {
  baseCurrency: 'USD' | 'NGN' | 'USDC'
  riskTolerance: number // 0..100
  setBaseCurrency: (c: UIState['baseCurrency']) => void
  setRiskTolerance: (v: number) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      baseCurrency: 'USD',
      riskTolerance: 50,
      setBaseCurrency: (c) => set({ baseCurrency: c }),
      setRiskTolerance: (v) => set({ riskTolerance: v }),
    }),
    { name: 'ui-store' }
  )
)
