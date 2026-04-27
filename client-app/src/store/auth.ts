import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PortalUser {
  id: string
  email: string
  name: string
  customerId: string
}

interface AuthState {
  token: string | null
  user: PortalUser | null
  setAuth: (user: PortalUser, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (user, token) => {
        localStorage.setItem('portal_token', token)
        set({ user, token })
      },
      logout: () => {
        localStorage.removeItem('portal_token')
        set({ user: null, token: null })
      },
    }),
    { name: 'portal-auth' },
  ),
)
