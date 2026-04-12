import { useEffect, useState } from 'react'
import { earningsApi } from '../api/client'
import { StatCard, Spinner } from '../components/ui'
import { fmt } from '../utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#c026d3', '#f59e0b', '#10b981']

export default function EarningsPage() {
  const [summary, setSummary] = useState<any>(null)
  const [monthly, setMonthly] = useState<any[]>([])
  const [byType, setByType] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    Promise.all([
      earningsApi.summary(),
      earningsApi.monthly(year),
      earningsApi.byType(),
    ]).then(([s, m, t]) => {
      setSummary(s); setMonthly(m); setByType(t)
    }).finally(() => setLoading(false))
  }, [year])

  if (loading) return <Spinner />

  const typeData = byType.map((t: any) => ({
    name: t.type === 'pre_pleating' ? 'Pre-Pleat' : t.type === 'draping' ? 'Draping' : 'Combo',
    value: parseFloat(t.revenue) || 0,
    count: parseInt(t.count),
  }))

  return (
    <div className="pb-6">
      <div className="px-4 pt-5 pb-3">
        <h1 className="font-display text-2xl font-bold text-white">Earnings</h1>
        <p className="text-sm text-gray-400">Financial overview</p>
      </div>

      {/* All-time summary */}
      <div className="px-4 mb-5 grid grid-cols-2 gap-3">
        <StatCard label="Total Revenue" value={fmt.currency(summary?.totalRevenue || 0)} color="brand" />
        <StatCard label="Net Profit" value={fmt.currency(summary?.netProfit || 0)} color="green" />
        <StatCard label="This Month" value={fmt.currency(summary?.thisMonth?.revenue || 0)} sub="Revenue" color="gold" />
        <StatCard label="This Month" value={fmt.currency(summary?.thisMonth?.profit || 0)} sub="Profit" color="blue" />
      </div>

      {/* Monthly chart */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Monthly ({year})</h2>
          <select
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300"
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="card p-3">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e5e7eb' }}
                formatter={(v: any) => [`RM ${Number(v).toFixed(2)}`, '']}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#c026d3" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by type */}
      {typeData.length > 0 && (
        <div className="px-4 mb-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Revenue by Type</h2>
          <div className="card flex items-center gap-4">
            <PieChart width={120} height={120}>
              <Pie data={typeData} dataKey="value" cx={55} cy={55} innerRadius={30} outerRadius={55}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {typeData.map((t, i) => (
                <div key={t.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-300">{t.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{fmt.currency(t.value)}</p>
                    <p className="text-xs text-gray-500">{t.count} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly table */}
      <div className="px-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Monthly Breakdown</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 text-xs text-gray-500 font-medium">Month</th>
                <th className="text-right py-2 text-xs text-gray-500 font-medium">Revenue</th>
                <th className="text-right py-2 text-xs text-gray-500 font-medium">Expenses</th>
                <th className="text-right py-2 text-xs text-gray-500 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {monthly.filter(m => m.orderCount > 0).map(m => (
                <tr key={m.month} className="border-b border-gray-800/50">
                  <td className="py-2 text-gray-300">{m.month}</td>
                  <td className="py-2 text-right text-white">{fmt.currency(m.revenue)}</td>
                  <td className="py-2 text-right text-red-400">{fmt.currency(m.expenses)}</td>
                  <td className={`py-2 text-right font-medium ${m.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt.currency(m.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
