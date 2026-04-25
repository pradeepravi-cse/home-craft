import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShoppingBag, TrendingUp,
  Package, Scissors, LogOut, Menu, X, FlaskConical, Sun, Moon,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/auth'
import { useThemeStore } from '../../store/theme'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/orders', icon: ShoppingBag, label: 'Orders' },
  { path: '/services', icon: Scissors, label: 'Services' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/recipes', icon: FlaskConical, label: 'Recipes' },
  { path: '/earnings', icon: TrendingUp, label: 'Earnings' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* ── Sidebar (iPad / desktop) ── */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:fixed md:inset-y-0 md:left-0 md:z-40 border-r border-gray-800 bg-gray-900">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-800">
          <h1 className="font-display text-lg font-bold text-brand-400 leading-tight">Preethys'</h1>
          <p className="font-display text-base font-semibold text-white leading-tight">Business</p>
          <p className="text-xs text-gray-500 mt-0.5">Business Manager</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-900/50 text-brand-300 border border-brand-800/40'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-brand-500 capitalize mt-0.5">{user?.role?.toLowerCase()}</p>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col md:pl-60 min-w-0 overflow-x-hidden">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-brand-400 leading-none">Preethys' Business</h1>
            <p className="text-xs text-gray-500">Business Manager</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden md:flex sticky top-0 z-30 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-6 py-3 items-center justify-between">
          <p className="text-sm text-gray-400">Welcome back, <span className="text-white font-medium">{user?.name}</span></p>
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Mobile slide-out menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
            <div className="relative ml-auto w-64 bg-gray-900 border-l border-gray-800 p-6 flex flex-col">
              <div className="mb-6">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <nav className="flex-1 space-y-1">
                {navItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive(path)
                        ? 'bg-brand-900/50 text-brand-300'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                ))}
              </nav>
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors mt-4"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-6 md:px-0">
          <div className="max-w-3xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Bottom Nav (mobile only) — show first 5 items */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-gray-900/95 backdrop-blur border-t border-gray-800">
          <div className="flex justify-around max-w-lg mx-auto">
            {navItems.slice(0, 5).map(({ path, icon: Icon, label }) => {
              const active = isActive(path)
              return (
                <Link
                  key={path}
                  to={path}
                  className={`nav-link flex-1 ${active ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
