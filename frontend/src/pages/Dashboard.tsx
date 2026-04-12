import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../api/client'
import { StatCard, Spinner, Badge } from '../components/ui'
import { fmt, STATUS_COLORS, STATUS_LABELS, ORDER_TYPE_LABELS, ORDER_TYPE_COLORS } from '../utils'
import { useAuthStore } from '../store/auth'
import { ArrowRight, TrendingUp, AlertCircle } from 'lucide-react'

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

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-gray-400 text-sm">{greeting()},</p>
        <h1 className="font-display text-2xl font-bold text-white">{user?.name} ✨</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="This Month" value={fmt.currency(data?.thisMonthRevenue || 0)} sub="Revenue" color="brand" />
        <StatCard label="Net Profit" value={fmt.currency(data?.thisMonthProfit || 0)} sub="This month" color="green" />
        <StatCard label="Active Orders" value={String(data?.activeOrders || 0)} sub="In progress" color="gold" />
        <StatCard label="Total Clients" value={String(data?.totalClients || 0)} sub="All time" color="blue" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/orders/new" className="card hover:border-brand-700 transition-colors flex flex-col gap-2">
            <span className="text-2xl">🥻</span>
            <span className="text-sm font-medium text-white">New Order</span>
            <span className="text-xs text-gray-500">Add saree order</span>
          </Link>
          <Link to="/clients/new" className="card hover:border-brand-700 transition-colors flex flex-col gap-2">
            <span className="text-2xl">👤</span>
            <span className="text-sm font-medium text-white">New Client</span>
            <span className="text-xs text-gray-500">Add client profile</span>
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
            {data.recentOrders.map((o: any) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="card hover:border-gray-700 transition-colors flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{o.client?.name}</p>
                  <p className="text-xs text-gray-500">{ORDER_TYPE_LABELS[o.type]} · {fmt.date(o.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                  <span className="text-xs text-gray-400">{fmt.currency(o.priceCharged)}</span>
                </div>
              </Link>
            ))}
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
                <Badge className={STATUS_COLORS[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                <span className="text-sm font-semibold text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
