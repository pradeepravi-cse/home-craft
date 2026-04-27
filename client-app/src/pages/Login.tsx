import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { portalAuthApi } from '../api/client'
import { useAuthStore } from '../store/auth'
import { APP_NAME, APP_TAGLINE } from '../config'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

function getErrorMessage(err: any, fallback: string): string {
  if (!err.response) return 'Unable to reach the server. Check your connection.'
  const msg = err.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  if (typeof msg === 'string' && msg.trim()) return msg
  if (err.response?.status === 429) return 'Too many attempts. Please wait 15 minutes and try again.'
  return fallback
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth, user } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const successMessage = (location.state as any)?.message || ''

  useEffect(() => { if (user) navigate('/') }, [])

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.email.trim()) { setError('Email is required.'); return }
    if (!form.password) { setError('Password is required.'); return }

    setSubmitting(true)
    try {
      const res = await portalAuthApi.login(form.email.trim(), form.password)
      setAuth(res.user, res.access_token)
      navigate('/')
    } catch (err: any) {
      setError(getErrorMessage(err, 'Invalid email or password.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-brand-900/20 to-transparent pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏡</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-gray-400 text-sm mt-1">{APP_TAGLINE}</p>
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-semibold text-white mb-1">Welcome</h2>
          <p className="text-gray-500 text-sm mb-5">Sign in to view your orders and measurements</p>

          {successMessage && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-900/20 border border-emerald-800/40 px-3 py-2.5 mb-4">
              <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-300">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-900/20 border border-red-800/40 px-3 py-2.5 mb-4">
              <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handle} className="space-y-4" noValidate>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={form.email} autoComplete="email"
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setError('') }} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} autoComplete="current-password"
                onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError('') }} />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-4">
            <Link to="/forgot-password" className="text-gray-500 hover:text-brand-400 transition-colors">
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
