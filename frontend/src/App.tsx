import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/auth'
import { useThemeStore } from './store/theme'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import { CustomersPage, CustomerFormPage, CustomerDetailPage } from './pages/Customers'
import { OrdersPage, NewOrderPage, OrderDetailPage } from './pages/Orders'
import EarningsPage from './pages/Earnings'
import ProductsPage from './pages/Products'
import ServicesPage from './pages/Services'
import RecipesPage from './pages/Recipes'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    const html = document.documentElement
    if (theme === 'light') {
      html.classList.add('light')
    } else {
      html.classList.remove('light')
    }
  }, [theme])

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
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />

        {/* Customers */}
        <Route path="/customers" element={<RequireAuth><CustomersPage /></RequireAuth>} />
        <Route path="/customers/new" element={<RequireAuth><CustomerFormPage /></RequireAuth>} />
        <Route path="/customers/:id" element={<RequireAuth><CustomerDetailPage /></RequireAuth>} />
        <Route path="/customers/:id/edit" element={<RequireAuth><CustomerFormPage /></RequireAuth>} />

        {/* Orders */}
        <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="/orders/new" element={<RequireAuth><NewOrderPage /></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />

        {/* Services */}
        <Route path="/services" element={<RequireAuth><ServicesPage /></RequireAuth>} />

        {/* Recipes & Costs */}
        <Route path="/recipes" element={<RequireAuth><RecipesPage /></RequireAuth>} />

        {/* Other */}
        <Route path="/earnings" element={<RequireAuth><EarningsPage /></RequireAuth>} />
        <Route path="/products" element={<RequireAuth><ProductsPage /></RequireAuth>} />

        {/* Legacy redirects */}
        <Route path="/clients" element={<Navigate to="/customers" replace />} />
        <Route path="/clients/*" element={<Navigate to="/customers" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
