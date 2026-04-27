import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { PageHeader } from '../components/ui'
import { getErrorMessage } from '../utils'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.currentPassword) {
      setError('Please enter your current password.')
      return
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match. Please re-enter them.')
      return
    }
    if (form.newPassword === form.currentPassword) {
      setError('New password must be different from your current password.')
      return
    }

    setSubmitting(true)
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/'), 1500)
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to change password. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [key]: e.target.value }))
      setError('')
    },
  })

  return (
    <div>
      <PageHeader title="Change Password" subtitle="Update your account password" />

      <div className="px-4 md:px-6">
        <div className="card max-w-md">
          {success ? (
            <div className="flex items-center gap-3 py-2">
              <CheckCircle2 size={22} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Password changed</p>
                <p className="text-gray-500 text-sm">Redirecting you back…</p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-900/20 border border-red-800/40 px-3 py-2.5 mb-4">
                  <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <form onSubmit={handle} className="space-y-4" noValidate>
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" className="input" placeholder="Your current password"
                    autoComplete="current-password" {...field('currentPassword')} />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input" placeholder="At least 6 characters"
                    autoComplete="new-password" {...field('newPassword')} />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" className="input" placeholder="Repeat new password"
                    autoComplete="new-password" {...field('confirmPassword')} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? 'Saving…' : 'Change Password'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
