import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pp_token')
      localStorage.removeItem('pp_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Types ──────────────────────────────────────────────
export interface User {
  id: string; email: string; name: string; role: string
}

export interface Client {
  id: string; name: string; phone?: string; instagram?: string
  notes?: string; contactSource: string
  measurements?: Measurement[]
  createdAt: string; updatedAt: string
}

export interface Measurement {
  id: string; clientId: string
  palluLength?: number; shoulderToNavel?: number
  waistToFloor?: number; bodyWrap?: number
  unit: string; notes?: string; label?: string
  createdAt: string
}

export type OrderType = 'pre_pleating' | 'draping' | 'combo'
export type OrderStatus = 'received' | 'processing' | 'ready' | 'collected' | 'draped' | 'completed'

export interface Order {
  id: string; clientId: string; client?: Client
  type: OrderType; status: OrderStatus
  sareeDescription?: string; sareeCount?: number
  priceCharged: number; totalExpenses: number
  palluLength?: number; shoulderToNavel?: number
  waistToFloor?: number; bodyWrap?: number
  notes?: string; scheduledDate?: string; completedDate?: string
  expenses?: Expense[]
  createdAt: string; updatedAt: string
}

export type ExpenseCategory = 'packing' | 'safety_pins' | 'iron' | 'electricity' | 'transport' | 'material' | 'other'

export interface Expense {
  id: string; orderId: string; category: ExpenseCategory
  description: string; amount: number; createdAt: string
}

export interface Product {
  id: string; name: string; description?: string
  businessLine: 'saree' | 'baking'; category?: string
  price: number; costPrice: number
  isActive: boolean; isPublic: boolean
  imageUrl?: string; unit?: string
  createdAt: string
}

export interface InventoryItem {
  id: string; productId: string; product?: Product
  quantity: number; unit?: string; lowStockThreshold?: number
  updatedAt: string
}

export interface DashboardStats {
  totalOrders: number; totalClients: number
  activeOrders: number; completedOrders: number
  totalRevenue: number; totalExpenses: number; netProfit: number
  thisMonthRevenue: number; thisMonthOrders: number
}

// ── API calls ──────────────────────────────────────────
export const authApi = {
  setupCheck: () => api.get('/auth/setup').then(r => r.data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }).then(r => r.data),
}

export const clientsApi = {
  list: (search?: string) => api.get('/clients', { params: { search } }).then(r => r.data),
  get: (id: string) => api.get(`/clients/${id}`).then(r => r.data),
  create: (data: Partial<Client>) => api.post('/clients', data).then(r => r.data),
  update: (id: string, data: Partial<Client>) => api.put(`/clients/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/clients/${id}`).then(r => r.data),
}

export const measurementsApi = {
  byClient: (clientId: string) => api.get(`/measurements/client/${clientId}`).then(r => r.data),
  create: (data: Partial<Measurement>) => api.post('/measurements', data).then(r => r.data),
  update: (id: string, data: Partial<Measurement>) => api.put(`/measurements/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/measurements/${id}`).then(r => r.data),
}

export const ordersApi = {
  list: (params?: { clientId?: string; status?: string; type?: string }) =>
    api.get('/orders', { params }).then(r => r.data),
  get: (id: string) => api.get(`/orders/${id}`).then(r => r.data),
  create: (data: Partial<Order>) => api.post('/orders', data).then(r => r.data),
  update: (id: string, data: Partial<Order>) => api.put(`/orders/${id}`, data).then(r => r.data),
  updateStatus: (id: string, status: OrderStatus) =>
    api.patch(`/orders/${id}/status`, { status }).then(r => r.data),
  delete: (id: string) => api.delete(`/orders/${id}`).then(r => r.data),
  stats: () => api.get('/orders/stats').then(r => r.data),
}

export const expensesApi = {
  byOrder: (orderId: string) => api.get(`/expenses/order/${orderId}`).then(r => r.data),
  create: (data: Partial<Expense>) => api.post('/expenses', data).then(r => r.data),
  delete: (id: string) => api.delete(`/expenses/${id}`).then(r => r.data),
  summary: () => api.get('/expenses/summary').then(r => r.data),
}

export const earningsApi = {
  summary: () => api.get('/earnings/summary').then(r => r.data),
  monthly: (year?: number) => api.get('/earnings/monthly', { params: { year } }).then(r => r.data),
  byType: () => api.get('/earnings/by-type').then(r => r.data),
}

export const productsApi = {
  list: (businessLine?: string) => api.get('/products', { params: { businessLine } }).then(r => r.data),
  get: (id: string) => api.get(`/products/${id}`).then(r => r.data),
  create: (data: Partial<Product>) => api.post('/products', data).then(r => r.data),
  update: (id: string, data: Partial<Product>) => api.put(`/products/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/products/${id}`).then(r => r.data),
}

export const inventoryApi = {
  list: () => api.get('/inventory').then(r => r.data),
  lowStock: () => api.get('/inventory/low-stock').then(r => r.data),
  transactions: (productId: string) => api.get(`/inventory/${productId}/transactions`).then(r => r.data),
  upsert: (data: any) => api.post('/inventory', data).then(r => r.data),
  addTransaction: (data: any) => api.post('/inventory/transaction', data).then(r => r.data),
}

export const dashboardApi = {
  get: () => api.get('/dashboard').then(r => r.data),
}
