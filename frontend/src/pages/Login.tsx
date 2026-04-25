import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/auth'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, user } = useAuthStore()
  const [isSetup, setIsSetup] = useState(false)
  const [manualMode, setManualMode] = useState<'login' | 'register' | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  useEffect(() => {
    if (user) { navigate('/'); return }
    authApi.setupCheck().then(r => {
      setIsSetup(r.setupRequired)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Effective mode: manual override takes precedence over auto-detected
  const showRegister = manualMode === 'register' || (manualMode === null && isSetup)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      let res
      if (showRegister) {
        res = await authApi.register(form.email, form.password, form.name)
        toast.success('Account created!')
      } else {
        res = await authApi.login(form.email, form.password)
      }
      setAuth(res.user, res.access_token)
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Loader2 className="animate-spin text-brand-500" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Decorative top */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-brand-900/20 to-transparent pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏡</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">HomeCraft</h1>
          <p className="text-gray-400 text-sm mt-1">Business Manager</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="font-display text-xl font-semibold text-white mb-1">
            {showRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            {showRegister ? 'Set up your HomeCraft account' : 'Sign in to manage your business'}
          </p>

          <form onSubmit={handle} className="space-y-4">
            {showRegister && (
              <div>
                <label className="label">Your Name</label>
                <input
                  className="input"
                  placeholder="e.g. Priya"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {showRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-4">
            {showRegister ? (
              <>Already have an account?{' '}
                <button onClick={() => setManualMode('login')} className="text-brand-400 hover:text-brand-300">
                  Sign in
                </button>
              </>
            ) : (
              <>Don't have an account?{' '}
                <button onClick={() => setManualMode('register')} className="text-brand-400 hover:text-brand-300">
                  Create one
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
