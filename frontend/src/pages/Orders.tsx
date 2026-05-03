import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ordersApi, customersApi, servicesApi, expensesApi, measurementsApi, referralBonusApi } from '../api/client'
import { PageHeader, Empty, Spinner, Badge, Modal, Field, ConfirmDialog } from '../components/ui'
import { fmt, tat, STATUS_COLORS, STATUS_LABELS, NEXT_STATUS, NEXT_STATUS_LABEL, EXPENSE_CATEGORY_LABELS, ORDER_STATUSES } from '../utils'
import toast from 'react-hot-toast'
import { Plus, ShoppingBag, Trash2, Edit2, CheckCircle, Scissors, Package, ChevronRight, X, Ruler, Clock, Gift, Crown } from 'lucide-react'

// ─── Orders List ──────────────────────────────────────────────────────────────
export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = (status?: string) =>
    ordersApi.list(status ? { status } : {}).then(setOrders).finally(() => setLoading(false))

  useEffect(() => { load(filter || undefined) }, [filter])

  if (loading) return <Spinner />

  const tabs = [
    ['', 'All'],
    ['PENDING', 'Pending'],
    ['IN_PROGRESS', 'In Progress'],
    ['READY', 'Ready'],
    ['COMPLETED', 'Done'],
  ]

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total`}
        action={<Link to="/orders/new" className="btn-primary flex items-center gap-1.5 text-sm"><Plus size={16} /> New</Link>}
      />

      <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === v ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <Empty icon={<ShoppingBag size={40} />} message="No orders found"
          action={<Link to="/orders/new" className="btn-primary text-sm">Add first order</Link>} />
      ) : (
        <div className="px-4 md:px-6">
          {/* Table — md and up */}
          <div className="hidden md:block rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Items</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">TAT</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {orders.map(o => {
                  const serviceCount = o.items?.filter((i: any) => i.type === 'SERVICE').length || 0
                  const productCount = o.items?.filter((i: any) => i.type === 'PRODUCT').length || 0
                  return (
                    <tr key={o.id} className="bg-gray-900 hover:bg-gray-800/60 transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/orders/${o.id}`}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-white group-hover:text-brand-300 transition-colors">{o.customer?.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {serviceCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-brand-400">
                              <Scissors size={11} /> {serviceCount}
                            </span>
                          )}
                          {productCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-amber-400">
                              <Package size={11} /> {productCount}
                            </span>
                          )}
                          {serviceCount === 0 && productCount === 0 && <span className="text-gray-600">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{fmt.date(o.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={10} />
                          {o.status === 'COMPLETED' || o.status === 'CANCELLED'
                            ? tat(o.createdAt, o.completedDate)
                            : `${tat(o.createdAt)} open`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">{fmt.currency(o.totalAmount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden space-y-2">
            {orders.map(o => {
              const serviceCount = o.items?.filter((i: any) => i.type === 'SERVICE').length || 0
              const productCount = o.items?.filter((i: any) => i.type === 'PRODUCT').length || 0
              return (
                <Link key={o.id} to={`/orders/${o.id}`} className="card hover:border-gray-700 transition-colors flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{o.customer?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {serviceCount > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-brand-400">
                          <Scissors size={10} /> {serviceCount}
                        </span>
                      )}
                      {productCount > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-400">
                          <Package size={10} /> {productCount}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{fmt.date(o.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                    <span className="text-xs font-medium text-white">{fmt.currency(o.totalAmount)}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                      <Clock size={9} />
                      {o.status === 'COMPLETED' || o.status === 'CANCELLED'
                        ? tat(o.createdAt, o.completedDate)
                        : `${tat(o.createdAt)} open`}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── New Order ────────────────────────────────────────────────────────────────
export function NewOrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [customers, setCustomers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [bonusConfigs, setBonusConfigs] = useState<any[]>([])
  const [selectedCustomerFull, setSelectedCustomerFull] = useState<any>(null)

  type OrderItem = {
    type: string; referenceId: string; name: string
    price: number; quantity: number
    bonusApplied?: boolean; bonusAutoAdded?: boolean
  }
  const [items, setItems] = useState<OrderItem[]>([])
  const [form, setForm] = useState({
    customerId: searchParams.get('customerId') || '',
    notes: '', scheduledDate: '',
  })
  const [addModal, setAddModal] = useState<'service' | null>(null)
  const [pendingBonus, setPendingBonus] = useState<any>(null) // config awaiting confirm
  const [pricing, setPricing] = useState<{ subtotal: number; discountAmount: number; totalAmount: number; appliedRules: string[] } | null>(null)
  const [saving, setSaving] = useState(false)
  const [measurements, setMeasurements] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      customersApi.list(),
      servicesApi.list(true),
      referralBonusApi.list().catch(() => []),
    ]).then(([c, s, bc]) => {
      setCustomers(c)
      setServices(s)
      setBonusConfigs((bc as any[]).filter((b: any) => b.isActive))
    })
  }, [])

  // Fetch full customer profile + measurements when customer changes
  useEffect(() => {
    if (!form.customerId) {
      setMeasurements([]); setSelectedCustomerFull(null); return
    }
    Promise.all([
      measurementsApi.byCustomer(form.customerId).catch(() => []),
      customersApi.get(form.customerId).catch(() => null),
    ]).then(([m, c]) => { setMeasurements(m); setSelectedCustomerFull(c) })
    // Clear bonus state when customer changes
    setItems(prev => prev
      .filter(i => !i.bonusAutoAdded) // remove auto-added bonus services
      .map(i => {
        if (!i.bonusApplied) return i
        const svc = services.find(s => s.id === i.referenceId)
        return { ...i, price: Number(svc?.basePrice ?? i.price), bonusApplied: false }
      })
    )
  }, [form.customerId])

  // Live pricing preview
  useEffect(() => {
    if (items.length === 0) { setPricing(null); return }
    const itemsPayload = items.map(i => ({
      type: i.type, referenceId: i.referenceId,
      unitPrice: i.price, quantity: i.quantity,
    }))
    import('../api/client').then(({ pricingRulesApi }) => {
      pricingRulesApi.calculate(itemsPayload).then(setPricing).catch(() => {
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
        setPricing({ subtotal, discountAmount: 0, totalAmount: subtotal, appliedRules: [] })
      })
    })
  }, [items])

  const addItem = (type: 'SERVICE' | 'PRODUCT', ref: any) => {
    const existing = items.find(i => i.referenceId === ref.id)
    if (existing) {
      setItems(prev => prev.map(i => i.referenceId === ref.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setItems(prev => [...prev, {
        type, referenceId: ref.id, name: ref.name,
        price: Number(ref.basePrice ?? ref.price), quantity: 1,
      }])
    }
    setAddModal(null)
  }

  const removeItem = (referenceId: string) => setItems(prev => prev.filter(i => i.referenceId !== referenceId))
  const changeQty = (referenceId: string, q: number) => {
    if (q < 1) return removeItem(referenceId)
    setItems(prev => prev.map(i => i.referenceId === referenceId ? { ...i, quantity: q } : i))
  }

  const applyBonus = (config: any) => {
    const svc = services.find(s => s.id === config.rewardServiceId)
    if (!svc) { toast.error('Reward service not found'); setPendingBonus(null); return }
    const alreadyInCart = items.some(i => i.referenceId === config.rewardServiceId)
    if (alreadyInCart) {
      // Zero out the existing item in-place
      setItems(prev => prev.map(i =>
        i.referenceId === config.rewardServiceId
          ? { ...i, price: 0, bonusApplied: true, bonusAutoAdded: false }
          : i
      ))
    } else {
      // Auto-add the service at RM 0
      setItems(prev => [...prev, {
        type: 'SERVICE', referenceId: svc.id, name: svc.name,
        price: 0, quantity: 1, bonusApplied: true, bonusAutoAdded: true,
      }])
    }
    setPendingBonus(null)
    toast.success(`Bonus applied — ${svc.name} is FREE`)
  }

  const removeBonus = () => {
    setItems(prev => prev
      .filter(i => !i.bonusAutoAdded) // remove auto-added entries
      .map(i => {
        if (!i.bonusApplied) return i
        const svc = services.find(s => s.id === i.referenceId)
        return { ...i, price: Number(svc?.basePrice ?? i.price), bonusApplied: false }
      })
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Add at least one item'); return }
    setSaving(true)
    try {
      const bonusItem = items.find(i => i.bonusApplied)
      const bonusOriginalPrice = bonusItem
        ? services.find(s => s.id === bonusItem.referenceId)?.basePrice
        : undefined

      const order = await ordersApi.create({
        customerId: form.customerId,
        notes: form.notes || undefined,
        scheduledDate: form.scheduledDate || undefined,
        items: items.map(i => ({
          type: i.type,
          referenceId: i.referenceId,
          quantity: i.quantity,
          ...(i.bonusApplied ? { unitPriceOverride: 0 } : {}),
        })),
        referralBonusApplied: Boolean(bonusItem),
        referralBonusValue: bonusOriginalPrice ? Number(bonusOriginalPrice) : undefined,
      })
      if (bonusItem && form.customerId) {
        await customersApi.redeemReferralBonus(form.customerId).catch(() => {})
      }
      toast.success('Order created')
      navigate(`/orders/${order.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order')
    } finally { setSaving(false) }
  }

  const hasServices = items.some(i => i.type === 'SERVICE')
  const activeMeasurement = measurements[0]
  const bonusAlreadyApplied = items.some(i => i.bonusApplied)
  const referralCount = selectedCustomerFull?.referrals?.length ?? 0
  const referralBonusUsed = selectedCustomerFull?.referralBonusUsed ?? 0

  // Per-config credit availability
  const configsWithCredits = bonusConfigs.map(bc => ({
    ...bc,
    availableCredits: Math.max(0, Math.floor(referralCount / (bc.referralsRequired ?? 1)) - referralBonusUsed),
  })).filter(bc => bc.availableCredits > 0)

  const totalAvailableCredits = configsWithCredits.reduce((s, bc) => s + bc.availableCredits, 0)

  // Filter services based on customer privilege tier
  const visibleServices = (s: any) => {
    if (!s.customerTier || s.customerTier === 'ALL') return true
    if (s.customerTier === 'PRIVILEGED') return selectedCustomerFull?.isPrivileged === true
    if (s.customerTier === 'STANDARD') return selectedCustomerFull?.isPrivileged !== true
    return true
  }

  return (
    <div>
      <PageHeader title="New Order" />
      <form onSubmit={submit} className="px-4 md:px-6 space-y-4 pb-6">

        {/* Customer */}
        <Field label="Customer *">
          <select className="input" value={form.customerId}
            onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
            <option value="">Select customer…</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.isPrivileged ? ' ★' : ''}</option>)}
          </select>
        </Field>

        {/* Customer badges */}
        {selectedCustomerFull && (
          <div className="flex flex-wrap gap-2">
            {selectedCustomerFull.isPrivileged && (
              <div className="flex items-center gap-1.5 rounded-xl bg-amber-900/20 border border-amber-800/40 px-3 py-1.5">
                <Crown size={12} className="text-amber-400" />
                <span className="text-xs text-amber-300 font-medium">Privileged — exclusive services unlocked</span>
              </div>
            )}
            {totalAvailableCredits > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl bg-brand-900/20 border border-brand-800/40 px-3 py-1.5">
                <Gift size={12} className="text-brand-400" />
                <span className="text-xs text-brand-300 font-medium">
                  {totalAvailableCredits} referral reward{totalAvailableCredits > 1 ? 's' : ''} available
                </span>
              </div>
            )}
          </div>
        )}

        {/* Referral reward picker — explicit per-config Apply buttons */}
        {!bonusAlreadyApplied && configsWithCredits.length > 0 && (
          <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Gift size={12} /> Referral Rewards — select one to apply
            </p>
            {configsWithCredits.map(bc => (
              <div key={bc.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{bc.name}</p>
                  <p className="text-xs text-gray-500">
                    Free: <span className="text-amber-400">{bc.rewardService?.name ?? '—'}</span>
                    {' · '}{bc.availableCredits} credit{bc.availableCredits > 1 ? 's' : ''} left
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingBonus(bc)}
                  className="flex-shrink-0 text-xs bg-amber-500 hover:bg-amber-400 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                  Apply
                </button>
              </div>
            ))}
          </div>
        )}
        {bonusAlreadyApplied && (
          <div className="rounded-xl bg-emerald-900/20 border border-emerald-800/40 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Gift size={14} className="text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-300 font-medium">
                Referral bonus applied — {items.find(i => i.bonusApplied)?.name} is FREE
              </p>
            </div>
            <button type="button" onClick={removeBonus} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
              Remove
            </button>
          </div>
        )}

        {/* Customer measurements */}
        {form.customerId && hasServices && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Ruler size={13} className="text-brand-400" />
              <span className="text-sm font-medium text-gray-300">Measurements</span>
            </div>
            {activeMeasurement ? (
              <div className="card bg-brand-900/10 border-brand-800/40 space-y-2">
                {activeMeasurement.label && (
                  <p className="text-xs font-medium text-brand-300">{activeMeasurement.label}</p>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {activeMeasurement.palluLength != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pallu Length</span>
                      <span className="text-white font-medium">{activeMeasurement.palluLength} {activeMeasurement.unit}</span>
                    </div>
                  )}
                  {activeMeasurement.shoulderToNavel != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shoulder to Navel</span>
                      <span className="text-white font-medium">{activeMeasurement.shoulderToNavel} {activeMeasurement.unit}</span>
                    </div>
                  )}
                  {activeMeasurement.waistToFloor != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Waist to Floor</span>
                      <span className="text-white font-medium">{activeMeasurement.waistToFloor} {activeMeasurement.unit}</span>
                    </div>
                  )}
                  {activeMeasurement.bodyWrap != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Body Wrap</span>
                      <span className="text-white font-medium">{activeMeasurement.bodyWrap} {activeMeasurement.unit}</span>
                    </div>
                  )}
                </div>
                {activeMeasurement.notes && (
                  <p className="text-xs text-gray-500 border-t border-gray-800 pt-1.5">{activeMeasurement.notes}</p>
                )}
                {measurements.length > 1 && (
                  <p className="text-xs text-gray-600">+{measurements.length - 1} more set(s) on profile</p>
                )}
              </div>
            ) : (
              <div className="card border-dashed border-gray-700 text-center py-3">
                <p className="text-xs text-gray-500">No measurements saved for this customer.</p>
                <Link to={`/customers/${form.customerId}`} className="text-xs text-brand-400 hover:text-brand-300 mt-1 inline-block">
                  Add measurements →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label">Order Items *</label>
            <button type="button" onClick={() => setAddModal('service')}
              className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 border border-brand-800/50 bg-brand-900/30 px-2 py-1 rounded-lg transition-colors">
              <Scissors size={11} /> Add Service
            </button>
          </div>

          {items.length === 0 ? (
            <div className="card border-dashed text-center py-8 text-gray-500 text-sm">
              No items yet — add a service above
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.referenceId} className={`card flex items-center gap-3 ${item.bonusApplied ? 'border-amber-800/50 bg-amber-900/10' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bonusApplied ? 'bg-amber-900/40' : item.type === 'SERVICE' ? 'bg-brand-900/40' : 'bg-amber-900/40'}`}>
                    {item.bonusApplied ? <Gift size={13} className="text-amber-400" />
                      : item.type === 'SERVICE' ? <Scissors size={13} className="text-brand-400" />
                      : <Package size={13} className="text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.name}</p>
                    {item.bonusApplied
                      ? <p className="text-xs text-amber-400 font-medium">FREE · Referral Bonus</p>
                      : <p className="text-xs text-gray-500">{fmt.currency(item.price)} each</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => changeQty(item.referenceId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-gray-700 text-white text-sm flex items-center justify-center hover:bg-gray-600">−</button>
                    <span className="text-sm text-white w-4 text-center">{item.quantity}</span>
                    <button type="button" onClick={() => changeQty(item.referenceId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-gray-700 text-white text-sm flex items-center justify-center hover:bg-gray-600">+</button>
                  </div>
                  <span className={`text-sm font-medium w-16 text-right ${item.bonusApplied ? 'text-amber-400' : 'text-white'}`}>
                    {item.bonusApplied ? 'FREE' : fmt.currency(item.price * item.quantity)}
                  </span>
                  <button type="button" onClick={() => removeItem(item.referenceId)} className="text-gray-600 hover:text-red-400 ml-1"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing summary */}
        {pricing && items.length > 0 && (
          <div className="card bg-gray-900/60">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span><span>{fmt.currency(pricing.subtotal)}</span>
              </div>
              {pricing.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount {pricing.appliedRules.length > 0 && `(${pricing.appliedRules.join(', ')})`}</span>
                  <span>−{fmt.currency(pricing.discountAmount)}</span>
                </div>
              )}
              {bonusAlreadyApplied && (
                <div className="flex justify-between text-amber-400">
                  <span>Referral bonus</span><span>applied</span>
                </div>
              )}
              <div className="flex justify-between text-white font-semibold pt-1.5 border-t border-gray-800">
                <span>Total</span><span>{fmt.currency(pricing.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Schedule & Notes */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Scheduled Date">
            <input type="date" className="input" value={form.scheduledDate}
              onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea className="input" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Any special instructions…" />
        </Field>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creating…' : 'Create Order'}
          </button>
        </div>
      </form>

      {/* Add Service Modal */}
      <Modal open={addModal === 'service'} onClose={() => setAddModal(null)} title="Add Service">
        <div className="space-y-2">
          {services
            .filter(s => !items.find(i => i.referenceId === s.id))
            .filter(visibleServices)
            .map(s => (
              <button key={s.id} onClick={() => addItem('SERVICE', s)}
                className="w-full card hover:border-brand-700 transition-colors flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                  <Scissors size={14} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    {s.customerTier === 'PRIVILEGED' && <Crown size={11} className="text-amber-400" />}
                  </div>
                  {s.description && <p className="text-xs text-gray-500 truncate">{s.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{s.isOptional ? 'Add-on' : 'Required'}</p>
                </div>
                <span className="text-sm font-semibold text-brand-300">{fmt.currency(s.basePrice)}</span>
              </button>
            ))}
          {services.filter(s => !items.find(i => i.referenceId === s.id)).filter(visibleServices).length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No services available for this customer</p>
          )}
        </div>
      </Modal>

      {/* Bonus confirm dialog */}
      <Modal open={Boolean(pendingBonus)} onClose={() => setPendingBonus(null)} title="Apply Referral Bonus">
        {pendingBonus && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-900/20 border border-amber-800/40 px-4 py-3">
              <p className="text-sm text-amber-300 font-medium mb-1">{pendingBonus.name}</p>
              <p className="text-xs text-gray-400">
                <span className="text-amber-400 font-medium">{pendingBonus.rewardService?.name}</span> will be charged at{' '}
                <span className="text-white font-semibold">RM 0.00</span> for this order.
              </p>
              <p className="text-xs text-gray-600 mt-1.5">
                1 credit will be deducted from this customer's referral balance after saving.
                {pendingBonus.availableCredits > 1 && ` ${pendingBonus.availableCredits - 1} credit${pendingBonus.availableCredits - 1 > 1 ? 's' : ''} will remain.`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPendingBonus(null)} className="btn-secondary w-full">
                Charge Normally
              </button>
              <button onClick={() => applyBonus(pendingBonus)} className="btn-primary w-full">
                Apply — Make Free
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}

// ─── Order Detail ─────────────────────────────────────────────────────────────
export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [workflow, setWorkflow] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expForm, setExpForm] = useState({ category: 'OTHER', description: '', amount: '' })
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = async () => {
    const [o, e] = await Promise.all([
      ordersApi.get(id!),
      expensesApi.byOrder(id!),
    ])
    setOrder(o); setExpenses(e)
    if (o.items?.some((i: any) => i.type === 'SERVICE')) {
      ordersApi.getWorkflow(id!).then(setWorkflow).catch(() => {})
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const advanceOrderStatus = async () => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setUpdatingStatus(true)
    try {
      await ordersApi.update(id!, { status: next })
      toast.success(`Order ${STATUS_LABELS[next]}`)
      load()
    } catch { toast.error('Failed to update') } finally { setUpdatingStatus(false) }
  }

  const advanceItemStep = async (itemId: string, targetStep: string) => {
    try {
      await ordersApi.updateItemStatus(id!, itemId, targetStep)
      toast.success('Step updated')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update step')
    }
  }

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await expensesApi.create({ orderId: id, ...expForm, amount: parseFloat(expForm.amount) })
      toast.success('Expense added')
      setExpForm({ category: 'OTHER', description: '', amount: '' })
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add expense')
    }
  }

  const deleteOrder = async () => {
    await ordersApi.delete(id!)
    toast.success('Order deleted')
    navigate('/orders')
  }

  if (loading) return <Spinner />

  const profit = Number(order.totalAmount) - Number(order.totalExpenses)
  const nextStatus = NEXT_STATUS[order.status]
  const serviceItems = order.items?.filter((i: any) => i.type === 'SERVICE') || []
  const productItems = order.items?.filter((i: any) => i.type === 'PRODUCT') || []

  // Build workflow state map: itemId → state
  const workflowMap: Record<string, any> = {}
  workflow?.workflowStates?.forEach((s: any) => { workflowMap[s.itemId] = s })

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 flex items-start justify-between">
        <div>
          <Link to={`/customers/${order.customerId}`} className="text-brand-400 text-sm">{order.customer?.name}</Link>
          <h1 className="font-display text-xl font-bold text-white mt-0.5">Order</h1>
          <p className="text-xs text-gray-500">{fmt.date(order.createdAt)}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Clock size={10} />
            {order.status === 'COMPLETED' || order.status === 'CANCELLED'
              ? `TAT: ${tat(order.createdAt, order.completedDate)}`
              : `Open for ${tat(order.createdAt)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDeleteConfirm(true)} className="btn-danger p-2.5"><Trash2 size={16} /></button>
        </div>
      </div>

      {/* Order status */}
      <div className="px-4 md:px-6 mb-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <Badge className={STATUS_COLORS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
            {nextStatus && (
              <button onClick={advanceOrderStatus} disabled={updatingStatus}
                className="flex items-center gap-1.5 text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 rounded-full font-medium hover:bg-emerald-800/40 transition-colors">
                <CheckCircle size={12} /> {NEXT_STATUS_LABEL[order.status]}
              </button>
            )}
          </div>
          {/* Progress dots */}
          <div className="flex items-center">
            {ORDER_STATUSES.filter(s => s !== 'CANCELLED').map((s, i, arr) => {
              const statusIdx = arr.indexOf(order.status)
              const thisIdx = i
              const isPast = thisIdx <= statusIdx
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${isPast ? 'bg-brand-500' : 'bg-gray-700'}`} />
                  {i < arr.length - 1 && <div className={`flex-1 h-0.5 ${thisIdx < statusIdx ? 'bg-brand-500' : 'bg-gray-700'}`} />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Services */}
      {serviceItems.length > 0 && (
        <div className="px-4 md:px-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Services</h2>
          <div className="space-y-2">
            {serviceItems.map((item: any) => {
              const wf = workflowMap[item.id]
              return (
                <div key={item.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Scissors size={14} className="text-brand-400" />
                      <span className="text-sm font-medium text-white">{item.name}</span>
                      <span className="text-xs text-gray-500">×{item.quantity}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{fmt.currency(item.subtotal)}</span>
                  </div>
                  {wf && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Step: <span className="text-gray-300">{wf.currentLabel}</span></span>
                        {wf.isCompleted && <span className="text-xs text-emerald-400">✓ Done</span>}
                      </div>
                      {!wf.isCompleted && wf.availableTransitions.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {wf.availableTransitions.map((step: string) => (
                            <button key={step} onClick={() => advanceItemStep(item.id, step)}
                              className="text-xs bg-brand-900/40 text-brand-300 border border-brand-800/50 px-2.5 py-1 rounded-full hover:bg-brand-800/40 transition-colors">
                              → {step}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Products */}
      {productItems.length > 0 && (
        <div className="px-4 md:px-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Products</h2>
          <div className="card divide-y divide-gray-800">
            {productItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <Package size={14} className="text-amber-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-white">{item.name}</span>
                <span className="text-xs text-gray-500">×{item.quantity}</span>
                <span className="text-sm font-medium text-white">{fmt.currency(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financials */}
      <div className="px-4 md:px-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Financials</h2>
        <div className="card">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-bold text-white">{fmt.currency(order.totalAmount)}</p>
              {Number(order.discountAmount) > 0 && (
                <p className="text-xs text-emerald-400">−{fmt.currency(order.discountAmount)} off</p>
              )}
            </div>
            <div className="text-center border-x border-gray-800">
              <p className="text-xs text-gray-500">Expenses</p>
              <p className="text-sm font-bold text-red-400">{fmt.currency(order.totalExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Profit</p>
              <p className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt.currency(profit)}</p>
            </div>
          </div>

          {/* Expense list */}
          {expenses.length > 0 && (
            <div className="border-t border-gray-800 pt-2 mb-2">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Expense Breakdown</p>
              {expenses.map(ex => (
                <div key={ex.id} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 text-xs last:border-b-0">
                  <span className="text-gray-500 flex-1">{EXPENSE_CATEGORY_LABELS[ex.category] || ex.category} · {ex.description}</span>
                  <span className="text-red-400">{fmt.currency(ex.amount)}</span>
                  <button onClick={async () => { await expensesApi.delete(ex.id); await load() }} className="text-gray-600 hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Add expense */}
          <form onSubmit={addExpense} className="mt-2 pt-2 border-t border-gray-800 space-y-2">
            <p className="text-xs font-semibold text-gray-400">Add Expense</p>
            <select className="input text-sm py-2" value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div className="flex gap-2">
              <input className="input text-sm py-2 flex-1" placeholder="Description" value={expForm.description}
                onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} required />
              <input type="number" step="0.01" className="input text-sm py-2 w-24" placeholder="RM"
                value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} required />
              <button type="submit" className="btn-primary px-3 py-2 text-sm"><Plus size={14} /></button>
            </div>
          </form>
        </div>
      </div>

      {/* Notes & Schedule */}
      {(order.notes || order.scheduledDate) && (
        <div className="px-4 md:px-6 mb-4">
          <div className="card space-y-2 text-sm">
            {order.scheduledDate && (
              <div className="flex justify-between">
                <span className="text-gray-400">Scheduled</span>
                <span className="text-white">{fmt.date(order.scheduledDate)}</span>
              </div>
            )}
            {order.completedDate && (
              <div className="flex justify-between">
                <span className="text-gray-400">Completed</span>
                <span className="text-white">{fmt.date(order.completedDate)}</span>
              </div>
            )}
            {order.notes && (
              <p className="text-gray-500 text-xs pt-1 border-t border-gray-800">{order.notes}</p>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} onConfirm={deleteOrder}
        title="Delete Order" message="This will permanently delete the order and all expenses." danger />

    </div>
  )
}
