import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/auth'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import { ClientsPage, ClientFormPage, ClientDetailPage } from './pages/Clients'
import { OrdersPage, NewOrderPage, OrderDetailPage } from './pages/Orders'
import EarningsPage from './pages/Earnings'
import ProductsPage from './pages/Products'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
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
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/clients" element={<RequireAuth><ClientsPage /></RequireAuth>} />
        <Route path="/clients/new" element={<RequireAuth><ClientFormPage /></RequireAuth>} />
        <Route path="/clients/:id" element={<RequireAuth><ClientDetailPage /></RequireAuth>} />
        <Route path="/clients/:id/edit" element={<RequireAuth><ClientFormPage /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="/orders/new" element={<RequireAuth><NewOrderPage /></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
        <Route path="/orders/:id/edit" element={<RequireAuth><NewOrderPage /></RequireAuth>} />
        <Route path="/earnings" element={<RequireAuth><EarningsPage /></RequireAuth>} />
        <Route path="/products" element={<RequireAuth><ProductsPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
