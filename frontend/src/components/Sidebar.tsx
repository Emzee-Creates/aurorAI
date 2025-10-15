import { NavLink } from 'react-router-dom'
import { Gauge, SlidersHorizontal, Settings, Beaker } from 'lucide-react'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/optimizer', label: 'Optimizer', icon: SlidersHorizontal },
  { to: '/strategies', label: 'Strategies', icon: Beaker },
  { to: '/backtest', label: 'Backtest', icon: Gauge },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="sticky top-[65px] h-[calc(100vh-65px)] w-60 border-r border-slate-800 bg-slate-900 p-4">
      <nav className="space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ' +
              (isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60')
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
