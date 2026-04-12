import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { clientsApi, measurementsApi, ordersApi } from '../api/client'
import { PageHeader, Empty, Spinner, Badge, Modal, Field, ConfirmDialog } from '../components/ui'
import { fmt, STATUS_COLORS, STATUS_LABELS, ORDER_TYPE_LABELS } from '../utils'
import toast from 'react-hot-toast'
import { Plus, User, Phone, Instagram, Trash2, Edit2, Ruler, ShoppingBag, ChevronRight } from 'lucide-react'

// ─── Client List ────────────────────────────────────────────────────────────
export function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = (s = '') => clientsApi.list(s || undefined).then(setClients).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients`}
        action={
          <Link to="/clients/new" className="btn-primary flex items-center gap-1.5 text-sm">
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
      {clients.length === 0 ? (
        <Empty icon={<User size={40} />} message="No clients yet" action={<Link to="/clients/new" className="btn-primary text-sm">Add first client</Link>} />
      ) : (
        <div className="px-4 space-y-2">
          {clients.map(c => (
            <Link key={c.id} to={`/clients/${c.id}`} className="card flex items-center gap-3 hover:border-gray-700 transition-colors">
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

// ─── New / Edit Client ───────────────────────────────────────────────────────
export function ClientFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ name: '', phone: '', instagram: '', contactSource: 'whatsapp', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) clientsApi.get(id!).then(c => setForm({
      name: c.name, phone: c.phone || '', instagram: c.instagram || '',
      contactSource: c.contactSource || 'whatsapp', notes: c.notes || ''
    }))
  }, [id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await clientsApi.update(id!, form)
        toast.success('Client updated')
      } else {
        const c = await clientsApi.create(form)
        toast.success('Client created')
        navigate(`/clients/${c.id}`)
        return
      }
      navigate(-1)
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Client' : 'New Client'} />
      <form onSubmit={submit} className="px-4 space-y-4">
        <Field label="Full Name *">
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Client's name" />
        </Field>
        <Field label="WhatsApp Number">
          <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+60xxxxxxxxx" />
        </Field>
        <Field label="Instagram Handle">
          <input className="input" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@handle" />
        </Field>
        <Field label="Contact Source">
          <select className="input" value={form.contactSource} onChange={e => setForm(f => ({ ...f, contactSource: e.target.value }))}>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Notes">
          <textarea className="input min-h-[80px]" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special notes…" />
        </Field>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save Client'}</button>
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary w-full">Cancel</button>
      </form>
    </div>
  )
}

// ─── Client Detail ───────────────────────────────────────────────────────────
export function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [measurements, setMeasurements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mModal, setMModal] = useState(false)
  const [mForm, setMForm] = useState({ palluLength: '', shoulderToNavel: '', waistToFloor: '', bodyWrap: '', unit: 'inches', label: '', notes: '' })
  const [editMeasurement, setEditMeasurement] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const load = async () => {
    const [c, o, m] = await Promise.all([
      clientsApi.get(id!),
      ordersApi.list({ clientId: id }),
      measurementsApi.byClient(id!),
    ])
    setClient(c); setOrders(o); setMeasurements(m)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const saveMeasurement = async () => {
    try {
      const data = {
        clientId: id,
        palluLength: parseFloat(mForm.palluLength) || null,
        shoulderToNavel: parseFloat(mForm.shoulderToNavel) || null,
        waistToFloor: parseFloat(mForm.waistToFloor) || null,
        bodyWrap: parseFloat(mForm.bodyWrap) || null,
        unit: mForm.unit, label: mForm.label, notes: mForm.notes,
      }
      if (editMeasurement) await measurementsApi.update(editMeasurement.id, data)
      else await measurementsApi.create(data)
      toast.success('Measurements saved')
      setMModal(false); setEditMeasurement(null)
      setMForm({ palluLength: '', shoulderToNavel: '', waistToFloor: '', bodyWrap: '', unit: 'inches', label: '', notes: '' })
      load()
    } catch { toast.error('Failed to save') }
  }

  const deleteClient = async () => {
    await clientsApi.delete(id!)
    toast.success('Client deleted')
    navigate('/clients')
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-900/40 border border-brand-800/50 flex items-center justify-center text-brand-300 font-display font-bold text-xl">
              {client.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">{client.name}</h1>
              <p className="text-xs text-gray-500 capitalize">{client.contactSource}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/clients/${id}/edit`} className="btn-secondary p-2.5"><Edit2 size={16} /></Link>
          <button onClick={() => setDeleteConfirm(true)} className="btn-danger p-2.5"><Trash2 size={16} /></button>
        </div>
      </div>

      {/* Contact info */}
      <div className="px-4 mb-4">
        <div className="card space-y-2">
          {client.phone && (
            <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-sm text-green-400">
              <Phone size={14} /> {client.phone}
            </a>
          )}
          {client.instagram && (
            <p className="flex items-center gap-2 text-sm text-pink-400">
              <Instagram size={14} /> {client.instagram}
            </p>
          )}
          {client.notes && <p className="text-xs text-gray-500">{client.notes}</p>}
        </div>
      </div>

      {/* Measurements */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Measurements</h2>
          <button onClick={() => setMModal(true)} className="text-brand-400 text-xs flex items-center gap-1"><Plus size={12} /> Add</button>
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
                    <button onClick={() => {
                      setEditMeasurement(m)
                      setMForm({ palluLength: m.palluLength || '', shoulderToNavel: m.shoulderToNavel || '', waistToFloor: m.waistToFloor || '', bodyWrap: m.bodyWrap || '', unit: m.unit, label: m.label || '', notes: m.notes || '' })
                      setMModal(true)
                    }} className="text-gray-500 hover:text-white"><Edit2 size={14} /></button>
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
          <Link to={`/orders/new?clientId=${id}`} className="text-brand-400 text-xs flex items-center gap-1"><Plus size={12} /> New</Link>
        </div>
        {orders.length === 0 ? (
          <div className="card text-center py-6">
            <ShoppingBag size={24} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(o => (
              <Link key={o.id} to={`/orders/${o.id}`} className="card flex items-center gap-3 hover:border-gray-700 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{ORDER_TYPE_LABELS[o.type]}</p>
                  <p className="text-xs text-gray-500">{fmt.date(o.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                  <span className="text-xs text-gray-400">{fmt.currency(o.priceCharged)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Measurement Modal */}
      <Modal open={mModal} onClose={() => { setMModal(false); setEditMeasurement(null) }} title={editMeasurement ? 'Edit Measurement' : 'Add Measurement'}>
        <div className="space-y-3">
          <Field label="Label (e.g. Wedding 2024)">
            <input className="input" value={mForm.label} onChange={e => setMForm(f => ({ ...f, label: e.target.value }))} placeholder="Optional label" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pallu Length">
              <input type="number" step="0.1" className="input" value={mForm.palluLength} onChange={e => setMForm(f => ({ ...f, palluLength: e.target.value }))} />
            </Field>
            <Field label="Shoulder → Navel">
              <input type="number" step="0.1" className="input" value={mForm.shoulderToNavel} onChange={e => setMForm(f => ({ ...f, shoulderToNavel: e.target.value }))} />
            </Field>
            <Field label="Chest">
              <input type="number" step="0.1" className="input" value={mForm.waistToFloor} onChange={e => setMForm(f => ({ ...f, waistToFloor: e.target.value }))} />
            </Field>
            <Field label="Hip">
              <input type="number" step="0.1" className="input" value={mForm.bodyWrap} onChange={e => setMForm(f => ({ ...f, bodyWrap: e.target.value }))} />
            </Field>
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

      <ConfirmDialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} onConfirm={deleteClient}
        title="Delete Client" message="This will permanently delete the client and all associated data." danger />
    </div>
  )
}
