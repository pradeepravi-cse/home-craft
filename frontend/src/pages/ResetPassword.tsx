import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/client'
import { getErrorMessage } from '../utils'
import { APP_NAME } from '../config'
import { Loader2, ArrowLeft, KeyRound, AlertTriangle, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match. Please re-enter them.')
      return
    }

    setSubmitting(true)
    try {
      await authApi.resetPassword(token, form.newPassword)
      navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } })
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to reset password. The link may have expired.'))
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
          <p className="text-gray-400 text-sm mt-1">Reset Password</p>
        </div>

        <div className="card">
          {!token ? (
            <div className="text-center space-y-3 py-2">
              <AlertTriangle size={32} className="text-yellow-400 mx-auto" />
              <p className="text-white font-medium">Invalid reset link</p>
              <p className="text-gray-500 text-sm">
                This link is missing a reset token. Please request a new one.
              </p>
              <Link to="/forgot-password" className="btn-primary w-full flex items-center justify-center">
                Request new link
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-white mb-1">Set a new password</h2>
              <p className="text-gray-500 text-sm mb-5">Choose a strong password for your account.</p>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-900/20 border border-red-800/40 px-3 py-2.5 mb-4">
                  <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <form onSubmit={handle} className="space-y-4" noValidate>
                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="At least 6 characters"
                    value={form.newPassword}
                    onChange={e => { setForm(f => ({ ...f, newPassword: e.target.value })); setError('') }}
                    autoComplete="new-password"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Repeat your new password"
                    value={form.confirmPassword}
                    onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setError('') }}
                    autoComplete="new-password"
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-gray-600 mt-4">
            <Link to="/login" className="text-brand-400 hover:text-brand-300 flex items-center justify-center gap-1">
              <ArrowLeft size={12} /> Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
