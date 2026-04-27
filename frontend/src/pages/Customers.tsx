import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { customersApi, measurementsApi, ordersApi, portalApi } from '../api/client'
import { PageHeader, Empty, Spinner, Badge, Modal, Field, ConfirmDialog } from '../components/ui'
import { fmt, STATUS_COLORS, STATUS_LABELS, CONTACT_SOURCE_LABELS, getErrorMessage } from '../utils'
import toast from 'react-hot-toast'
import { Plus, User, Phone, Instagram, Trash2, Edit2, Ruler, ShoppingBag, ChevronRight, Globe, Loader2 } from 'lucide-react'

// ─── Customer List ────────────────────────────────────────────────────────────
export function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = (s = '') => customersApi.list(s || undefined).then(setCustomers).finally(() => setLoading(false))

  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customers`}
        action={
          <Link to="/customers/new" className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} /> New
          </Link>
        }
      />
      <div className="px-4 mb-4">
        <input
          className="input"
          placeholder="Search by name, phone, or Instagram…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {customers.length === 0 ? (
        <Empty
          icon={<User size={40} />}
          message="No customers yet"
          action={<Link to="/customers/new" className="btn-primary text-sm">Add first customer</Link>}
        />
      ) : (
        <div className="px-4 space-y-2">
          {customers.map(c => (
            <Link key={c.id} to={`/customers/${c.id}`} className="card flex items-center gap-3 hover:border-gray-700 transition-colors">
              <div className="w-10 h-10 rounded-full bg-brand-900/40 border border-brand-800/50 flex items-center justify-center text-brand-300 font-display font-bold text-lg flex-shrink-0">
                {c.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{c.name}</p>
                <p className="text-xs text-gray-500">{c.phone || c.instagram || 'No contact info'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-gray-500">{c.measurements?.length || 0} measurements</span>
                <ChevronRight size={14} className="text-gray-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── New / Edit Customer ──────────────────────────────────────────────────────
export function CustomerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({
    name: '', phone: '', email: '', instagram: '',
    contactSource: 'whatsapp', notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) customersApi.get(id!).then(c => setForm({
      name: c.name, phone: c.phone || '', email: c.email || '',
      instagram: c.instagram || '', contactSource: c.contactSource || 'whatsapp',
      notes: c.notes || '',
    }))
  }, [id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    // Strip empty optional fields so backend validators don't reject them
    const payload: any = { ...form }
    if (!payload.email) delete payload.email
    if (!payload.instagram) delete payload.instagram
    if (!payload.phone) delete payload.phone
    if (!payload.notes) delete payload.notes
    try {
      if (isEdit) {
        await customersApi.update(id!, payload)
        toast.success('Customer updated')
        navigate(-1)
      } else {
        const c = await customersApi.create(payload)
        toast.success('Customer created')
        navigate(`/customers/${c.id}`)
      }
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Customer' : 'New Customer'} />
      <form onSubmit={submit} className="px-4 space-y-4">
        <Field label="Full Name *">
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Customer's name" />
        </Field>
        <Field label="WhatsApp Number">
          <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+60xxxxxxxxx" />
        </Field>
        <Field label="Email">
          <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
        </Field>
        <Field label="Instagram Handle">
          <input className="input" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@handle" />
        </Field>
        <Field label="Contact Source">
          <select className="input" value={form.contactSource} onChange={e => setForm(f => ({ ...f, contactSource: e.target.value }))}>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="referral">Referral</option>
            <option value="walk-in">Walk-in</option>
          </select>
        </Field>
        <Field label="Notes">
          <textarea className="input min-h-[80px]" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special notes…" />
        </Field>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save Customer'}</button>
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary w-full">Cancel</button>
      </form>
    </div>
  )
}

// ─── Customer Detail ──────────────────────────────────────────────────────────
export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [measurements, setMeasurements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mModal, setMModal] = useState(false)
  const [mForm, setMForm] = useState({
    palluLength: '', shoulderToNavel: '', waistToFloor: '', bodyWrap: '',
    unit: 'inches', label: '', notes: '',
  })
  const [editMeasurement, setEditMeasurement] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [portalStatus, setPortalStatus] = useState<{ hasPortalAccount: boolean; isActive: boolean | null } | null>(null)
  const [inviting, setInviting] = useState(false)

  const load = async () => {
    const [c, o, m] = await Promise.all([
      customersApi.get(id!),
      ordersApi.list({ customerId: id }),
      measurementsApi.byCustomer(id!),
    ])
    setCustomer(c); setOrders(o); setMeasurements(m)
    setLoading(false)
    // Load portal status separately so it doesn't block the main load
    portalApi.status(id!).then(setPortalStatus).catch(() => {})
  }

  const inviteToPortal = async () => {
    setInviting(true)
    try {
      await portalApi.invite(id!)
      toast.success('Portal invite sent!')
      portalApi.status(id!).then(setPortalStatus)
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to send portal invite.'))
    } finally {
      setInviting(false)
    }
  }

  useEffect(() => { load() }, [id])

  const openAddMeasurement = () => {
    setEditMeasurement(null)
    setMForm({ palluLength: '', shoulderToNavel: '', waistToFloor: '', bodyWrap: '', unit: 'inches', label: '', notes: '' })
    setMModal(true)
  }

  const openEditMeasurement = (m: any) => {
    setEditMeasurement(m)
    setMForm({
      palluLength: m.palluLength || '', shoulderToNavel: m.shoulderToNavel || '',
      waistToFloor: m.waistToFloor || '', bodyWrap: m.bodyWrap || '',
      unit: m.unit, label: m.label || '', notes: m.notes || '',
    })
    setMModal(true)
  }

  const saveMeasurement = async () => {
    try {
      const data = {
        customerId: id,
        palluLength: parseFloat(mForm.palluLength) || null,
        shoulderToNavel: parseFloat(mForm.shoulderToNavel) || null,
        waistToFloor: parseFloat(mForm.waistToFloor) || null,
        bodyWrap: parseFloat(mForm.bodyWrap) || null,
        unit: mForm.unit, label: mForm.label, notes: mForm.notes,
      }
      if (editMeasurement) await measurementsApi.update(editMeasurement.id, data)
      else await measurementsApi.create(data)
      toast.success('Measurements saved')
      setMModal(false)
      load()
    } catch { toast.error('Failed to save') }
  }

  const deleteCustomer = async () => {
    await customersApi.delete(id!)
    toast.success('Customer deleted')
    navigate('/customers')
  }

  if (loading) return <Spinner />

  const totalSpent = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0)

  return (
    <div>
      <div className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-900/40 border border-brand-800/50 flex items-center justify-center text-brand-300 font-display font-bold text-xl">
            {customer.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">{customer.name}</h1>
            <p className="text-xs text-gray-500">{CONTACT_SOURCE_LABELS[customer.contactSource] || customer.contactSource}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/customers/${id}/edit`} className="btn-secondary p-2.5"><Edit2 size={16} /></Link>
          <button onClick={() => setDeleteConfirm(true)} className="btn-danger p-2.5"><Trash2 size={16} /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-4 grid grid-cols-3 gap-2">
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-white">{orders.length}</p>
          <p className="text-xs text-gray-500">Orders</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-brand-400">{fmt.currency(totalSpent)}</p>
          <p className="text-xs text-gray-500">Total Spent</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-white">{measurements.length}</p>
          <p className="text-xs text-gray-500">Measurements</p>
        </div>
      </div>

      {/* Contact */}
      <div className="px-4 mb-4">
        <div className="card space-y-2">
          {customer.phone && (
            <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-green-400">
              <Phone size={14} /> {customer.phone}
            </a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm text-blue-400">
              <span className="text-xs">✉</span> {customer.email}
            </a>
          )}
          {customer.instagram && (
            <p className="flex items-center gap-2 text-sm text-pink-400">
              <Instagram size={14} /> {customer.instagram}
            </p>
          )}
          {customer.notes && <p className="text-xs text-gray-500 pt-1 border-t border-gray-800">{customer.notes}</p>}
        </div>
      </div>

      {/* Customer Portal */}
      <div className="px-4 mb-4">
        <div className="card flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-900/40 border border-brand-800/40 flex items-center justify-center flex-shrink-0">
            <Globe size={14} className="text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Customer Portal</p>
            {portalStatus === null ? (
              <p className="text-xs text-gray-500">Checking…</p>
            ) : portalStatus.hasPortalAccount ? (
              <p className="text-xs text-gray-500">
                Account {portalStatus.isActive ? (
                  <span className="text-emerald-400">active</span>
                ) : (
                  <span className="text-red-400">inactive</span>
                )} — manage in <span className="text-brand-400">Team → Client Portal</span>
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {customer.email ? 'Not invited yet' : 'Add an email address to invite'}
              </p>
            )}
          </div>
          {portalStatus !== null && !portalStatus.hasPortalAccount && customer.email && (
            <button
              onClick={inviteToPortal}
              disabled={inviting}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 border border-brand-800/50 bg-brand-900/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {inviting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              {inviting ? 'Sending…' : 'Invite'}
            </button>
          )}
        </div>
      </div>

      {/* Measurements */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Measurements</h2>
          <button onClick={openAddMeasurement} className="text-brand-400 text-xs flex items-center gap-1"><Plus size={12} /> Add</button>
        </div>
        {measurements.length === 0 ? (
          <div className="card text-center py-6">
            <Ruler size={24} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No measurements yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {measurements.map(m => (
              <div key={m.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{m.label || 'Measurement'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openEditMeasurement(m)} className="text-gray-500 hover:text-white"><Edit2 size={14} /></button>
                    <button onClick={async () => { await measurementsApi.delete(m.id); load() }} className="text-red-500 hover:text-red-300"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {m.palluLength && <><span className="text-gray-500">Pallu Length</span><span className="text-gray-300">{m.palluLength} {m.unit}</span></>}
                  {m.shoulderToNavel && <><span className="text-gray-500">Shoulder→Navel</span><span className="text-gray-300">{m.shoulderToNavel} {m.unit}</span></>}
                  {m.waistToFloor && <><span className="text-gray-500">Chest</span><span className="text-gray-300">{m.waistToFloor} {m.unit}</span></>}
                  {m.bodyWrap && <><span className="text-gray-500">Hip</span><span className="text-gray-300">{m.bodyWrap} {m.unit}</span></>}
                </div>
                {m.notes && <p className="text-xs text-gray-500 mt-1">{m.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Orders ({orders.length})</h2>
          <Link to={`/orders/new?customerId=${id}`} className="text-brand-400 text-xs flex items-center gap-1"><Plus size={12} /> New</Link>
        </div>
        {orders.length === 0 ? (
          <div className="card text-center py-6">
            <ShoppingBag size={24} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(o => {
              const summary = o.items?.length
                ? o.items.slice(0, 2).map((i: any) => i.name).join(', ')
                : '—'
              return (
                <Link key={o.id} to={`/orders/${o.id}`} className="card flex items-center gap-3 hover:border-gray-700 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{summary}</p>
                    <p className="text-xs text-gray-500">{fmt.date(o.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                    <span className="text-xs text-gray-400">{fmt.currency(o.totalAmount)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Measurement Modal */}
      <Modal open={mModal} onClose={() => setMModal(false)} title={editMeasurement ? 'Edit Measurement' : 'Add Measurement'}>
        <div className="space-y-3">
          <Field label="Label (e.g. Wedding 2024)">
            <input className="input" value={mForm.label} onChange={e => setMForm(f => ({ ...f, label: e.target.value }))} placeholder="Optional label" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            {[['palluLength', 'Pallu Length'], ['shoulderToNavel', 'Shoulder → Navel'], ['waistToFloor', 'Chest'], ['bodyWrap', 'Hip']].map(([key, label]) => (
              <Field key={key} label={label}>
                <input type="number" step="0.1" className="input" value={(mForm as any)[key]} onChange={e => setMForm(f => ({ ...f, [key]: e.target.value }))} />
              </Field>
            ))}
          </div>
          <Field label="Unit">
            <select className="input" value={mForm.unit} onChange={e => setMForm(f => ({ ...f, unit: e.target.value }))}>
              <option value="inches">Inches</option>
              <option value="cm">Centimeters</option>
            </select>
          </Field>
          <Field label="Notes">
            <textarea className="input" value={mForm.notes} onChange={e => setMForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes…" />
          </Field>
          <button onClick={saveMeasurement} className="btn-primary w-full">Save</button>
        </div>
      </Modal>

      <ConfirmDialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} onConfirm={deleteCustomer}
        title="Delete Customer" message="This will permanently delete the customer and all associated data." danger />
    </div>
  )
}
