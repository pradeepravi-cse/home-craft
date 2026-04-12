import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ordersApi, clientsApi, expensesApi, measurementsApi } from '../api/client'
import { PageHeader, Empty, Spinner, Badge, Field, ConfirmDialog } from '../components/ui'
import { fmt, STATUS_COLORS, STATUS_LABELS, ORDER_TYPE_LABELS, ORDER_TYPE_COLORS, EXPENSE_CATEGORY_LABELS } from '../utils'
import toast from 'react-hot-toast'
import { Plus, ShoppingBag, Trash2, ChevronDown, Edit2, CheckCircle, Ruler } from 'lucide-react'

const ALL_STATUSES = ['received', 'processing', 'ready', 'collected', 'draped', 'completed']
const NEXT_STATUS: Record<string, string> = {
  received: 'processing', processing: 'ready', ready: 'collected', collected: 'completed',
  draped: 'completed',
}
const NEXT_LABEL: Record<string, string> = {
  received: 'Mark Processing', processing: 'Mark Ready', ready: 'Mark Collected',
  collected: 'Mark Complete', draped: 'Mark Complete',
}

// ─── Orders List ─────────────────────────────────────────────────────────────
export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = (status?: string) => ordersApi.list(status ? { status } : {}).then(setOrders).finally(() => setLoading(false))

  useEffect(() => { load(filter || undefined) }, [filter])

  if (loading) return <Spinner />

  const active = orders.filter(o => !['completed', 'collected', 'draped'].includes(o.status))
  const done = orders.filter(o => ['completed', 'collected', 'draped'].includes(o.status))

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total`}
        action={<Link to="/orders/new" className="btn-primary flex items-center gap-1.5 text-sm"><Plus size={16} /> New</Link>}
      />

      {/* Filter tabs */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
        {[['', 'All'], ['received', 'Received'], ['processing', 'Processing'], ['ready', 'Ready'], ['completed', 'Done']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === v ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <Empty icon={<ShoppingBag size={40} />} message="No orders found" action={<Link to="/orders/new" className="btn-primary text-sm">Add first order</Link>} />
      ) : (
        <div className="px-4 md:px-6 md:grid md:grid-cols-2 md:gap-3 space-y-2 md:space-y-0">
          {orders.map(o => (
            <Link key={o.id} to={`/orders/${o.id}`} className="card hover:border-gray-700 transition-colors flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{o.client?.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={ORDER_TYPE_COLORS[o.type]}>{ORDER_TYPE_LABELS[o.type]}</Badge>
                  <span className="text-xs text-gray-500">{fmt.date(o.createdAt)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                <span className="text-xs font-medium text-white">{fmt.currency(o.priceCharged)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── New Order ────────────────────────────────────────────────────────────────
export function NewOrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({
    clientId: searchParams.get('clientId') || '',
    type: 'pre_pleating',
    sareeDescription: '',
    sareeCount: '1',
    priceCharged: '',
    palluLength: '', shoulderToNavel: '', waistToFloor: '', bodyWrap: '',
    notes: '', scheduledDate: '',
  })
  const [saving, setSaving] = useState(false)
  const [measurementPrefilled, setMeasurementPrefilled] = useState(false)

  useEffect(() => { clientsApi.list().then(setClients) }, [])

  // Prefill measurements when client changes
  useEffect(() => {
    if (!form.clientId) { setMeasurementPrefilled(false); return }
    measurementsApi.byClient(form.clientId).then((measurements: any[]) => {
      if (measurements.length === 0) { setMeasurementPrefilled(false); return }
      const latest = measurements[0]
      setForm(f => ({
        ...f,
        palluLength: latest.palluLength != null ? String(latest.palluLength) : f.palluLength,
        shoulderToNavel: latest.shoulderToNavel != null ? String(latest.shoulderToNavel) : f.shoulderToNavel,
        waistToFloor: latest.waistToFloor != null ? String(latest.waistToFloor) : f.waistToFloor,
        bodyWrap: latest.bodyWrap != null ? String(latest.bodyWrap) : f.bodyWrap,
      }))
      setMeasurementPrefilled(true)
    }).catch(() => setMeasurementPrefilled(false))
  }, [form.clientId])

  // Auto-calculate price
  useEffect(() => {
    const count = parseInt(form.sareeCount) || 1
    let price = 0
    if (form.type === 'pre_pleating') price = count === 1 ? 20 : count * 15
    else if (form.type === 'draping') price = 30
    else if (form.type === 'combo') price = count === 1 ? 40 : count * 25
    setForm(f => ({ ...f, priceCharged: String(price) }))
  }, [form.type, form.sareeCount])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const o = await ordersApi.create({
        ...form,
        sareeCount: parseInt(form.sareeCount),
        priceCharged: parseFloat(form.priceCharged),
        palluLength: parseFloat(form.palluLength) || null,
        shoulderToNavel: parseFloat(form.shoulderToNavel) || null,
        waistToFloor: parseFloat(form.waistToFloor) || null,
        bodyWrap: parseFloat(form.bodyWrap) || null,
      })
      toast.success('Order created')
      navigate(`/orders/${o.id}`)
    } catch { toast.error('Failed to create order') } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="New Order" />
      <form onSubmit={submit} className="px-4 md:px-6 space-y-4 pb-6">
        <div className="md:grid md:grid-cols-2 md:gap-4 md:space-y-0 space-y-4">
          <Field label="Client *">
            <select className="input" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} required>
              <option value="">Select client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Order Type *">
            <div className="grid grid-cols-3 gap-2 h-[42px]">
              {[['pre_pleating', '🪡 Pre-Pleat'], ['draping', '🥻 Draping'], ['combo', '✨ Combo']].map(([v, l]) => (
                <button key={v} type="button"
                  onClick={() => setForm(f => ({ ...f, type: v }))}
                  className={`h-full rounded-xl text-sm font-medium border transition-colors ${form.type === v ? 'bg-brand-600 border-brand-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="No. of Sarees">
            <input type="number" min="1" className="input" value={form.sareeCount} onChange={e => setForm(f => ({ ...f, sareeCount: e.target.value }))} />
          </Field>
          <Field label="Price (RM)">
            <input type="number" step="0.01" className="input" value={form.priceCharged} onChange={e => setForm(f => ({ ...f, priceCharged: e.target.value }))} />
          </Field>
          <div className="col-span-2 md:col-span-1">
            <Field label="Scheduled Date">
              <input type="date" className="input" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
            </Field>
          </div>
        </div>

        <Field label="Saree Description">
          <input className="input" value={form.sareeDescription} onChange={e => setForm(f => ({ ...f, sareeDescription: e.target.value }))} placeholder="e.g. Red silk, Gold border" />
        </Field>

        {/* Measurements - only for pleating/combo */}
        {(form.type === 'pre_pleating' || form.type === 'combo') && (
          <div className="card border-dashed">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Measurements</p>
              {measurementPrefilled && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  <Ruler size={10} /> Prefilled from client
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['palluLength', 'Pallu Length'], ['shoulderToNavel', 'Shoulder→Navel'], ['waistToFloor', 'Chest'], ['bodyWrap', 'Hip']].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input type="number" step="0.1" className="input" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder="inches" />
                </Field>
              ))}
            </div>
          </div>
        )}

        <Field label="Notes">
          <textarea className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions…" />
        </Field>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating…' : 'Create Order'}</button>
        </div>
      </form>
    </div>
  )
}

// ─── Order Detail ─────────────────────────────────────────────────────────────
export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expForm, setExpForm] = useState({ category: 'other', description: '', amount: '' })
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = async () => {
    const [o, e] = await Promise.all([ordersApi.get(id!), expensesApi.byOrder(id!)])
    setOrder(o); setExpenses(e); setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const advanceStatus = async () => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setUpdatingStatus(true)
    try {
      await ordersApi.updateStatus(id!, next)
      toast.success(`Marked as ${STATUS_LABELS[next]}`)
      load()
    } catch { toast.error('Failed to update') } finally { setUpdatingStatus(false) }
  }

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await expensesApi.create({ orderId: id, ...expForm, amount: parseFloat(expForm.amount) })
      toast.success('Expense added')
      setExpForm({ category: 'other', description: '', amount: '' })
      load()
    } catch { toast.error('Failed to add expense') }
  }

  const deleteExpense = async (eid: string) => {
    await expensesApi.delete(eid)
    load()
  }

  const deleteOrder = async () => {
    await ordersApi.delete(id!)
    toast.success('Order deleted')
    navigate('/orders')
  }

  if (loading) return <Spinner />

  const profit = Number(order.priceCharged) - Number(order.totalExpenses)
  const nextStatus = NEXT_STATUS[order.status]

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 flex items-start justify-between">
        <div>
          <Link to={`/clients/${order.clientId}`} className="text-brand-400 text-sm">{order.client?.name}</Link>
          <h1 className="font-display text-xl font-bold text-white">{ORDER_TYPE_LABELS[order.type]}</h1>
          <p className="text-xs text-gray-500">{fmt.date(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/orders/${id}/edit`} className="btn-secondary p-2.5"><Edit2 size={16} /></Link>
          <button onClick={() => setDeleteConfirm(true)} className="btn-danger p-2.5"><Trash2 size={16} /></button>
        </div>
      </div>

      {/* Status pipeline */}
      <div className="px-4 md:px-6 mb-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <Badge className={STATUS_COLORS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
            {nextStatus && (
              <button onClick={advanceStatus} disabled={updatingStatus}
                className="flex items-center gap-1.5 text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 rounded-full font-medium hover:bg-emerald-800/40 transition-colors">
                <CheckCircle size={12} /> {NEXT_LABEL[order.status]}
              </button>
            )}
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1">
            {ALL_STATUSES.slice(0, order.type === 'draping' ? 4 : 6).map((s, i) => {
              const statuses = order.type === 'draping'
                ? ['received', 'processing', 'draped', 'completed']
                : ALL_STATUSES
              const idx = statuses.indexOf(order.status)
              const mine = statuses[i]
              const past = statuses.indexOf(mine) <= idx
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${past ? 'bg-brand-500' : 'bg-gray-700'}`} />
                  {i < statuses.length - 1 && <div className={`flex-1 h-0.5 ${past && i < idx ? 'bg-brand-500' : 'bg-gray-700'}`} />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Order details + Measurements side by side on iPad */}
      <div className="px-4 md:px-6 mb-4 md:grid md:grid-cols-2 md:gap-4">
        <div className="card space-y-2 mb-4 md:mb-0">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Type</span>
            <Badge className={ORDER_TYPE_COLORS[order.type]}>{ORDER_TYPE_LABELS[order.type]}</Badge>
          </div>
          {order.sareeDescription && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Saree</span>
              <span className="text-white">{order.sareeDescription}</span>
            </div>
          )}
          {order.sareeCount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Count</span>
              <span className="text-white">{order.sareeCount}</span>
            </div>
          )}
          {order.scheduledDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Scheduled</span>
              <span className="text-white">{fmt.date(order.scheduledDate)}</span>
            </div>
          )}
          {order.notes && (
            <div className="pt-1 border-t border-gray-800">
              <p className="text-xs text-gray-500">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Measurements — placed in the grid col on iPad */}
        {(order.palluLength || order.shoulderToNavel || order.waistToFloor || order.bodyWrap) && (
          <div className="card mt-4 md:mt-0">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Measurements</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {order.palluLength && <><span className="text-gray-500">Pallu Length</span><span className="text-gray-300 font-medium">{order.palluLength}"</span></>}
              {order.shoulderToNavel && <><span className="text-gray-500">Shoulder→Navel</span><span className="text-gray-300 font-medium">{order.shoulderToNavel}"</span></>}
              {order.waistToFloor && <><span className="text-gray-500">Chest</span><span className="text-gray-300 font-medium">{order.waistToFloor}"</span></>}
              {order.bodyWrap && <><span className="text-gray-500">Hip</span><span className="text-gray-300 font-medium">{order.bodyWrap}"</span></>}
            </div>
          </div>
        )}
      </div>

      {/* Financials */}
      <div className="px-4 md:px-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Financials</h2>
        <div className="card">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-sm font-bold text-white">{fmt.currency(order.priceCharged)}</p>
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
          {expenses.map(ex => (
            <div key={ex.id} className="flex items-center gap-2 py-1.5 border-t border-gray-800 text-xs">
              <span className="text-gray-500 flex-1">{EXPENSE_CATEGORY_LABELS[ex.category]} · {ex.description}</span>
              <span className="text-red-400">{fmt.currency(ex.amount)}</span>
              <button onClick={() => deleteExpense(ex.id)} className="text-gray-600 hover:text-red-400"><Trash2 size={12} /></button>
            </div>
          ))}

          {/* Add expense */}
          <form onSubmit={addExpense} className="mt-3 pt-3 border-t border-gray-800 space-y-2">
            <p className="text-xs font-semibold text-gray-400">Add Expense</p>
            <select className="input text-sm py-2" value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div className="flex gap-2">
              <input className="input text-sm py-2 flex-1" placeholder="Description" value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} required />
              <input type="number" step="0.01" className="input text-sm py-2 w-24" placeholder="RM" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} required />
              <button type="submit" className="btn-primary px-3 py-2 text-sm"><Plus size={14} /></button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} onConfirm={deleteOrder}
        title="Delete Order" message="This will permanently delete the order and all expenses." danger />
    </div>
  )
}
