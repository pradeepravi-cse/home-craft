import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { customersApi, referralBonusApi } from '../api/client'
import { PageHeader, Spinner, Empty } from '../components/ui'
import { fmt } from '../utils'
import { Crown, Gift, Users, TrendingUp, ShoppingBag, ChevronRight, ArrowLeft, Star } from 'lucide-react'

export default function Customer360Page() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [bonusConfig, setBonusConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    referralBonusApi.active()
      .catch(() => null)
      .then(bc => {
        setBonusConfig(bc)
        const referralsRequired = bc?.referralsRequired ?? 1
        return Promise.all([
          customersApi.get(id!),
          customersApi.referralStats(id!, referralsRequired),
        ])
      })
      .then(([c, s]) => {
        setCustomer(c)
        setStats(s)
        setLoading(false)
      })
      .catch(() => setLoading(false))
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

  const { availableCredits, referralBonusUsed, totalReferrals, totalRevenueFromReferrals } = stats
  const referralsRequired = bonusConfig?.referralsRequired ?? 1
  const nextCreditAt = referralsRequired - (totalReferrals % referralsRequired)
  const progressToNext = totalReferrals % referralsRequired

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

      {/* Referral reward status */}
      {bonusConfig ? (
        <div className="mx-4 mb-4 rounded-xl border px-4 py-3 space-y-2
          bg-amber-900/10 border-amber-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift size={15} className="text-amber-400" />
              <span className="text-sm font-medium text-amber-300">{bonusConfig.name}</span>
            </div>
            {availableCredits > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {availableCredits} available
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {referralsRequired === 1
              ? 'Every referral earns 1 reward.'
              : `Every ${referralsRequired} referrals earn 1 reward.`}{' '}
            {referralBonusUsed > 0 && `${referralBonusUsed} used so far.`}
          </p>
          {/* Progress bar toward next credit */}
          {nextCreditAt !== referralsRequired && (
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{progressToNext}/{referralsRequired} toward next reward</span>
                <span>{nextCreditAt} more needed</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${(progressToNext / referralsRequired) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-4 mb-4 rounded-xl border border-gray-800 px-4 py-3 flex items-center gap-2">
          <Gift size={14} className="text-gray-600" />
          <p className="text-xs text-gray-500">No referral program configured.{' '}
            <Link to="/referral-program" className="text-brand-400 hover:text-brand-300">Set one up →</Link>
          </p>
        </div>
      )}

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
            <p className="text-xl font-bold text-emerald-400">{totalReferrals}</p>
            <p className="text-xs text-gray-500">Referred</p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{fmt.currency(totalRevenueFromReferrals)}</p>
            <p className="text-xs text-gray-500">Network Revenue</p>
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
          Referred Customers ({totalReferrals})
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
              .map((r: any, idx: number) => (
                <Link key={r.id} to={`/customers/${r.id}`} className="card flex items-center gap-3 hover:border-gray-700 transition-colors">
                  <div className="relative w-9 h-9 flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 font-bold text-sm">
                      {r.name[0].toUpperCase()}
                    </div>
                    {idx === 0 && totalReferrals > 1 && r.totalSpent > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-600 flex items-center justify-center">
                        <Star size={8} className="text-white" />
                      </div>
                    )}
                    {r.isPrivileged && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                        <Crown size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.name}</p>
                    <span className="flex items-center gap-0.5 text-xs text-gray-500">
                      <ShoppingBag size={10} /> {r.orderCount} orders
                    </span>
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
      {totalReferrals > 0 && (
        <div className="px-4 mb-6">
          <div className="card bg-brand-900/10 border-brand-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingUp size={12} /> Network Value
            </p>
            <p className="text-sm text-gray-300">
              {customer.name}'s network has generated{' '}
              <span className="text-brand-300 font-semibold">{fmt.currency(totalRevenueFromReferrals)}</span>{' '}
              across <span className="text-white font-semibold">{totalReferrals}</span> customer{totalReferrals !== 1 ? 's' : ''}.
              {totalRevenueFromReferrals > 0 && (
                <span className="text-gray-500">
                  {' '}Avg {fmt.currency(totalRevenueFromReferrals / totalReferrals)} per referral.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
