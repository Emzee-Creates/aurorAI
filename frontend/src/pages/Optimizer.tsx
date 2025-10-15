import { useState } from 'react'
import DataTable from '@/components/DataTable'
import ChartCard from '@/components/ChartCard'
import { mockRecs } from '@/lib/mock'
import { useUIStore } from '@/lib/store'

export default function Optimizer() {
  const [selected, setSelected] = useState(0)
  const risk = useUIStore(s => s.riskTolerance)
  const setRisk = useUIStore(s => s.setRiskTolerance)

  const rec = mockRecs[selected]

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Risk Tolerance</div>
            <div className="text-2xl font-semibold">{risk}/100</div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
            className="w-80"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 text-sm text-slate-400">Recommended Strategies</div>
          <div className="space-y-2">
            {mockRecs.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setSelected(i)}
                className={`w-full rounded-md border px-3 py-2 text-left transition ${
                  selected === i ? 'border-brand-500 bg-slate-800' : 'border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-slate-400">{r.description}</div>
                <div className="mt-1 text-sm text-slate-300">
                  Target APY: <span className="font-semibold">{r.targetApy}%</span> ·
                  Est. Risk: <span className="font-semibold">{r.estRisk}/100</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 text-sm text-slate-400">Allocation</div>
          <DataTable
            columns={[
              { key: 'symbol', header: 'Asset' },
              { key: 'weight', header: 'Weight', format: v => `${(v * 100).toFixed(0)}%` },
            ]}
            rows={rec.allocations}
          />
          <div className="mt-4">
            <ChartCard
              title="Projected Growth (mock)"
              data={Array.from({ length: 30 }, (_, i) => ({
                x: i + 1,
                y: 100 * (1 + i * (rec.targetApy / 100) / 12)
              }))}
            />
          </div>
          <div className="mt-4">
            <button className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500">Simulate</button>
            <button className="ml-2 rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Execute via Wallet</button>
          </div>
        </div>
      </div>
    </div>
  )
}
