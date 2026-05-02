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
      // Clear both localStorage and the persisted Zustand store so the login
      // page doesn't immediately redirect back to / on reload.
      localStorage.removeItem('pp_token')
      localStorage.removeItem('pp-auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Users (team management)
export const usersApi = {
  list: () => api.get('/users').then(r => r.data),
  invite: (data: { name: string; email: string; role: string }) =>
    api.post('/users', data).then(r => r.data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }).then(r => r.data),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`).then(r => r.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(r => r.data),
}

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }).then(r => r.data),
  acceptInvite: (token: string, newPassword: string) => api.post('/auth/accept-invite', { token, newPassword }).then(r => r.data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }).then(r => r.data),
  changePassword: (currentPassword: string, newPassword: string) => api.post('/auth/change-password', { currentPassword, newPassword }).then(r => r.data),
}

// Dashboard
export const dashboardApi = {
  overview: () => api.get('/dashboard/overview').then(r => r.data),
}

// Customers
export const customersApi = {
  list: (search?: string) => api.get('/customers', { params: { search } }).then(r => r.data),
  get: (id: string) => api.get(`/customers/${id}`).then(r => r.data),
  create: (data: any) => api.post('/customers', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/customers/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/customers/${id}`).then(r => r.data),
  referralStats: (id: string) => api.get(`/customers/${id}/referral-stats`).then(r => r.data),
}

// Measurements
export const measurementsApi = {
  byCustomer: (customerId: string) => api.get(`/measurements/customer/${customerId}`).then(r => r.data),
  create: (data: any) => api.post('/measurements', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/measurements/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/measurements/${id}`).then(r => r.data),
}

// Services (catalog)
export const servicesApi = {
  list: (active?: boolean) => api.get('/services', { params: active ? { active: 'true' } : {} }).then(r => r.data),
  get: (id: string) => api.get(`/services/${id}`).then(r => r.data),
  create: (data: any) => api.post('/services', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/services/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/services/${id}`).then(r => r.data),
}

// Orders
export const ordersApi = {
  list: (params?: { customerId?: string; status?: string }) => api.get('/orders', { params }).then(r => r.data),
  get: (id: string) => api.get(`/orders/${id}`).then(r => r.data),
  create: (data: any) => api.post('/orders', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/orders/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/orders/${id}`).then(r => r.data),
  stats: () => api.get('/orders/stats').then(r => r.data),
  getWorkflow: (id: string) => api.get(`/orders/${id}/workflow`).then(r => r.data),
  updateItemStatus: (orderId: string, itemId: string, targetStep: string) =>
    api.patch(`/orders/${orderId}/items/${itemId}/status`, { targetStep }).then(r => r.data),
}

// Expenses
export const expensesApi = {
  byOrder: (orderId: string) => api.get(`/expenses/order/${orderId}`).then(r => r.data),
  create: (data: any) => api.post('/expenses', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/expenses/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/expenses/${id}`).then(r => r.data),
}

// Earnings
export const earningsApi = {
  summary: () => api.get('/earnings/summary').then(r => r.data),
  monthly: (year?: number) => api.get('/earnings/monthly', { params: { year } }).then(r => r.data),
  byBusinessLine: () => api.get('/earnings/by-business-line').then(r => r.data),
  topProducts: (limit?: number) => api.get('/earnings/top-products', { params: { limit } }).then(r => r.data),
  topServices: (limit?: number) => api.get('/earnings/top-services', { params: { limit } }).then(r => r.data),
  customerLTV: (limit?: number) => api.get('/earnings/customer-ltv', { params: { limit } }).then(r => r.data),
}

// Pricing rules
export const pricingRulesApi = {
  list: () => api.get('/pricing-rules').then(r => r.data),
  get: (id: string) => api.get(`/pricing-rules/${id}`).then(r => r.data),
  create: (data: any) => api.post('/pricing-rules', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/pricing-rules/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/pricing-rules/${id}`).then(r => r.data),
  calculate: (items: any[]) => api.post('/pricing-rules/calculate', { items }).then(r => r.data),
}

// Raw Materials
export const rawMaterialsApi = {
  list: (category?: string, activeOnly?: boolean) =>
    api.get('/raw-materials', { params: { category, activeOnly: activeOnly ? 'true' : undefined } }).then(r => r.data),
  get: (id: string) => api.get(`/raw-materials/${id}`).then(r => r.data),
  create: (data: any) => api.post('/raw-materials', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/raw-materials/${id}`, data).then(r => r.data),
  adjustStock: (id: string, quantity: number, notes?: string) =>
    api.patch(`/raw-materials/${id}/stock`, { quantity, notes }).then(r => r.data),
  delete: (id: string) => api.delete(`/raw-materials/${id}`).then(r => r.data),
}

// Recipes (product cost calculation)
export const recipesApi = {
  all: () => api.get('/recipes').then(r => r.data),
  byProduct: (productId: string) => api.get(`/recipes/product/${productId}`).then(r => r.data),
  cost: (productId: string) => api.get(`/recipes/product/${productId}/cost`).then(r => r.data),
  previewCost: (data: any) => api.post('/recipes/preview-cost', data).then(r => r.data),
  save: (productId: string, data: any) => api.put(`/recipes/product/${productId}`, data).then(r => r.data),
  delete: (productId: string) => api.delete(`/recipes/product/${productId}`).then(r => r.data),
}

// Business Settings
export const businessSettingsApi = {
  get: () => api.get('/business-settings').then(r => r.data),
  update: (data: { electricityRatePerService?: number; laborRatePerService?: number }) =>
    api.patch('/business-settings', data).then(r => r.data),
}

// Investments
export const investmentsApi = {
  list: () => api.get('/investments').then(r => r.data),
  summary: () => api.get('/investments/summary').then(r => r.data),
  create: (data: any) => api.post('/investments', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/investments/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/investments/${id}`).then(r => r.data),
}

// Service Recipes
export const serviceRecipesApi = {
  all: () => api.get('/service-recipes').then(r => r.data),
  byService: (serviceId: string) => api.get(`/service-recipes/service/${serviceId}`).then(r => r.data),
  cost: (serviceId: string) => api.get(`/service-recipes/service/${serviceId}/cost`).then(r => r.data),
  save: (serviceId: string, data: any) => api.put(`/service-recipes/service/${serviceId}`, data).then(r => r.data),
  delete: (serviceId: string) => api.delete(`/service-recipes/service/${serviceId}`).then(r => r.data),
}

// Inventory
export const inventoryApi = {
  stock: (productId?: string) => api.get('/inventory/stock', { params: { productId } }).then(r => r.data),
  lowStock: () => api.get('/inventory/low-stock').then(r => r.data),
  transactions: (productId: string) => api.get(`/inventory/transactions/${productId}`).then(r => r.data),
  addTransaction: (data: any) => api.post('/inventory/transaction', data).then(r => r.data),
  setMinStock: (productId: string, minStock: number) => api.patch(`/inventory/min-stock/${productId}`, { minStock }).then(r => r.data),
}
