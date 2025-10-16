import React from "react";
import { useUIStore } from "@/lib/store";

export default function Settings() {
  const baseCurrency = useUIStore((s) => s.baseCurrency);
  const setBaseCurrency = useUIStore((s) => s.setBaseCurrency);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="text-sm text-slate-400">Preferences</div>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-slate-300">Base Currency</label>
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as any)}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="USD">USD</option>
            <option value="USDC">USDC (1:1 USD)</option>
            <option value="NGN">NGN (Nigerian Naira)</option>
          </select>
          <div className="text-xs text-slate-400">Selected currency will update Dashboard values.</div>
        </div>
      </div>
    </div>
  );
}
