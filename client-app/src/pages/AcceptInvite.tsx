import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { portalAuthApi } from '../api/client'
import { useAuthStore } from '../store/auth'
import { APP_NAME } from '../config'
import { Loader2, AlertTriangle, KeyRound, AlertCircle } from 'lucide-react'

function getErrorMessage(err: any, fallback: string): string {
  if (!err.response) return 'Unable to reach the server. Check your connection.'
  const msg = err.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  if (typeof msg === 'string' && msg.trim()) return msg
  return fallback
}

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match.'); return }

    setSubmitting(true)
    try {
      const res = await portalAuthApi.acceptInvite(token, form.newPassword)
      setAuth(res.user, res.access_token)
      navigate('/')
    } catch (err: any) {
      setError(getErrorMessage(err, 'This invite link is invalid or has expired. Ask your service provider to resend it.'))
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
            <KeyRound size={28} className="text-brand-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-gray-400 text-sm mt-1">Set Up Your Account</p>
        </div>

        <div className="card">
          {!token ? (
            <div className="text-center space-y-3 py-2">
              <AlertTriangle size={32} className="text-yellow-400 mx-auto" />
              <p className="text-white font-medium">Invalid invite link</p>
              <p className="text-gray-500 text-sm">Please contact your service provider to resend the invitation.</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-white mb-1">Create your password</h2>
              <p className="text-gray-500 text-sm mb-5">Set a password to access your account.</p>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-900/20 border border-red-800/40 px-3 py-2.5 mb-4">
                  <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <form onSubmit={handle} className="space-y-4" noValidate>
                <div>
                  <label className="label">Password</label>
                  <input type="password" className="input" placeholder="At least 6 characters"
                    value={form.newPassword} autoFocus autoComplete="new-password"
                    onChange={e => { setForm(f => ({ ...f, newPassword: e.target.value })); setError('') }} />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className="input" placeholder="Repeat your password"
                    value={form.confirmPassword} autoComplete="new-password"
                    onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setError('') }} />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Setting up…' : 'Create Account & Sign In'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-gray-600 mt-4">
            <Link to="/login" className="text-gray-500 hover:text-brand-400 transition-colors">
              Already have a password? Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
