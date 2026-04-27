import { useEffect, useState } from 'react'
import { portalProfileApi } from '../api/client'
import { useAuthStore } from '../store/auth'
import { Loader2, User, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { logout } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalProfileApi.get()
      .then(setProfile)
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <h1 className="font-display text-2xl font-bold text-white">My Profile</h1>

      {profile && (
        <div className="card space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
            <div className="w-10 h-10 rounded-full bg-brand-900/40 border border-brand-800/40 flex items-center justify-center">
              <User size={18} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-white">{profile.name}</p>
              {profile.email && <p className="text-sm text-gray-400">{profile.email}</p>}
            </div>
          </div>

          {profile.phone && (
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-white">{profile.phone}</p>
            </div>
          )}
          {profile.instagram && (
            <div>
              <p className="text-xs text-gray-500">Instagram</p>
              <p className="text-sm text-white">@{profile.instagram}</p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={logout}
        className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )
}
