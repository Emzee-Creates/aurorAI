import { LineChart, Line, Tooltip, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts'

type Props = {
  title: string
  data: { x: string | number; y: number }[]
  yLabel?: string
}
export default function ChartCard({ title, data, yLabel }: Props) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-2 text-sm text-slate-400">{title}</div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="y" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
