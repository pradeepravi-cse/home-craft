import { useEffect, useState, useCallback } from 'react'
import { usersApi } from '../api/client'
import { PageHeader, Spinner, Modal, Field, ConfirmDialog, Badge } from '../components/ui'
import { useAuthStore } from '../store/auth'
import { getErrorMessage } from '../utils'
import toast from 'react-hot-toast'
import { Plus, UserX, ShieldCheck, ShieldOff, Trash2, Users } from 'lucide-react'
import { fmt } from '../utils'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  CLIENT: 'Staff',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-brand-900/40 text-brand-300 border border-brand-800/40',
  CLIENT: 'bg-gray-800 text-gray-300',
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'CLIENT' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() =>
    usersApi.list().then(setUsers).finally(() => setLoading(false)), [])

  useEffect(() => { load() }, [load])

  const openInvite = () => {
    setForm({ name: '', email: '', role: 'CLIENT' })
    setModal(true)
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await usersApi.invite({ name: form.name, email: form.email, role: form.role })
      toast.success(`${form.name} has been added`)
      setModal(false)
      load()
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to send invite. Check SMTP settings.'))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      await usersApi.toggleActive(id)
      toast.success(currentlyActive ? 'User deactivated' : 'User activated')
      load()
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to update user status.'))
    }
  }

  const changeRole = async (id: string, role: string) => {
    try {
      await usersApi.updateRole(id, role)
      toast.success(`Role updated to ${role === 'ADMIN' ? 'Admin' : 'Staff'}`)
      load()
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to update role.'))
    }
  }

  const remove = async () => {
    if (!deleteId) return
    try {
      await usersApi.delete(deleteId)
      toast.success('User removed')
      load()
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to remove user.'))
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${users.length} member${users.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={openInvite} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} /> Add User
          </button>
        }
      />

      <div className="px-4 md:px-6 space-y-2">
        {users.length === 0 ? (
          <div className="card border-dashed text-center py-10">
            <Users size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No team members yet</p>
          </div>
        ) : (
          users.map(u => {
            const isSelf = u.id === currentUser?.id
            return (
              <div key={u.id} className={`card ${!u.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-900/40 border border-brand-800/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-brand-300">
                      {u.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{u.name}</p>
                      {isSelf && <span className="text-xs text-gray-600">(you)</span>}
                      {!u.isActive && <Badge className="bg-red-900/30 text-red-400">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Added {fmt.date(u.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={u.role}
                      disabled={isSelf}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className={`text-xs rounded-lg px-2 py-1 border-0 outline-none cursor-pointer ${ROLE_COLORS[u.role]} disabled:cursor-default`}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="CLIENT">Staff</option>
                    </select>

                    {!isSelf && (
                      <>
                        <button
                          onClick={() => toggleActive(u.id, u.isActive)}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg bg-gray-800 text-gray-500 hover:text-white transition-colors"
                        >
                          {u.isActive ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                        </button>
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="p-1.5 rounded-lg bg-gray-800 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Team Member">
        <form onSubmit={invite} className="space-y-4">
          <Field label="Full Name *">
            <input className="input" placeholder="e.g. Priya" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </Field>
          <Field label="Email *">
            <input type="email" className="input" placeholder="priya@example.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </Field>
          <Field label="Role">
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="CLIENT">Staff — view and manage orders</option>
              <option value="ADMIN">Admin — full access</option>
            </select>
          </Field>
          <p className="text-xs text-gray-500">
            An invite email will be sent with a link for them to set their own password.
          </p>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Sending invite…' : 'Send Invite'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Remove User"
        message="This will permanently remove the user. They will no longer be able to log in."
        danger
      />
    </div>
  )
}
