import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { referralBonusApi, servicesApi, ordersApi } from '../api/client'
import { PageHeader, Empty, Spinner, Modal, Field, ConfirmDialog } from '../components/ui'
import { fmt } from '../utils'
import toast from 'react-hot-toast'
import {
  Gift, Plus, Edit2, Trash2, CheckCircle, XCircle, Users,
  TrendingUp, ShoppingBag, ArrowRight,
} from 'lucide-react'

export default function ReferralProgramPage() {
  const [configs, setConfigs] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [bonusOrders, setBonusOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editConfig, setEditConfig] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const emptyForm = { name: '', description: '', rewardServiceId: '', referralsRequired: '1', isActive: true }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () =>
    Promise.all([
      referralBonusApi.list(),
      servicesApi.list(),
      ordersApi.list({ referralBonusApplied: true }),
    ]).then(([c, s, orders]) => {
      setConfigs(c)
      setServices(s)
      setBonusOrders(orders)
    }).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openNew = () => { setEditConfig(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (c: any) => {
    setEditConfig(c)
    setForm({
      name: c.name, description: c.description || '',
      rewardServiceId: c.rewardServiceId,
      referralsRequired: String(c.referralsRequired),
      isActive: c.isActive,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    if (!form.name || !form.rewardServiceId) { toast.error('Name and reward service are required'); return }
    const refs = parseInt(form.referralsRequired, 10)
    if (!refs || refs < 1) { toast.error('Referrals required must be at least 1'); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name, description: form.description || undefined,
        rewardServiceId: form.rewardServiceId, referralsRequired: refs, isActive: form.isActive,
      }
      if (editConfig) { await referralBonusApi.update(editConfig.id, payload); toast.success('Bonus updated') }
      else { await referralBonusApi.create(payload); toast.success('Bonus created') }
      setModalOpen(false); load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const deleteConfig = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await referralBonusApi.delete(deleteTarget.id)
      toast.success('Bonus deleted')
      setDeleteTarget(null)
      load()
    } catch { toast.error('Failed to delete') } finally { setDeleting(false) }
  }

  const toggleActive = async (c: any) => {
    setTogglingId(c.id)
    try {
      await referralBonusApi.update(c.id, { isActive: !c.isActive })
      toast.success(c.isActive ? 'Bonus deactivated' : 'Bonus activated')
      load()
    } catch { toast.error('Failed to update') } finally { setTogglingId(null) }
  }

  if (loading) return <Spinner />

  // Aggregate stats from the orders list (source of truth)
  const totalOrders = bonusOrders.length
  const totalBonusValue = bonusOrders.reduce((s, o) => s + Number(o.referralBonusValue ?? 0), 0)
  const totalCharged = bonusOrders.reduce((s, o) => s + Number(o.totalAmount ?? 0), 0)
  const totalFaceValue = totalCharged + totalBonusValue

  return (
    <div>
      <PageHeader
        title="Referral Program"
        subtitle="Rewards earned by customers who refer others"
        action={
          <button onClick={openNew} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} /> New Bonus
          </button>
        }
      />

      {/* How it works */}
      <div className="px-4 mb-4">
        <div className="card bg-brand-900/10 border-brand-800/30 p-4 space-y-2">
          <p className="text-xs font-semibold text-brand-300 uppercase tracking-wide flex items-center gap-1.5">
            <Gift size={12} /> How it works
          </p>
          <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
            <li>Customer A brings in Customer B → A earns 1 referral credit</li>
            <li>When A has enough credits, a reward unlocks — visible when creating an order</li>
            <li>Owner chooses which bonus to apply; the service becomes RM 0 for that order</li>
            <li>Customer B earns credits only when they themselves refer someone new</li>
          </ul>
        </div>
      </div>

      {/* Holistic stats */}
      {totalOrders > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <TrendingUp size={12} /> Referral Orders — All Time
          </h2>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="card text-center py-3">
              <p className="text-2xl font-bold text-white">{totalOrders}</p>
              <p className="text-xs text-gray-500 mt-0.5">Bonus Orders</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-2xl font-bold text-amber-400">{fmt.currency(totalBonusValue)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Given Free</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="card text-center py-3">
              <p className="text-2xl font-bold text-brand-400">{fmt.currency(totalFaceValue)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Actual Worth</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-2xl font-bold text-emerald-400">{fmt.currency(totalCharged)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Revenue Earned</p>
            </div>
          </div>
          <div className="card bg-gray-900/40 px-4 py-3 text-xs text-gray-400">
            These {totalOrders} orders were worth{' '}
            <span className="text-white font-medium">{fmt.currency(totalFaceValue)}</span> in total.
            You gave away <span className="text-amber-400 font-medium">{fmt.currency(totalBonusValue)}</span> as referral rewards
            and still collected <span className="text-brand-300 font-medium">{fmt.currency(totalCharged)}</span>.
          </div>
        </div>
      )}

      {/* Order list */}
      {bonusOrders.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <ShoppingBag size={12} /> Referral Bonus Orders
          </h2>
          <div className="space-y-2">
            {bonusOrders.map(o => {
              const faceValue = Number(o.totalAmount) + Number(o.referralBonusValue ?? 0)
              const bonus = Number(o.referralBonusValue ?? 0)
              const charged = Number(o.totalAmount)
              const servicesSummary = o.items?.slice(0, 2).map((i: any) => i.name).join(', ') || '—'
              return (
                <Link key={o.id} to={`/orders/${o.id}`}
                  className="card hover:border-gray-700 transition-colors flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-900/30 border border-amber-800/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Gift size={14} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {o.customer?.name ?? '—'}
                      </p>
                      <span className="text-xs text-gray-600 flex-shrink-0">{fmt.date(o.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{servicesSummary}</p>
                    {/* Worth breakdown */}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-500">
                        Worth <span className="text-white font-medium">{fmt.currency(faceValue)}</span>
                      </span>
                      <ArrowRight size={10} className="text-gray-700 flex-shrink-0" />
                      <span className="text-xs text-amber-500">
                        Free <span className="font-medium">{fmt.currency(bonus)}</span>
                      </span>
                      <ArrowRight size={10} className="text-gray-700 flex-shrink-0" />
                      <span className="text-xs text-brand-400">
                        Charged <span className="font-medium">{fmt.currency(charged)}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Bonus configs */}
      <div className="px-4 mb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Configured Bonuses</h2>
      </div>
      {configs.length === 0 ? (
        <Empty
          icon={<Gift size={40} />}
          message="No referral bonuses configured"
          action={<button onClick={openNew} className="btn-primary text-sm">Create first bonus</button>}
        />
      ) : (
        <div className="px-4 space-y-3 pb-6">
          {configs.map(c => {
            const rewardService = services.find(s => s.id === c.rewardServiceId)
            const isToggling = togglingId === c.id
            return (
              <div key={c.id} className={`card ${c.isActive ? 'border-brand-900/60' : 'opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    c.isActive ? 'bg-amber-900/40 border border-amber-800/40' : 'bg-gray-800 border border-gray-700'
                  }`}>
                    <Gift size={16} className={c.isActive ? 'text-amber-400' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white">{c.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.isActive ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-800 text-gray-500'
                      }`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Users size={11} className="text-brand-500" />
                        {c.referralsRequired === 1 ? '1 referral = 1 reward' : `${c.referralsRequired} referrals = 1 reward`}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Gift size={11} className="text-amber-500" />
                        Free: {rewardService?.name ?? 'Unknown service'}
                        {rewardService && <span className="text-gray-600">({fmt.currency(rewardService.basePrice)})</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(c)}
                      disabled={isToggling}
                      className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40">
                      {isToggling
                        ? <span className="w-3 h-3 border border-gray-500 border-t-white rounded-full animate-spin block" />
                        : c.isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    </button>
                    <button onClick={() => openEdit(c)}
                      className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(c)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editConfig ? 'Edit Referral Bonus' : 'New Referral Bonus'}>
        <div className="space-y-4">
          <Field label="Bonus Name *">
            <input className="input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Free Saree Pleating" />
          </Field>
          <Field label="Description">
            <textarea className="input" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional description…" />
          </Field>
          <Field label="Reward Service *">
            <select className="input" value={form.rewardServiceId}
              onChange={e => setForm(f => ({ ...f, rewardServiceId: e.target.value }))}>
              <option value="">— Select a service —</option>
              {services.filter(s => s.isActive).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({fmt.currency(s.basePrice)})</option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">This service becomes free when a customer redeems the bonus.</p>
          </Field>
          <Field label="Referrals per Reward">
            <input type="number" min="1" className="input" value={form.referralsRequired}
              onChange={e => setForm(f => ({ ...f, referralsRequired: e.target.value }))} />
            <p className="text-xs text-gray-600 mt-1">
              1 means every referral earns one free service. 3 means 3 referrals = 1 reward.
            </p>
          </Field>
          <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              form.isActive
                ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}>
            {form.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {form.isActive ? 'Active' : 'Inactive'}
          </button>
          <button onClick={submit} disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : editConfig ? 'Update Bonus' : 'Create Bonus'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteConfig}
        title="Delete Bonus"
        message={`Delete "${deleteTarget?.name}"? Customers with pending credits will lose their reward tracking.`}
        danger
      />
    </div>
  )
}
