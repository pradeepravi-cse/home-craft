import { useEffect, useState } from 'react'
import { productsApi, inventoryApi } from '../api/client'
import { PageHeader, Empty, Spinner, Badge, Modal, Field, ConfirmDialog } from '../components/ui'
import { fmt } from '../utils'
import toast from 'react-hot-toast'
import { Plus, Package, Edit2, Trash2, AlertTriangle, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  cookies: '🍪 Cookies', cakes: '🎂 Cakes', brownies: '🍫 Brownies',
  puffs: '🥐 Puffs', other: '📦 Other',
}
const BIZ_LINE_LABELS: Record<string, string> = { saree: '🥻 Saree Services', baking: '🍰 Baking' }

export default function ProductsPage() {
  const [tab, setTab] = useState<'products' | 'inventory'>('products')
  const [products, setProducts] = useState<any[]>([])
  const [stock, setStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bizLine, setBizLine] = useState('baking')
  const [modal, setModal] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [txModal, setTxModal] = useState<any>(null)
  const [pForm, setPForm] = useState({ name: '', description: '', category: 'cookies', price: '', costPrice: '', unit: 'per piece', isActive: true, isPublic: true })
  const [txForm, setTxForm] = useState({ type: 'in', quantity: '', notes: '', unitCost: '' })

  const loadProducts = () => productsApi.list(bizLine).then(setProducts)
  const loadStock = () => inventoryApi.stock().then(setStock)

  useEffect(() => {
    Promise.all([loadProducts(), loadStock()]).finally(() => setLoading(false))
  }, [bizLine])

  const openEdit = (p: any) => {
    setEditProduct(p)
    setPForm({ name: p.name, description: p.description || '', category: p.category || 'cookies', price: p.price, costPrice: p.costPrice || '', unit: p.unit || 'per piece', isActive: p.isActive, isPublic: p.isPublic })
    setModal(true)
  }

  const saveProduct = async () => {
    try {
      const data = { ...pForm, price: parseFloat(pForm.price), costPrice: parseFloat(pForm.costPrice) || 0, businessLine: bizLine }
      if (editProduct) await productsApi.update(editProduct.id, data)
      else await productsApi.create(data)
      toast.success(editProduct ? 'Product updated' : 'Product created')
      setModal(false); setEditProduct(null)
      setPForm({ name: '', description: '', category: 'cookies', price: '', costPrice: '', unit: 'per piece', isActive: true, isPublic: true })
      loadProducts()
    } catch { toast.error('Failed to save') }
  }

  const deleteProduct = async () => {
    if (!deleteId) return
    await productsApi.delete(deleteId)
    toast.success('Product deleted')
    setDeleteId(null); loadProducts()
  }

  const saveTransaction = async () => {
    try {
      await inventoryApi.addTransaction({ productId: txModal.id, type: txForm.type, quantity: parseFloat(txForm.quantity), notes: txForm.notes, unitCost: parseFloat(txForm.unitCost) || null })
      toast.success('Stock updated')
      setTxModal(null); setTxForm({ type: 'in', quantity: '', notes: '', unitCost: '' })
      loadStock()
    } catch { toast.error('Failed to update stock') }
  }

  if (loading) return <Spinner />

  const getStock = (productId: string) => stock.find(s => s.productId === productId)

  return (
    <div className="pb-6">
      <PageHeader
        title="Products"
        subtitle="Manage your products & inventory"
        action={
          <button onClick={() => { setEditProduct(null); setModal(true) }} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} /> Add
          </button>
        }
      />

      {/* Tabs */}
      <div className="px-4 mb-4 flex gap-2">
        <button onClick={() => setTab('products')} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'products' ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>Products</button>
        <button onClick={() => setTab('inventory')} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'inventory' ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>Inventory</button>
      </div>

      {tab === 'products' && (
        <>
          {/* Business line selector */}
          <div className="px-4 mb-3 flex gap-2">
            {['baking', 'saree'].map(bl => (
              <button key={bl} onClick={() => setBizLine(bl)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${bizLine === bl ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {BIZ_LINE_LABELS[bl]}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <Empty icon={<Package size={40} />} message="No products yet" action={<button onClick={() => setModal(true)} className="btn-primary text-sm">Add first product</button>} />
          ) : (
            <div className="px-4 space-y-2">
              {products.map(p => {
                const s = getStock(p.id)
                const lowStock = s && Number(s.currentStock) <= Number(s.minStock) && Number(s.minStock) > 0
                return (
                  <div key={p.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{p.name}</p>
                          {!p.isActive && <Badge className="bg-gray-700 text-gray-400">Inactive</Badge>}
                          {p.isPublic && <Badge className="bg-emerald-900/40 text-emerald-400">Public</Badge>}
                          {lowStock && <AlertTriangle size={14} className="text-yellow-400" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{CATEGORY_LABELS[p.category]} · {p.unit}</p>
                        {p.description && <p className="text-xs text-gray-400 mt-1">{p.description}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-3">
                        <p className="text-base font-bold text-white">{fmt.currency(p.price)}</p>
                        {p.costPrice > 0 && <p className="text-xs text-gray-500">Cost: {fmt.currency(p.costPrice)}</p>}
                        <div className="flex gap-1.5 mt-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:text-white bg-gray-800 rounded-lg"><Edit2 size={12} /></button>
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-gray-500 hover:text-red-400 bg-gray-800 rounded-lg"><Trash2 size={12} /></button>
                          <button onClick={() => setTxModal(p)} className="p-1.5 text-gray-500 hover:text-brand-400 bg-gray-800 rounded-lg"><Package size={12} /></button>
                        </div>
                      </div>
                    </div>
                    {s && (
                      <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
                        <span className="text-gray-500">Stock</span>
                        <span className={lowStock ? 'text-yellow-400 font-medium' : 'text-gray-300'}>{Number(s.currentStock)} units</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'inventory' && (
        <div className="px-4 space-y-2">
          {stock.length === 0 ? (
            <Empty icon={<Package size={40} />} message="No stock records yet. Add transactions from Products tab." />
          ) : (
            stock.map(s => {
              const low = Number(s.currentStock) <= Number(s.minStock) && Number(s.minStock) > 0
              return (
                <div key={s.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{s.product?.name}</p>
                      <p className="text-xs text-gray-500">{s.product?.unit}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {low && <AlertTriangle size={14} className="text-yellow-400" />}
                      <div className="text-right">
                        <p className={`text-lg font-bold ${low ? 'text-yellow-400' : 'text-white'}`}>{Number(s.currentStock)}</p>
                        <p className="text-xs text-gray-500">Min: {Number(s.minStock)}</p>
                      </div>
                      <button onClick={() => setTxModal(s.product)} className="btn-secondary p-2"><RotateCcw size={14} /></button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Product modal */}
      <Modal open={modal} onClose={() => { setModal(false); setEditProduct(null) }} title={editProduct ? 'Edit Product' : 'New Product'}>
        <div className="space-y-3">
          <Field label="Name *"><input className="input" value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" required /></Field>
          <Field label="Description"><textarea className="input" value={pForm.description} onChange={e => setPForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" /></Field>
          <Field label="Category">
            <select className="input" value={pForm.category} onChange={e => setPForm(f => ({ ...f, category: e.target.value }))}>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Selling Price (RM) *"><input type="number" step="0.01" className="input" value={pForm.price} onChange={e => setPForm(f => ({ ...f, price: e.target.value }))} required /></Field>
            <Field label="Cost Price (RM)"><input type="number" step="0.01" className="input" value={pForm.costPrice} onChange={e => setPForm(f => ({ ...f, costPrice: e.target.value }))} /></Field>
          </div>
          <Field label="Unit"><input className="input" value={pForm.unit} onChange={e => setPForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. per piece, per dozen" /></Field>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={pForm.isActive} onChange={e => setPForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={pForm.isPublic} onChange={e => setPForm(f => ({ ...f, isPublic: e.target.checked }))} className="rounded" />
              Public API
            </label>
          </div>
          <button onClick={saveProduct} className="btn-primary w-full">Save Product</button>
        </div>
      </Modal>

      {/* Stock transaction modal */}
      <Modal open={Boolean(txModal)} onClose={() => setTxModal(null)} title={`Update Stock: ${txModal?.name}`}>
        <div className="space-y-3">
          <div className="flex gap-2">
            {[['in', '📦 Stock In', 'text-emerald-400'], ['out', '📤 Stock Out', 'text-red-400'], ['adjustment', '⚖️ Adjust', 'text-blue-400']].map(([v, l, c]) => (
              <button key={v} type="button" onClick={() => setTxForm(f => ({ ...f, type: v }))}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${txForm.type === v ? 'bg-gray-700 border-gray-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                {l}
              </button>
            ))}
          </div>
          <Field label={txForm.type === 'adjustment' ? 'Set Stock To' : 'Quantity'}>
            <input type="number" step="0.1" className="input" value={txForm.quantity} onChange={e => setTxForm(f => ({ ...f, quantity: e.target.value }))} required />
          </Field>
          {txForm.type === 'in' && (
            <Field label="Unit Cost (RM)"><input type="number" step="0.01" className="input" value={txForm.unitCost} onChange={e => setTxForm(f => ({ ...f, unitCost: e.target.value }))} /></Field>
          )}
          <Field label="Notes"><input className="input" value={txForm.notes} onChange={e => setTxForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" /></Field>
          <button onClick={saveTransaction} disabled={!txForm.quantity} className="btn-primary w-full">Update Stock</button>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={deleteProduct}
        title="Delete Product" message="This will permanently delete the product and all inventory records." danger />
    </div>
  )
}
