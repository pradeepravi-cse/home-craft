import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ShoppingBag, Ruler, User } from 'lucide-react'
import { useAuthStore } from './store/auth'
import LoginPage from './pages/Login'
import AcceptInvitePage from './pages/AcceptInvite'
import { OrdersPage, OrderDetailPage } from './pages/Orders'
import MeasurementsPage from './pages/Measurements'
import ProfilePage from './pages/Profile'

function BottomNav() {
  const location = useLocation()
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const items = [
    { path: '/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/measurements', icon: Ruler, label: 'Measurements' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 z-40">
      <div className="flex justify-around max-w-lg mx-auto">
        {items.map(({ path, icon: Icon, label }) => {
          const active = isActive(path)
          return (
            <Link key={path} to={path}
              className={`flex flex-col items-center gap-1 py-3 px-6 text-xs font-medium transition-colors ${
                active ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'
              }`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="min-h-screen pb-20">
      {children}
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
          success: { iconTheme: { primary: '#c026d3', secondary: '#fdf4ff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />

        <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
        <Route path="/measurements" element={<RequireAuth><MeasurementsPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
