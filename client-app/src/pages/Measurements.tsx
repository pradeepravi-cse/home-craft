import { useEffect, useState } from 'react'
import { portalMeasurementsApi } from '../api/client'
import { Loader2, Ruler } from 'lucide-react'
import toast from 'react-hot-toast'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

const MEASUREMENT_LABELS: Record<string, string> = {
  palluLength: 'Pallu Length',
  shoulderToNavel: 'Shoulder to Navel',
  waistToFloor: 'Waist to Floor',
  bodyWrap: 'Body Wrap',
}

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalMeasurementsApi.list()
      .then(setMeasurements)
      .catch(() => toast.error('Failed to load measurements'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold text-white">My Measurements</h1>

      {measurements.length === 0 ? (
        <div className="card border-dashed text-center py-12">
          <Ruler size={36} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No measurements recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {measurements.map(m => (
            <div key={m.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{m.label || 'Measurements'}</p>
                <span className="text-xs text-gray-500">{fmtDate(m.createdAt)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {Object.entries(MEASUREMENT_LABELS).map(([key, label]) =>
                  m[key] != null ? (
                    <div key={key}>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm font-medium text-white">{m[key]} {m.unit}</p>
                    </div>
                  ) : null
                )}
              </div>
              {m.notes && (
                <p className="text-xs text-gray-500 border-t border-gray-800 pt-2">{m.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
