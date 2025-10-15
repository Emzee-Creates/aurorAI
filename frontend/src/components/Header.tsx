import { Brain } from 'lucide-react'
import ConnectWalletButton from './ConnectWalletButton'

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-brand-400" />
          <span className="text-lg font-semibold tracking-tight">AI Risk + Yield Optimizer</span>
        </div>
        <div className="flex items-center gap-3">
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  )
}
