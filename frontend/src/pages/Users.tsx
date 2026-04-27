import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { usersApi } from '../api/client'
import { PageHeader, Spinner, Modal, Field, ConfirmDialog, Badge } from '../components/ui'
import { useAuthStore } from '../store/auth'
import { getErrorMessage } from '../utils'
import toast from 'react-hot-toast'
import { Plus, ShieldCheck, ShieldOff, Trash2, Users, Globe } from 'lucide-react'
import { fmt } from '../utils'

const INTERNAL_ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-brand-900/40 text-brand-300 border border-brand-800/40',
  CLIENT: 'bg-gray-800 text-gray-300',
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const [tab, setTab] = useState<'internal' | 'portal'>('internal')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'CLIENT' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() =>
    usersApi.list().then(setUsers).finally(() => setLoading(false)), [])

  useEffect(() => { load() }, [load])

  // Internal = staff/admin (no customer link)
  const internalUsers = users.filter(u => !u.customerId)
  // Portal = customer portal accounts (linked to a customer)
  const portalUsers = users.filter(u => !!u.customerId)

  const openInvite = () => {
    setForm({ name: '', email: '', role: 'CLIENT' })
    setModal(true)
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await usersApi.invite({ name: form.name, email: form.email, role: form.role })
      toast.success(`Invite sent to ${form.name}`)
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

  const displayed = tab === 'internal' ? internalUsers : portalUsers

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle={`${internalUsers.length} internal · ${portalUsers.length} portal`}
        action={
          tab === 'internal' ? (
            <button onClick={openInvite} className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={16} /> Add User
            </button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="px-4 md:px-6 mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setTab('internal')}
          className={`py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            tab === 'internal' ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Users size={13} />
          Internal ({internalUsers.length})
        </button>
        <button
          onClick={() => setTab('portal')}
          className={`py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            tab === 'portal' ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Globe size={13} />
          Client Portal ({portalUsers.length})
        </button>
      </div>

      <div className="px-4 md:px-6 space-y-2">
        {displayed.length === 0 ? (
          <div className="card border-dashed text-center py-10">
            {tab === 'internal' ? (
              <>
                <Users size={36} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No internal users yet</p>
                <button onClick={openInvite} className="mt-3 btn-primary text-sm">Add first user</button>
              </>
            ) : (
              <>
                <Globe size={36} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No customers have been invited to the portal yet</p>
                <p className="text-gray-600 text-xs mt-1">
                  Open a customer profile and click <strong className="text-gray-500">Invite to Portal</strong>
                </p>
              </>
            )}
          </div>
        ) : (
          displayed.map(u => {
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
                      {tab === 'portal' && (
                        <Badge className="bg-emerald-900/30 text-emerald-400">Portal</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {tab === 'portal'
                        ? `Invited ${fmt.date(u.createdAt)}`
                        : `Added ${fmt.date(u.createdAt)}`
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Role selector only for internal users */}
                    {tab === 'internal' && (
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className={`text-xs rounded-lg px-2 py-1 border-0 outline-none cursor-pointer ${INTERNAL_ROLE_COLORS[u.role]} disabled:cursor-default`}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="CLIENT">Staff</option>
                      </select>
                    )}

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

                {/* Portal tab: link back to the customer record */}
                {tab === 'portal' && u.customerId && (
                  <div className="mt-2 pt-2 border-t border-gray-800">
                    <Link
                      to={`/customers/${u.customerId}`}
                      className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      View customer profile →
                    </Link>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add Internal User modal */}
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
