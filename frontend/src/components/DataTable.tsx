type Column<T> = { key: keyof T; header: string; format?: (v: any, row: T) => React.ReactNode }
type Props<T> = { columns: Column<T>[]; rows: T[] }

export default function DataTable<T>({ columns, rows }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900">
          <tr>
            {columns.map(c => (
              <th key={String(c.key)} className="px-4 py-2 text-left text-xs font-semibold text-slate-300">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-900/60">
              {columns.map(c => (
                <td key={String(c.key)} className="whitespace-nowrap px-4 py-2 text-sm text-slate-200">
                  {c.format ? c.format((r as any)[c.key], r) : String((r as any)[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
