import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('portal_token')
      localStorage.removeItem('portal_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export const portalAuthApi = {
  login: (email: string, password: string) =>
    api.post('/portal/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/portal/auth/me').then(r => r.data),
  acceptInvite: (token: string, newPassword: string) =>
    api.post('/auth/accept-invite', { token, newPassword }).then(r => r.data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }).then(r => r.data),
}

export const portalOrdersApi = {
  list: () => api.get('/portal/orders').then(r => r.data),
  get: (id: string) => api.get(`/portal/orders/${id}`).then(r => r.data),
}

export const portalMeasurementsApi = {
  list: () => api.get('/portal/measurements').then(r => r.data),
}

export const portalProfileApi = {
  get: () => api.get('/portal/profile').then(r => r.data),
}
