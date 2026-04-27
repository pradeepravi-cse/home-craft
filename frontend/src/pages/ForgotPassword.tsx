import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/client'
import { getErrorMessage } from '../utils'
import { APP_NAME } from '../config'
import { Loader2, ArrowLeft, KeyRound, MailCheck, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Please enter your email address.'); return }

    setSubmitting(true)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to send reset email. Please try again.'))
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
          <p className="text-gray-400 text-sm mt-1">Forgot Password</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-center mx-auto">
                <MailCheck size={22} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-white">Check your email</h2>
                <p className="text-gray-500 text-sm mt-1">
                  A password reset link has been sent to{' '}
                  <span className="text-gray-300">{email}</span>. It expires in 1 hour.
                </p>
              </div>
              <p className="text-xs text-gray-600">Didn't receive it? Check your spam folder.</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-white mb-1">Reset your password</h2>
              <p className="text-gray-500 text-sm mb-5">Enter your email and we'll send you a reset link.</p>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-900/20 border border-red-800/40 px-3 py-2.5 mb-4">
                  <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <form onSubmit={handle} className="space-y-4" noValidate>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Sending…' : 'Send Reset Link'}
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
