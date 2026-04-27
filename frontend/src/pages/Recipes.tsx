import { useEffect, useState, useCallback } from 'react'
import { rawMaterialsApi, servicesApi, serviceRecipesApi } from '../api/client'
import { PageHeader, Empty, Spinner, Modal, Field, ConfirmDialog } from '../components/ui'
import { fmt } from '../utils'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Edit2, FlaskConical,
  ChevronRight, AlertTriangle, Scissors,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

const MAT_CATEGORIES = ['INGREDIENT', 'PACKAGING', 'OVERHEAD'] as const
const MAT_CAT_LABELS: Record<string, string> = {
  INGREDIENT: '🌾 Ingredient',
  PACKAGING: '📦 Packaging',
  OVERHEAD: '⚡ Overhead',
}

// ─── Raw Materials Tab ─────────────────────────────────────────────────────────

function RawMaterialsTab() {
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [stockModal, setStockModal] = useState<any>(null)
  const [stockQty, setStockQty] = useState('')
  const [form, setForm] = useState({
    name: '', unit: 'g', category: 'INGREDIENT',
    totalCost: '', totalQty: '',
    currentStock: '', minStock: '', notes: '',
  })

  const load = useCallback(() =>
    rawMaterialsApi.list().then(setMaterials).finally(() => setLoading(false)), [])

  useEffect(() => { load() }, [load])

  const computedCostPerUnit = (() => {
    const cost = parseFloat(form.totalCost)
    const qty = parseFloat(form.totalQty)
    if (cost > 0 && qty > 0) return cost / qty
    return null
  })()

  const openNew = () => {
    setEditItem(null)
    setForm({ name: '', unit: 'g', category: 'INGREDIENT', totalCost: '', totalQty: '', currentStock: '', minStock: '', notes: '' })
    setModal(true)
  }

  const openEdit = (m: any) => {
    setEditItem(m)
    setForm({
      name: m.name, unit: m.unit, category: m.category,
      // Reverse-populate: show cost per unit directly (1 unit at that price)
      totalCost: String(m.costPerUnit), totalQty: '1',
      currentStock: String(m.currentStock),
      minStock: String(m.minStock), notes: m.notes || '',
    })
    setModal(true)
  }

  const save = async () => {
    if (!form.name || !form.unit) { toast.error('Name and unit are required'); return }
    if (!form.totalCost || !form.totalQty) { toast.error('Enter total purchase cost and quantity'); return }
    const totalCost = parseFloat(form.totalCost)
    const totalQty = parseFloat(form.totalQty)
    if (isNaN(totalCost) || isNaN(totalQty) || totalQty <= 0) {
      toast.error('Enter valid cost and quantity'); return
    }
    const costPerUnit = totalCost / totalQty
    try {
      const data = {
        name: form.name, unit: form.unit,
        costPerUnit,
        category: form.category,
        currentStock: parseFloat(form.currentStock) || 0,
        minStock: parseFloat(form.minStock) || 0,
        notes: form.notes || undefined,
      }
      if (editItem) await rawMaterialsApi.update(editItem.id, data)
      else await rawMaterialsApi.create(data)
      toast.success(editItem ? 'Updated' : 'Created')
      setModal(false); load()
    } catch { toast.error('Failed to save') }
  }

  const adjustStock = async () => {
    if (!stockQty || isNaN(parseFloat(stockQty))) { toast.error('Enter a valid quantity'); return }
    try {
      await rawMaterialsApi.adjustStock(stockModal.id, parseFloat(stockQty))
      toast.success('Stock updated')
      setStockModal(null); setStockQty(''); load()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const del = async () => {
    if (!deleteId) return
    try { await rawMaterialsApi.delete(deleteId); toast.success('Deleted'); load() }
    catch { toast.error('Cannot delete — may be used in a recipe') }
    setDeleteId(null)
  }

  if (loading) return <Spinner />

  const grouped = MAT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = materials.filter(m => m.category === cat)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="px-4 space-y-4">
      <button onClick={openNew} className="btn-primary flex items-center gap-1.5 text-sm w-full justify-center">
        <Plus size={16} /> Add Raw Material
      </button>

      {materials.length === 0 ? (
        <Empty icon={<FlaskConical size={40} />} message="No raw materials yet" />
      ) : (
        MAT_CATEGORIES.map(cat => {
          const items = grouped[cat]
          if (!items.length) return null
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{MAT_CAT_LABELS[cat]}</p>
              <div className="space-y-2">
                {items.map(m => {
                  const low = Number(m.currentStock) <= Number(m.minStock) && Number(m.minStock) > 0
                  return (
                    <div key={m.id} className="card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{m.name}</p>
                            {low && <AlertTriangle size={13} className="text-yellow-400" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {fmt.currency(m.costPerUnit)} per {m.unit}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-3">
                          <span className={`text-sm font-semibold ${low ? 'text-yellow-400' : 'text-white'}`}>
                            {Number(m.currentStock)} {m.unit}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setStockModal(m); setStockQty('') }}
                              className="px-2 py-1 text-xs rounded-lg bg-brand-900/40 text-brand-400 hover:bg-brand-800/40 transition-colors"
                            >
                              +/- Stock
                            </button>
                            <button onClick={() => openEdit(m)} className="p-1.5 text-gray-500 hover:text-white bg-gray-800 rounded-lg transition-colors"><Edit2 size={12} /></button>
                            <button onClick={() => setDeleteId(m.id)} className="p-1.5 text-gray-500 hover:text-red-400 bg-gray-800 rounded-lg transition-colors"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* Add/Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Material' : 'Add Raw Material'}>
        <div className="space-y-3">
          <Field label="Name *">
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Safety Pins" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit *">
              <input className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="g, ml, pcs, roll…" />
            </Field>
            <Field label="Category">
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {MAT_CATEGORIES.map(c => <option key={c} value={c}>{MAT_CAT_LABELS[c]}</option>)}
              </select>
            </Field>
          </div>

          {/* Purchase-based price entry */}
          <div className="rounded-xl bg-gray-800/60 border border-gray-700/40 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-400">Purchase Details</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Total Cost (RM) *`}>
                <input type="number" step="0.01" className="input" value={form.totalCost}
                  onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))}
                  placeholder="e.g. 8.50" />
              </Field>
              <Field label={`Total ${form.unit || 'Qty'} Purchased *`}>
                <input type="number" step="0.001" className="input" value={form.totalQty}
                  onChange={e => setForm(f => ({ ...f, totalQty: e.target.value }))}
                  placeholder={`e.g. 1000`} />
              </Field>
            </div>
            {computedCostPerUnit !== null && (
              <div className="flex items-center justify-between rounded-lg bg-brand-900/30 border border-brand-800/40 px-3 py-2">
                <span className="text-xs text-gray-400">Cost per {form.unit || 'unit'}</span>
                <span className="text-sm font-semibold text-brand-300">{fmt.currency(computedCostPerUnit)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Current Stock">
              <input type="number" step="0.001" className="input" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))} />
            </Field>
            <Field label="Min Stock Alert">
              <input type="number" step="0.001" className="input" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notes">
            <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
          </Field>
          <button onClick={save} className="btn-primary w-full">Save</button>
        </div>
      </Modal>

      {/* Stock adjust modal */}
      <Modal open={Boolean(stockModal)} onClose={() => setStockModal(null)} title={`Adjust Stock: ${stockModal?.name}`}>
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Current: <span className="text-white font-medium">{Number(stockModal?.currentStock)} {stockModal?.unit}</span>
          </p>
          <Field label="Quantity (positive = add, negative = deduct)">
            <input type="number" step="0.001" className="input" value={stockQty}
              onChange={e => setStockQty(e.target.value)}
              placeholder="e.g. 1000 to add, -200 to deduct" />
          </Field>
          <button onClick={adjustStock} className="btn-primary w-full">Update Stock</button>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={del}
        title="Delete Raw Material" message="This will remove the material. Cannot delete if used in a recipe." danger />
    </div>
  )
}


// ─── Service Costs Tab ────────────────────────────────────────────────────────

function ServiceCostsTab() {
  const [services, setServices] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<{ rawMaterialId: string; quantity: string }[]>([])
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [costs, setCosts] = useState<Record<string, any>>({})
  const [loadingCost, setLoadingCost] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [s, m, r] = await Promise.all([servicesApi.list(), rawMaterialsApi.list(), serviceRecipesApi.all()])
    setServices(s); setMaterials(m); setRecipes(r)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setSelectedService(null); setDescription('')
    setLines([{ rawMaterialId: '', quantity: '' }])
    setModal(true)
  }

  const openEdit = (recipe: any) => {
    setSelectedService(services.find(s => s.id === recipe.serviceId) || null)
    setDescription(recipe.description || '')
    setLines(recipe.items.map((i: any) => ({ rawMaterialId: i.rawMaterialId, quantity: String(i.quantity) })))
    setModal(true)
  }

  const addLine = () => setLines(l => [...l, { rawMaterialId: '', quantity: '' }])
  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: string, value: string) =>
    setLines(l => l.map((line, idx) => idx === i ? { ...line, [field]: value } : line))

  const save = async () => {
    if (!selectedService) { toast.error('Select a service'); return }
    const items = lines.filter(l => l.rawMaterialId && l.quantity).map(l => ({
      rawMaterialId: l.rawMaterialId, quantity: parseFloat(l.quantity),
    }))
    if (!items.length) { toast.error('Add at least one material'); return }
    try {
      await serviceRecipesApi.save(selectedService.id, { description: description || undefined, items })
      toast.success('Service recipe saved')
      setModal(false); load()
    } catch { toast.error('Failed to save') }
  }

  const delRecipe = async () => {
    if (!deleteServiceId) return
    try { await serviceRecipesApi.delete(deleteServiceId); toast.success('Deleted'); load() }
    catch { toast.error('Failed') }
    setDeleteServiceId(null)
  }

  const loadCost = async (serviceId: string) => {
    if (expanded === serviceId) { setExpanded(null); return }
    if (costs[serviceId]) { setExpanded(serviceId); return }
    setLoadingCost(serviceId)
    try {
      const result = await serviceRecipesApi.cost(serviceId)
      setCosts(prev => ({ ...prev, [serviceId]: result }))
      setExpanded(serviceId)
    } catch { toast.error('Failed to load cost') }
    finally { setLoadingCost(null) }
  }

  if (loading) return <Spinner />

  return (
    <div className="px-4 space-y-3">
      <button onClick={openNew} className="btn-primary flex items-center gap-1.5 text-sm w-full justify-center">
        <Plus size={16} /> New Service Recipe
      </button>

      {materials.length === 0 && (
        <div className="card border-yellow-800/40 bg-yellow-900/10">
          <p className="text-xs text-yellow-400">Add raw materials first before building service recipes.</p>
        </div>
      )}

      {recipes.length === 0 ? (
        <Empty icon={<Scissors size={40} />} message="No service recipes yet. Define materials used per service." />
      ) : (
        recipes.map((recipe: any) => {
          const cost = costs[recipe.serviceId]
          const isOpen = expanded === recipe.serviceId
          const isLoading = loadingCost === recipe.serviceId

          return (
            <div key={recipe.id} className="card">
              <button onClick={() => loadCost(recipe.serviceId)} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Scissors size={14} className="text-brand-400 flex-shrink-0" />
                  <div className="text-left">
                    <span className="font-medium text-white text-sm">{recipe.service?.name}</span>
                    {recipe.description && (
                      <p className="text-xs text-gray-500 truncate">{recipe.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {isLoading && <Spinner />}
                  {cost && !isLoading && (
                    <span className="text-xs text-gray-400">
                      Cost: <span className="text-red-400 font-medium">{fmt.currency(cost.totalCost)}</span>
                    </span>
                  )}
                  <ChevronRight size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </div>
              </button>

              <div className="flex flex-wrap gap-1 mt-2">
                {recipe.items?.map((item: any) => (
                  <span key={item.id} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                    {item.rawMaterial?.name}: {item.quantity} {item.rawMaterial?.unit}
                  </span>
                ))}
              </div>

              {isOpen && cost && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <ServiceCostCard result={cost} service={recipe.service} />
                </div>
              )}

              <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-gray-800">
                <button onClick={() => openEdit(recipe)} className="p-1.5 text-gray-500 hover:text-white bg-gray-800 rounded-lg transition-colors"><Edit2 size={12} /></button>
                <button onClick={() => setDeleteServiceId(recipe.serviceId)} className="p-1.5 text-gray-500 hover:text-red-400 bg-gray-800 rounded-lg transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          )
        })
      )}

      {/* Service recipe modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Service Recipe">
        <div className="space-y-4">
          <Field label="Service *">
            <select className="input" value={selectedService?.id || ''}
              onChange={e => setSelectedService(services.find(s => s.id === e.target.value) || null)}>
              <option value="">Select service…</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>

          <Field label="Description">
            <input className="input" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Materials per pleating session" />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-300">Materials per execution</p>
              <button onClick={addLine} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-1">
              Include safety pins, stickers, packaging — physical materials used each time this service is performed.
            </p>
            <p className="text-xs text-amber-500/80 mb-2">
              ⚡ Electricity &amp; labour are auto-applied from overhead rates in Earnings → Investments &amp; ROI settings.
            </p>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select className="input flex-1 text-xs" value={line.rawMaterialId}
                    onChange={e => updateLine(i, 'rawMaterialId', e.target.value)}>
                    <option value="">Select material…</option>
                    {materials.filter(m => m.category !== 'OVERHEAD').map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                    ))}
                  </select>
                  <input type="number" step="0.001" className="input w-24 text-xs" placeholder="Qty"
                    value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} />
                  <button onClick={() => removeLine(i)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={save} className="btn-primary w-full">Save Service Recipe</button>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleteServiceId)} onClose={() => setDeleteServiceId(null)} onConfirm={delRecipe}
        title="Delete Service Recipe" message="Remove this recipe? The service won't be deleted." danger />
    </div>
  )
}

function ServiceCostCard({ result, service }: { result: any; service: any }) {
  return (
    <div className="rounded-xl bg-gray-800/60 border border-gray-700/40 p-3 space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Materials per Execution</p>
        <div className="space-y-1">
          {result.lines?.map((line: any) => (
            <div key={line.rawMaterialId} className="flex items-center justify-between text-xs">
              <span className="text-gray-300">{line.name}</span>
              <span className="text-gray-500">{line.quantity} {line.unit} × {fmt.currency(line.costPerUnit)}</span>
              <span className="text-white font-medium ml-2">{fmt.currency(line.lineCost)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-700/50 pt-2 space-y-1.5">
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-gray-300">Total material cost / execution</span>
          <span className="text-red-400">{fmt.currency(result.totalCost)}</span>
        </div>
        {service?.basePrice > 0 && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Service price</span>
            <span className="text-brand-300">{fmt.currency(service.basePrice)}</span>
          </div>
        )}
        {service?.basePrice > 0 && (
          <div className="flex justify-between text-xs text-gray-500 border-t border-gray-700/50 pt-1.5">
            <span>Gross margin</span>
            <span className={Number(service.basePrice) > result.totalCost ? 'text-emerald-400' : 'text-yellow-400'}>
              {fmt.currency(Number(service.basePrice) - result.totalCost)}
              {' '}
              ({Math.round(((Number(service.basePrice) - result.totalCost) / Number(service.basePrice)) * 100)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const [tab, setTab] = useState<'materials' | 'services'>('materials')

  return (
    <div className="pb-6">
      <PageHeader
        title="Recipes & Costs"
        subtitle="Raw materials and service costs"
      />

      {/* Tabs */}
      <div className="px-4 mb-4 grid grid-cols-2 gap-1.5">
        {([
          ['materials', 'Materials'],
          ['services', 'Service Costs'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-2 rounded-xl text-xs font-medium transition-colors ${
              tab === key ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'materials' && <RawMaterialsTab />}
      {tab === 'services' && <ServiceCostsTab />}
    </div>
  )
}
