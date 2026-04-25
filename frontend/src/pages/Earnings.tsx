import { useEffect, useState, useCallback } from 'react'
import { earningsApi, investmentsApi, businessSettingsApi } from '../api/client'
import { StatCard, Spinner, Modal, Field, ConfirmDialog } from '../components/ui'
import { fmt } from '../utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine,
} from 'recharts'
import { Scissors, Package, Plus, Trash2, Edit2, TrendingUp, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#c026d3', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6']

const INV_CATEGORIES = ['EQUIPMENT', 'INVENTORY', 'MARKETING', 'TOOLS', 'TRAINING', 'OTHER'] as const
const INV_CAT_LABELS: Record<string, string> = {
  EQUIPMENT: '🔧 Equipment',
  INVENTORY: '📦 Inventory',
  MARKETING: '📣 Marketing',
  TOOLS: '🛠 Tools',
  TRAINING: '📚 Training',
  OTHER: '💼 Other',
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ year, onYearChange }: { year: number; onYearChange: (y: number) => void }) {
  const [summary, setSummary] = useState<any>(null)
  const [monthly, setMonthly] = useState<any[]>([])
  const [businessLine, setBusinessLine] = useState<any>(null)
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [topServices, setTopServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      earningsApi.summary(),
      earningsApi.monthly(year),
      earningsApi.byBusinessLine(),
      earningsApi.topProducts(5),
      earningsApi.topServices(5),
    ]).then(([s, m, bl, tp, ts]) => {
      setSummary(s); setMonthly(m); setBusinessLine(bl)
      setTopProducts(tp); setTopServices(ts)
    }).finally(() => setLoading(false))
  }, [year])

  if (loading) return <Spinner />

  const totalRevenue = (businessLine?.products?.revenue || 0) + (businessLine?.services?.revenue || 0)
  const splitData = [
    { name: 'Services', value: businessLine?.services?.revenue || 0 },
    { name: 'Products', value: businessLine?.products?.revenue || 0 },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <StatCard label="Total Revenue" value={fmt.currency(summary?.totalRevenue || 0)} color="brand" />
        <StatCard label="Net Profit" value={fmt.currency(summary?.netProfit || 0)} color="green" />
        <StatCard label="This Month" value={fmt.currency(summary?.thisMonth?.revenue || 0)} sub="Revenue" color="gold" />
        <StatCard label="This Month" value={fmt.currency(summary?.thisMonth?.profit || 0)} sub="Profit" color="blue" />
      </div>

      {/* Revenue split */}
      {totalRevenue > 0 && (
        <div className="px-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Revenue by Business Line</h2>
          <div className="card flex items-center gap-4">
            <PieChart width={120} height={120}>
              <Pie data={splitData} dataKey="value" cx={55} cy={55} innerRadius={30} outerRadius={55}>
                {splitData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  <Scissors size={12} className="text-brand-400" />
                  <span className="text-sm text-gray-300">Services</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{fmt.currency(businessLine?.services?.revenue || 0)}</p>
                  <p className="text-xs text-gray-500">{businessLine?.services?.orderCount || 0} orders</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <Package size={12} className="text-amber-400" />
                  <span className="text-sm text-gray-300">Products</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{fmt.currency(businessLine?.products?.revenue || 0)}</p>
                  <p className="text-xs text-gray-500">{businessLine?.products?.orderCount || 0} orders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly chart */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Monthly ({year})</h2>
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300"
            value={year} onChange={e => onYearChange(parseInt(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="card p-3">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e5e7eb' }} formatter={(v: any) => [`RM ${Number(v).toFixed(2)}`, '']} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#c026d3" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Services */}
      {topServices.length > 0 && (
        <div className="px-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Top Services</h2>
          <div className="card divide-y divide-gray-800">
            {topServices.map((s: any, i: number) => (
              <div key={s.serviceId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                <Scissors size={13} className="text-brand-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-white truncate">{s.name}</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{fmt.currency(parseFloat(s.revenue))}</p>
                  <p className="text-xs text-gray-500">{s.count} times</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="px-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Top Products</h2>
          <div className="card divide-y divide-gray-800">
            {topProducts.map((p: any, i: number) => (
              <div key={p.productId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                <Package size={13} className="text-amber-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-white truncate">{p.name}</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{fmt.currency(parseFloat(p.revenue))}</p>
                  <p className="text-xs text-gray-500">{p.units_sold} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly table */}
      <div className="px-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Monthly Breakdown</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 text-xs text-gray-500 font-medium">Month</th>
                <th className="text-right py-2 text-xs text-gray-500 font-medium">Revenue</th>
                <th className="text-right py-2 text-xs text-gray-500 font-medium">Expenses</th>
                <th className="text-right py-2 text-xs text-gray-500 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {monthly.filter(m => m.orderCount > 0).map(m => (
                <tr key={m.month} className="border-b border-gray-800/50">
                  <td className="py-2 text-gray-300">{m.month}</td>
                  <td className="py-2 text-right text-white">{fmt.currency(m.revenue)}</td>
                  <td className="py-2 text-right text-red-400">{fmt.currency(m.expenses)}</td>
                  <td className={`py-2 text-right font-medium ${m.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt.currency(m.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Investments Tab ──────────────────────────────────────────────────────────

function InvestmentsTab() {
  const [investments, setInvestments] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [settingsModal, setSettingsModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    description: '', category: 'EQUIPMENT', amount: '',
    investedAt: new Date().toISOString().split('T')[0], notes: '',
  })
  const [settingsForm, setSettingsForm] = useState({ electricityRatePerService: '', laborRatePerService: '' })

  const load = useCallback(async () => {
    const [inv, sum, cfg] = await Promise.all([
      investmentsApi.list(),
      investmentsApi.summary(),
      businessSettingsApi.get(),
    ])
    setInvestments(inv); setSummary(sum); setSettings(cfg)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditItem(null)
    setForm({ description: '', category: 'EQUIPMENT', amount: '', investedAt: new Date().toISOString().split('T')[0], notes: '' })
    setModal(true)
  }

  const openEdit = (inv: any) => {
    setEditItem(inv)
    setForm({
      description: inv.description, category: inv.category,
      amount: String(inv.amount), investedAt: inv.investedAt?.split('T')[0] || inv.investedAt,
      notes: inv.notes || '',
    })
    setModal(true)
  }

  const save = async () => {
    if (!form.description || !form.amount || !form.investedAt) { toast.error('Fill required fields'); return }
    try {
      const data = { ...form, amount: parseFloat(form.amount) }
      if (editItem) await investmentsApi.update(editItem.id, data)
      else await investmentsApi.create(data)
      toast.success(editItem ? 'Updated' : 'Investment added')
      setModal(false); load()
    } catch { toast.error('Failed to save') }
  }

  const del = async () => {
    if (!deleteId) return
    try { await investmentsApi.delete(deleteId); toast.success('Deleted'); load() }
    catch { toast.error('Failed') }
    setDeleteId(null)
  }

  const openSettings = () => {
    setSettingsForm({
      electricityRatePerService: String(settings?.electricityRatePerService ?? 0),
      laborRatePerService: String(settings?.laborRatePerService ?? 0),
    })
    setSettingsModal(true)
  }

  const saveSettings = async () => {
    try {
      await businessSettingsApi.update({
        electricityRatePerService: parseFloat(settingsForm.electricityRatePerService) || 0,
        laborRatePerService: parseFloat(settingsForm.laborRatePerService) || 0,
      })
      toast.success('Settings saved')
      setSettingsModal(false); load()
    } catch { toast.error('Failed to save settings') }
  }

  if (loading) return <Spinner />

  const catColors = ['#c026d3', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#6b7280']

  return (
    <div className="px-4 space-y-5">
      {/* Business Overhead Settings */}
      <div className="card bg-gray-900/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-white">Overhead Rates</p>
            <p className="text-xs text-gray-500 mt-0.5">Electricity & labour auto-added to orders</p>
          </div>
          <button onClick={openSettings} className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 border border-brand-800/50 px-2.5 py-1.5 rounded-lg transition-colors">
            <Settings size={12} /> Configure
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-gray-800/60 px-3 py-2">
            <p className="text-gray-500">Electricity / service</p>
            <p className="text-white font-semibold mt-0.5">{fmt.currency(settings?.electricityRatePerService || 0)}</p>
          </div>
          <div className="rounded-lg bg-gray-800/60 px-3 py-2">
            <p className="text-gray-500">Labour / service</p>
            <p className="text-white font-semibold mt-0.5">{fmt.currency(settings?.laborRatePerService || 0)}</p>
          </div>
        </div>
      </div>

      {/* Recovery Summary */}
      {summary && (
        <div className="card space-y-3">
          <p className="text-sm font-semibold text-white">Investment Recovery</p>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-gray-500">Total Invested</p>
              <p className="text-red-400 font-bold text-base mt-0.5">{fmt.currency(summary.totalInvested)}</p>
            </div>
            <div>
              <p className="text-gray-500">All-time Profit</p>
              <p className={`font-bold text-base mt-0.5 ${summary.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmt.currency(summary.totalProfit)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Recovered</p>
              <p className={`font-bold text-base mt-0.5 ${summary.recoveryPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {summary.recoveryPct}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {summary.totalInvested > 0 && (
            <div>
              <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all ${summary.recoveryPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(summary.recoveryPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5 text-center">
                {summary.breakEven
                  ? '✅ Break-even reached! Business is profitable.'
                  : `${fmt.currency(summary.totalInvested - summary.totalProfit)} remaining to break even`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cumulative growth chart */}
      {summary?.growthSeries?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Cumulative Profit Growth</h2>
          <div className="card p-3">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={summary.growthSeries} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: any) => [`RM ${Number(v).toFixed(2)}`, '']} />
                <ReferenceLine y={summary.totalInvested} stroke="#ef4444" strokeDasharray="4 3"
                  label={{ value: 'Investment', fill: '#ef4444', fontSize: 9 }} />
                <Line type="monotone" dataKey="cumulativeProfit" name="Cumulative Profit"
                  stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 text-center mt-1">Red dashed line = total invested ({fmt.currency(summary.totalInvested)})</p>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {summary?.categoryBreakdown?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Investment by Category</h2>
          <div className="card space-y-2">
            {summary.categoryBreakdown.map((c: any, i: number) => (
              <div key={c.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: catColors[i % catColors.length] }} />
                  <span className="text-sm text-gray-300">{INV_CAT_LABELS[c.category] || c.category}</span>
                </div>
                <span className="text-sm font-medium text-white">{fmt.currency(c.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investments list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">All Investments</h2>
          <button onClick={openNew} className="btn-primary flex items-center gap-1 text-xs px-3 py-1.5">
            <Plus size={12} /> Add
          </button>
        </div>

        {investments.length === 0 ? (
          <div className="card border-dashed text-center py-8 text-gray-500 text-sm">
            No investments recorded yet. Add your first investment to track ROI.
          </div>
        ) : (
          <div className="space-y-2">
            {investments.map(inv => (
              <div key={inv.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{inv.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {INV_CAT_LABELS[inv.category] || inv.category} · {inv.investedAt?.split('T')[0] || inv.investedAt}
                    </p>
                    {inv.notes && <p className="text-xs text-gray-600 mt-0.5 truncate">{inv.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-sm font-semibold text-red-400">{fmt.currency(inv.amount)}</span>
                    <button onClick={() => openEdit(inv)} className="p-1.5 text-gray-500 hover:text-white bg-gray-800 rounded-lg"><Edit2 size={12} /></button>
                    <button onClick={() => setDeleteId(inv.id)} className="p-1.5 text-gray-500 hover:text-red-400 bg-gray-800 rounded-lg"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Investment' : 'Add Investment'}>
        <div className="space-y-3">
          <Field label="Description *">
            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Sewing machine, packaging materials" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {INV_CATEGORIES.map(c => <option key={c} value={c}>{INV_CAT_LABELS[c]}</option>)}
              </select>
            </Field>
            <Field label="Amount (RM) *">
              <input type="number" step="0.01" className="input" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </Field>
          </div>
          <Field label="Date *">
            <input type="date" className="input" value={form.investedAt}
              onChange={e => setForm(f => ({ ...f, investedAt: e.target.value }))} />
          </Field>
          <Field label="Notes">
            <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes" />
          </Field>
          <button onClick={save} className="btn-primary w-full">Save</button>
        </div>
      </Modal>

      {/* Settings modal */}
      <Modal open={settingsModal} onClose={() => setSettingsModal(false)} title="Overhead Rates">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Flat costs automatically added to every order (products &amp; services).
          </p>
          <Field label="Electricity per item (RM)">
            <input type="number" step="0.01" className="input" value={settingsForm.electricityRatePerService}
              onChange={e => setSettingsForm(f => ({ ...f, electricityRatePerService: e.target.value }))}
              placeholder="e.g. 0.50" />
          </Field>
          <Field label="Labour per item (RM)">
            <input type="number" step="0.01" className="input" value={settingsForm.laborRatePerService}
              onChange={e => setSettingsForm(f => ({ ...f, laborRatePerService: e.target.value }))}
              placeholder="e.g. 5.00" />
          </Field>
          <button onClick={saveSettings} className="btn-primary w-full">Save Settings</button>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={del}
        title="Delete Investment" message="Remove this investment record?" danger />
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EarningsPage() {
  const [tab, setTab] = useState<'overview' | 'investments'>('overview')
  const [year, setYear] = useState(new Date().getFullYear())

  return (
    <div className="pb-6">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Earnings</h1>
          <p className="text-sm text-gray-400">Financial overview</p>
        </div>
        <TrendingUp size={22} className="text-brand-400" />
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4 grid grid-cols-2 gap-2">
        {([
          ['overview', 'Overview'],
          ['investments', 'Investments & ROI'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`py-2 rounded-xl text-xs font-medium transition-colors ${tab === key ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab year={year} onYearChange={setYear} />}
      {tab === 'investments' && <InvestmentsTab />}
    </div>
  )
}
