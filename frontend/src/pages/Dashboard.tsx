import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../api/client'
import { StatCard, Spinner, Badge } from '../components/ui'
import { fmt, STATUS_COLORS, STATUS_LABELS } from '../utils'
import { useAuthStore } from '../store/auth'
import { ArrowRight, Package, Scissors, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.overview().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const totalRevenue = (data?.revenueSplit?.products || 0) + (data?.revenueSplit?.services || 0)
  const revTotal = totalRevenue || 1 // avoid div/0
  const productPct = Math.round(((data?.revenueSplit?.products || 0) / revTotal) * 100)
  const servicePct = 100 - productPct

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-gray-400 text-sm">{greeting()},</p>
        <h1 className="font-display text-2xl font-bold text-white">{user?.name} ✨</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="This Month" value={fmt.currency(data?.thisMonth?.revenue || 0)} sub="Revenue" color="brand" />
        <StatCard label="Net Profit" value={fmt.currency(data?.thisMonth?.profit || 0)} sub="This month" color="green" />
        <StatCard label="Expenses" value={fmt.currency(data?.thisMonth?.expenses || 0)} sub="This month" color="red" />
        <StatCard label="Active Orders" value={String(data?.activeOrders || 0)} sub="In progress" color="gold" />
        <StatCard label="Customers" value={String(data?.totalCustomers || 0)} sub="All time" color="blue" />
      </div>

      {/* Investment Recovery */}
      {data?.investmentRecovery?.totalInvested > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Investment Recovery</h2>
            <Link to="/earnings" className="text-brand-400 text-xs flex items-center gap-1">
              Details <ArrowRight size={12} />
            </Link>
          </div>
          <div className="card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/40 border border-emerald-800/40 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">
                    {data.investmentRecovery.breakEven ? '✅ Break-even reached!' : 'Recovery Progress'}
                  </span>
                  <span className={`font-semibold ${data.investmentRecovery.breakEven ? 'text-emerald-400' : 'text-white'}`}>
                    {data.investmentRecovery.recoveryPct}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${data.investmentRecovery.breakEven ? 'bg-emerald-500' : 'bg-brand-500'}`}
                    style={{ width: `${data.investmentRecovery.recoveryPct}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-800">
              <div>
                <p className="text-xs text-gray-500">Total Invested</p>
                <p className="text-sm font-semibold text-white">{fmt.currency(data.investmentRecovery.totalInvested)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">All-time Profit</p>
                <p className={`text-sm font-semibold ${data.investmentRecovery.allTimeProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt.currency(data.investmentRecovery.allTimeProfit)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue split */}
      {totalRevenue > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Revenue Split</h2>
          <div className="card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-900/40 border border-brand-800/40 flex items-center justify-center flex-shrink-0">
                <Scissors size={14} className="text-brand-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Services</span>
                  <span className="text-white font-medium">{fmt.currency(data?.revenueSplit?.services || 0)}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${servicePct}%` }} />
                </div>
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{servicePct}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-900/40 border border-amber-800/40 flex items-center justify-center flex-shrink-0">
                <Package size={14} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Products</span>
                  <span className="text-white font-medium">{fmt.currency(data?.revenueSplit?.products || 0)}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${productPct}%` }} />
                </div>
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{productPct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/orders/new" className="card hover:border-brand-700 transition-colors flex flex-col gap-2">
            <span className="text-2xl">🛍️</span>
            <span className="text-sm font-medium text-white">New Order</span>
            <span className="text-xs text-gray-500">Services or products</span>
          </Link>
          <Link to="/customers/new" className="card hover:border-brand-700 transition-colors flex flex-col gap-2">
            <span className="text-2xl">👤</span>
            <span className="text-sm font-medium text-white">New Customer</span>
            <span className="text-xs text-gray-500">Add customer profile</span>
          </Link>
        </div>
      </div>

      {/* Recent orders */}
      {data?.recentOrders?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Recent Orders</h2>
            <Link to="/orders" className="text-brand-400 text-xs flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentOrders.map((o: any) => {
              const itemSummary = o.items?.length
                ? o.items.slice(0, 2).map((i: any) => i.name).join(', ') + (o.items.length > 2 ? ` +${o.items.length - 2}` : '')
                : 'No items'
              return (
                <Link key={o.id} to={`/orders/${o.id}`} className="card hover:border-gray-700 transition-colors flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{o.customer?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{itemSummary} · {fmt.date(o.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                    <span className="text-xs text-gray-400">{fmt.currency(o.totalAmount)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Status breakdown */}
      {data?.statusBreakdown?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Order Status</h2>
          <div className="card space-y-2">
            {data.statusBreakdown.map((s: any) => (
              <div key={s.status} className="flex items-center justify-between">
                <Badge className={STATUS_COLORS[s.status]}>{STATUS_LABELS[s.status] || s.status}</Badge>
                <span className="text-sm font-semibold text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
