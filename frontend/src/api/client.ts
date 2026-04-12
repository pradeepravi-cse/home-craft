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
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  setupCheck: () => api.get('/auth/setup').then(r => r.data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }).then(r => r.data),
  register: (email: string, password: string, name: string) => api.post('/auth/register', { email, password, name }).then(r => r.data),
}

// Dashboard
export const dashboardApi = {
  overview: () => api.get('/dashboard/overview').then(r => r.data),
}

// Clients
export const clientsApi = {
  list: (search?: string) => api.get('/clients', { params: { search } }).then(r => r.data),
  get: (id: string) => api.get(`/clients/${id}`).then(r => r.data),
  create: (data: any) => api.post('/clients', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/clients/${id}`).then(r => r.data),
}

// Measurements
export const measurementsApi = {
  byClient: (clientId: string) => api.get(`/measurements/client/${clientId}`).then(r => r.data),
  create: (data: any) => api.post('/measurements', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/measurements/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/measurements/${id}`).then(r => r.data),
}

// Orders
export const ordersApi = {
  list: (params?: any) => api.get('/orders', { params }).then(r => r.data),
  get: (id: string) => api.get(`/orders/${id}`).then(r => r.data),
  create: (data: any) => api.post('/orders', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data).then(r => r.data),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }).then(r => r.data),
  delete: (id: string) => api.delete(`/orders/${id}`).then(r => r.data),
  stats: () => api.get('/orders/stats').then(r => r.data),
}

// Expenses
export const expensesApi = {
  byOrder: (orderId: string) => api.get(`/expenses/order/${orderId}`).then(r => r.data),
  create: (data: any) => api.post('/expenses', data).then(r => r.data),
  delete: (id: string) => api.delete(`/expenses/${id}`).then(r => r.data),
  summary: () => api.get('/expenses/summary').then(r => r.data),
}

// Earnings
export const earningsApi = {
  summary: () => api.get('/earnings/summary').then(r => r.data),
  monthly: (year?: number) => api.get('/earnings/monthly', { params: { year } }).then(r => r.data),
  byType: () => api.get('/earnings/by-type').then(r => r.data),
}

// Products
export const productsApi = {
  list: (businessLine?: string) => api.get('/products', { params: { businessLine } }).then(r => r.data),
  get: (id: string) => api.get(`/products/${id}`).then(r => r.data),
  create: (data: any) => api.post('/products', data).then(r => r.data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/products/${id}`).then(r => r.data),
}

// Inventory
export const inventoryApi = {
  stock: (productId?: string) => api.get('/inventory/stock', { params: { productId } }).then(r => r.data),
  lowStock: () => api.get('/inventory/low-stock').then(r => r.data),
  transactions: (productId: string) => api.get(`/inventory/transactions/${productId}`).then(r => r.data),
  addTransaction: (data: any) => api.post('/inventory/transaction', data).then(r => r.data),
  setMinStock: (productId: string, minStock: number) => api.patch(`/inventory/min-stock/${productId}`, { minStock }).then(r => r.data),
}
