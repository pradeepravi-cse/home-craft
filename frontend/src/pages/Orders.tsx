import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ordersApi, customersApi, servicesApi, expensesApi, measurementsApi } from '../api/client'
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
  const [items, setItems] = useState<Array<{ type: string; referenceId: string; name: string; price: number; quantity: number }>>([])
  const [form, setForm] = useState({
    customerId: searchParams.get('customerId') || '',
    notes: '', scheduledDate: '',
  })
  const [addModal, setAddModal] = useState<'service' | null>(null)
  const [pricing, setPricing] = useState<{ subtotal: number; discountAmount: number; totalAmount: number; appliedRules: string[] } | null>(null)
  const [saving, setSaving] = useState(false)
  const [measurements, setMeasurements] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      customersApi.list(),
      servicesApi.list(true),
    ]).then(([c, s]) => { setCustomers(c); setServices(s) })
  }, [])

  // Fetch customer measurements whenever customer changes
  useEffect(() => {
    if (!form.customerId) { setMeasurements([]); return }
    measurementsApi.byCustomer(form.customerId)
      .then(setMeasurements)
      .catch(() => setMeasurements([]))
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Add at least one item'); return }
    setSaving(true)
    try {
      const order = await ordersApi.create({
        customerId: form.customerId,
        notes: form.notes || undefined,
        scheduledDate: form.scheduledDate || undefined,
        items: items.map(i => ({ type: i.type, referenceId: i.referenceId, quantity: i.quantity })),
      })
      toast.success('Order created')
      navigate(`/orders/${order.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order')
    } finally { setSaving(false) }
  }

  const hasServices = items.some(i => i.type === 'SERVICE')
  const activeMeasurement = measurements[0] // most recent measurement

  return (
    <div>
      <PageHeader title="New Order" />
      <form onSubmit={submit} className="px-4 md:px-6 space-y-4 pb-6">

        {/* Customer */}
        <Field label="Customer *">
          <select className="input" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
            <option value="">Select customer…</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        {/* Referral benefit + privilege notice for selected customer */}
        {form.customerId && (() => {
          const c = customers.find((x: any) => x.id === form.customerId)
          if (!c) return null
          return (
            <div className="space-y-2">
              {c.isPrivileged && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-900/20 border border-amber-800/40 px-3 py-2">
                  <Crown size={13} className="text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">Privileged customer — exclusive services may apply</p>
                </div>
              )}
              {c.referralBenefitPending && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-900/20 border border-emerald-800/40 px-3 py-2">
                  <Gift size={13} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-300">
                    This customer has a <span className="font-semibold">free saree pleating</span> benefit pending.
                    Mark it used on their profile after applying.
                  </p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Customer measurements — shown when customer selected + has services */}
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
                  <p className="text-xs text-gray-600">+{measurements.length - 1} more measurement set(s) on profile</p>
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
                <div key={item.referenceId} className="card flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'SERVICE' ? 'bg-brand-900/40' : 'bg-amber-900/40'}`}>
                    {item.type === 'SERVICE' ? <Scissors size={13} className="text-brand-400" /> : <Package size={13} className="text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{fmt.currency(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => changeQty(item.referenceId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-gray-700 text-white text-sm flex items-center justify-center hover:bg-gray-600">−</button>
                    <span className="text-sm text-white w-4 text-center">{item.quantity}</span>
                    <button type="button" onClick={() => changeQty(item.referenceId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-gray-700 text-white text-sm flex items-center justify-center hover:bg-gray-600">+</button>
                  </div>
                  <span className="text-sm font-medium text-white w-16 text-right">{fmt.currency(item.price * item.quantity)}</span>
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
              <div className="flex justify-between text-white font-semibold pt-1.5 border-t border-gray-800">
                <span>Total</span><span>{fmt.currency(pricing.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Schedule & Notes */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Scheduled Date">
            <input type="date" className="input" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions…" />
        </Field>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating…' : 'Create Order'}</button>
        </div>
      </form>

      {/* Add Service Modal */}
      <Modal open={addModal === 'service'} onClose={() => setAddModal(null)} title="Add Service">
        <div className="space-y-2">
          {services.filter(s => !items.find(i => i.referenceId === s.id)).map(s => (
            <button key={s.id} onClick={() => addItem('SERVICE', s)} className="w-full card hover:border-brand-700 transition-colors flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-brand-900/40 flex items-center justify-center flex-shrink-0"><Scissors size={14} className="text-brand-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{s.name}</p>
                {s.description && <p className="text-xs text-gray-500 truncate">{s.description}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{s.isOptional ? 'Add-on' : 'Required'}</p>
              </div>
              <span className="text-sm font-semibold text-brand-300">{fmt.currency(s.basePrice)}</span>
            </button>
          ))}
          {services.filter(s => !items.find(i => i.referenceId === s.id)).length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">All active services already added</p>
          )}
        </div>
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
