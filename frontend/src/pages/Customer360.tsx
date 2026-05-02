import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { customersApi } from '../api/client'
import { PageHeader, Spinner, Empty } from '../components/ui'
import { fmt } from '../utils'
import { Crown, Gift, Users, TrendingUp, ShoppingBag, ChevronRight, ArrowLeft } from 'lucide-react'

export default function Customer360Page() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      customersApi.get(id!),
      customersApi.referralStats(id!),
    ]).then(([c, s]) => {
      setCustomer(c)
      setStats(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner />
  if (!customer || !stats) {
    return (
      <div>
        <PageHeader title="Customer 360" />
        <Empty icon={<Users size={40} />} message="Could not load customer data" />
      </div>
    )
  }

  const customerOrders = customer.orders ?? []
  const completedOrders = customerOrders.filter((o: any) => o.status === 'COMPLETED')
  const totalSpent = completedOrders.reduce((s: number, o: any) => s + Number(o.totalAmount), 0)

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Link to={`/customers/${id}`} className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-lg font-bold text-white flex items-center gap-2">
            {customer.name}
            {customer.isPrivileged && <Crown size={15} className="text-amber-400" />}
          </h1>
          <p className="text-xs text-gray-500">Customer 360 · Referral Network</p>
        </div>
      </div>

      {/* Personal stats */}
      <div className="px-4 mb-4 grid grid-cols-2 gap-2">
        <div className="card py-3 text-center">
          <p className="text-xl font-bold text-white">{customerOrders.length}</p>
          <p className="text-xs text-gray-500">Own Orders</p>
        </div>
        <div className="card py-3 text-center">
          <p className="text-xl font-bold text-brand-400">{fmt.currency(totalSpent)}</p>
          <p className="text-xs text-gray-500">Own Spend</p>
        </div>
      </div>

      {/* Referral network stats */}
      <div className="px-4 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Referral Network</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="card py-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{stats.totalReferrals}</p>
            <p className="text-xs text-gray-500">Customers Referred</p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{fmt.currency(stats.totalRevenueFromReferrals)}</p>
            <p className="text-xs text-gray-500">Revenue from Network</p>
          </div>
        </div>
      </div>

      {/* Referred by */}
      {stats.referredBy && (
        <div className="px-4 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Introduced By</h2>
          <Link to={`/customers/${stats.referredBy.id}/360`} className="card flex items-center gap-3 hover:border-gray-700 transition-colors">
            <div className="w-9 h-9 rounded-full bg-brand-900/40 border border-brand-800/50 flex items-center justify-center text-brand-300 font-bold">
              {stats.referredBy.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{stats.referredBy.name}</p>
              {stats.referredBy.phone && <p className="text-xs text-gray-500">{stats.referredBy.phone}</p>}
            </div>
            <ChevronRight size={14} className="text-gray-600" />
          </Link>
        </div>
      )}

      {/* People this customer referred */}
      <div className="px-4 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Referred Customers ({stats.referrals.length})
        </h2>

        {stats.referrals.length === 0 ? (
          <div className="card text-center py-8">
            <Users size={28} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No referrals yet</p>
            <p className="text-xs text-gray-600 mt-1">
              When adding a new customer, select {customer.name} as their referral source.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.referrals
              .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
              .map((r: any) => (
                <Link key={r.id} to={`/customers/${r.id}`} className="card flex items-center gap-3 hover:border-gray-700 transition-colors">
                  <div className="relative w-9 h-9 flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 font-bold text-sm">
                      {r.name[0].toUpperCase()}
                    </div>
                    {r.isPrivileged && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                        <Crown size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-white truncate">{r.name}</p>
                      {r.referralBenefitPending && (
                        <span className="flex items-center gap-0.5 text-xs bg-emerald-900/40 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-800/50 flex-shrink-0">
                          <Gift size={9} /> Benefit
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-xs text-gray-500">
                        <ShoppingBag size={10} /> {r.orderCount} orders
                      </span>
                      {r.referralBenefitUsedAt && (
                        <span className="text-xs text-gray-600">Benefit used {fmt.date(r.referralBenefitUsedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-brand-300">{fmt.currency(r.totalSpent)}</span>
                    <span className="flex items-center gap-0.5 text-xs text-gray-600">
                      <TrendingUp size={9} /> spent
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* Value insight */}
      {stats.referrals.length > 0 && (
        <div className="px-4 mb-6">
          <div className="card bg-brand-900/10 border-brand-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingUp size={12} /> Network Value
            </p>
            <p className="text-sm text-gray-300">
              {customer.name}'s referral network has generated{' '}
              <span className="text-brand-300 font-semibold">{fmt.currency(stats.totalRevenueFromReferrals)}</span>{' '}
              in revenue across{' '}
              <span className="text-white font-semibold">{stats.totalReferrals}</span>{' '}
              customer{stats.totalReferrals !== 1 ? 's' : ''}.
              {stats.totalRevenueFromReferrals > 0 && (
                <span className="text-gray-500">
                  {' '}Average {fmt.currency(stats.totalRevenueFromReferrals / stats.totalReferrals)} per referral.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
