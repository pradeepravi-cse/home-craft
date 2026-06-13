import { useCallback, useEffect, useState } from 'react'
import { Activity, RefreshCw, Server, Database, Smartphone, Clock } from 'lucide-react'
import { statusApi, AppStatus } from '../api'

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${seconds % 60}s`
}

function StatusBadge({ ok, okLabel, badLabel }: { ok: boolean; okLabel: string; badLabel: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
      {ok ? okLabel : badLabel}
    </span>
  )
}

function InfoCard({
  icon: Icon, label, value, sub,
}: { icon: typeof Server; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-gray-100 break-all">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  )
}

export default function StatusPage() {
  const [status, setStatus] = useState<AppStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await statusApi.get()
      setStatus(data)
      setCheckedAt(new Date())
    } catch {
      setStatus(null)
      setError('Could not reach the API. The backend may be down or unreachable.')
      setCheckedAt(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const apiUp = !!status
  const dbUp = status?.database === 'up'

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Activity size={20} className="text-brand-400" />
            App Status
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Deployed versions and service health</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && !status && !error && (
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 text-sm py-12">
          <RefreshCw size={16} className="animate-spin" />
          Checking status…
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {(status || error) && (
        <>
          {/* Overall health */}
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">API</span>
              <StatusBadge ok={apiUp} okLabel="Online" badLabel="Offline" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Database</span>
              <StatusBadge ok={dbUp} okLabel="Connected" badLabel={apiUp ? 'Down' : 'Unknown'} />
            </div>
            {checkedAt && (
              <span className="text-xs text-gray-500 ml-auto">
                Last checked {checkedAt.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Versions & details */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoCard
              icon={Smartphone}
              label="Frontend version"
              value={`v${__APP_VERSION__}`}
              sub="Baked into this build at compile time"
            />
            <InfoCard
              icon={Server}
              label="Backend version"
              value={status ? `v${status.version}` : '—'}
              sub={status ? `Environment: ${status.environment}` : 'Unavailable'}
            />
            <InfoCard
              icon={Clock}
              label="API uptime"
              value={status ? formatUptime(status.uptimeSeconds) : '—'}
              sub={status ? `Server time: ${new Date(status.timestamp).toLocaleString()}` : undefined}
            />
            <InfoCard
              icon={Database}
              label="Database"
              value={status ? (dbUp ? 'PostgreSQL up' : 'Unreachable') : '—'}
              sub={status ? `Overall status: ${status.status}` : undefined}
            />
          </div>
        </>
      )}
    </div>
  )
}
