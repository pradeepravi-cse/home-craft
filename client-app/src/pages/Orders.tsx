import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { portalOrdersApi } from '../api/client'
import { Loader2, ShoppingBag, ArrowLeft, ChevronRight, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress',
  READY: 'Ready for Pickup', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-800 text-gray-400',
  CONFIRMED: 'bg-blue-900/40 text-blue-300',
  IN_PROGRESS: 'bg-yellow-900/40 text-yellow-300',
  READY: 'bg-emerald-900/40 text-emerald-300',
  COMPLETED: 'bg-brand-900/40 text-brand-300',
  CANCELLED: 'bg-red-900/40 text-red-400',
}

function fmt(n: number) { return `RM ${Number(n).toFixed(2)}` }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Orders List ──────────────────────────────────────────────────────────────
export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalOrdersApi.list()
      .then(setOrders)
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold text-white">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card border-dashed text-center py-12">
          <ShoppingBag size={36} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`}
              className="card flex items-center gap-3 hover:border-gray-700 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={10} /> {fmtDate(order.createdAt)}
                  {order.scheduledDate && ` · Due ${fmtDate(order.scheduledDate)}`}
                </p>
                {order.items?.length > 0 && (
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {order.items.map((i: any) => i.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold text-white">{fmt(order.totalAmount)}</span>
                <ChevronRight size={16} className="text-gray-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Order Detail ─────────────────────────────────────────────────────────────
export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalOrdersApi.get(id!)
      .then(setOrder)
      .catch(() => { toast.error('Order not found'); navigate('/orders') })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )
  if (!order) return null

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={14} /> Back to orders
      </button>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
          <span className="text-xs text-gray-500">{fmtDate(order.createdAt)}</span>
        </div>

        {order.scheduledDate && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Due date</span>
            <span className="text-white">{fmtDate(order.scheduledDate)}</span>
          </div>
        )}
        {order.completedDate && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Completed</span>
            <span className="text-emerald-400">{fmtDate(order.completedDate)}</span>
          </div>
        )}
        {order.notes && (
          <p className="text-xs text-gray-500 border-t border-gray-800 pt-2">{order.notes}</p>
        )}
      </div>

      {order.items?.length > 0 && (
        <div className="card space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Items</p>
          {order.items.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <span className="text-white">{item.name}</span>
                {item.quantity > 1 && <span className="text-gray-500 ml-1">×{item.quantity}</span>}
                {item.itemStatus && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.itemStatus}</p>
                )}
              </div>
              <span className="text-white font-medium">{fmt(item.subtotal)}</span>
            </div>
          ))}
          <div className="border-t border-gray-800 pt-2 flex justify-between text-sm font-semibold">
            <span className="text-gray-300">Total</span>
            <span className="text-white">{fmt(order.totalAmount)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
