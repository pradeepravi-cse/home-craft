import { useEffect, useState } from 'react'
import { servicesApi } from '../api/client'
import { PageHeader, Empty, Spinner, Badge, Modal, Field, ConfirmDialog } from '../components/ui'
import { fmt } from '../utils'
import toast from 'react-hot-toast'
import {
  Plus, Scissors, Edit2, Trash2, CheckCircle, XCircle, Lock, Unlock,
  ArrowUp, ArrowDown,
} from 'lucide-react'

// ─── Workflow Step Builder ─────────────────────────────────────────────────────

function WorkflowBuilder({
  steps, onChange,
}: {
  steps: string[]
  onChange: (steps: string[]) => void
}) {
  const addStep = () => onChange([...steps, ''])
  const removeStep = (i: number) => {
    if (steps.length <= 1) return
    onChange(steps.filter((_, idx) => idx !== i))
  }
  const updateStep = (i: number, val: string) =>
    onChange(steps.map((s, idx) => (idx === i ? val : s)))
  const moveUp = (i: number) => {
    if (i === 0) return
    const next = [...steps]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onChange(next)
  }
  const moveDown = (i: number) => {
    if (i === steps.length - 1) return
    const next = [...steps]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          {/* Position badge */}
          <span className={`w-5 h-5 rounded-full flex-shrink-0 text-xs flex items-center justify-center font-bold ${
            i === 0 ? 'bg-blue-900/60 text-blue-300' :
            i === steps.length - 1 ? 'bg-emerald-900/60 text-emerald-300' :
            'bg-gray-800 text-gray-400'
          }`}>{i + 1}</span>
          <input
            className="input flex-1 text-sm py-2"
            value={label}
            onChange={e => updateStep(i, e.target.value)}
            placeholder={i === 0 ? 'First step (e.g. Received)' : i === steps.length - 1 ? 'Last step (e.g. Completed)' : 'Step name…'}
          />
          {/* Reorder */}
          <div className="flex flex-col gap-0.5">
            <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
              className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors">
              <ArrowUp size={11} />
            </button>
            <button type="button" onClick={() => moveDown(i)} disabled={i === steps.length - 1}
              className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors">
              <ArrowDown size={11} />
            </button>
          </div>
          <button type="button" onClick={() => removeStep(i)} disabled={steps.length <= 1}
            className="p-1 text-gray-600 hover:text-red-400 disabled:opacity-20 transition-colors flex-shrink-0">
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      <button type="button" onClick={addStep}
        className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors mt-1">
        <Plus size={12} /> Add Step
      </button>

      {steps.length >= 2 && (
        <div className="rounded-xl bg-gray-800/60 border border-gray-700/40 p-2.5 space-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-blue-900/60 text-blue-300 flex items-center justify-center font-bold text-xs">1</span>
            <span>Initial step — <span className="text-gray-300">{steps[0] || '(unnamed)'}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-900/60 text-emerald-300 flex items-center justify-center font-bold text-xs">{steps.length}</span>
            <span>Completion step — <span className="text-gray-300">{steps[steps.length - 1] || '(unnamed)'}</span></span>
          </div>
        </div>
      )}
    </div>
  )
}

/** Convert step label to a safe ID string */
function labelToId(label: string): string {
  return label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_') || 'STEP'
}

/** Build WorkflowDefinition JSON from ordered step labels */
function buildWorkflow(stepLabels: string[]) {
  const ids = stepLabels.map((l, i) =>
    l.trim() ? labelToId(l) : `STEP_${i + 1}`,
  )
  // Deduplicate IDs by appending index if needed
  const seen = new Map<string, number>()
  const uniqueIds = ids.map(id => {
    const count = seen.get(id) ?? 0
    seen.set(id, count + 1)
    return count > 0 ? `${id}_${count + 1}` : id
  })

  const steps = stepLabels.map((label, i) => ({
    id: uniqueIds[i],
    label: label.trim() || `Step ${i + 1}`,
    transitions: i < stepLabels.length - 1 ? [uniqueIds[i + 1]] : [],
  }))

  return {
    steps,
    initialStep: uniqueIds[0] ?? 'STEP_1',
    completionStep: uniqueIds[uniqueIds.length - 1] ?? 'STEP_1',
    dependencies: [],
  }
}

const DEFAULT_STEP_LABELS = ['Received', 'In Progress', 'Ready', 'Completed']

// ─── Service Modal ─────────────────────────────────────────────────────────────

function ServiceModal({
  open, onClose, service, onSaved,
}: {
  open: boolean; onClose: () => void; service?: any; onSaved: () => void
}) {
  const isEdit = Boolean(service)
  const [form, setForm] = useState({
    name: '', description: '', basePrice: '', isOptional: false, isActive: true,
  })
  const [stepLabels, setStepLabels] = useState<string[]>(DEFAULT_STEP_LABELS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        description: service.description || '',
        basePrice: String(service.basePrice),
        isOptional: service.isOptional,
        isActive: service.isActive,
      })
      // Extract step labels from existing workflow
      const labels: string[] = service.workflowDefinition?.steps?.map((s: any) => s.label) ?? DEFAULT_STEP_LABELS
      setStepLabels(labels.length > 0 ? labels : DEFAULT_STEP_LABELS)
    } else {
      setForm({ name: '', description: '', basePrice: '', isOptional: false, isActive: true })
      setStepLabels([...DEFAULT_STEP_LABELS])
    }
  }, [service, open])

  const submit = async () => {
    if (!form.name || !form.basePrice) { toast.error('Name and price are required'); return }
    const emptySteps = stepLabels.filter(l => !l.trim())
    if (emptySteps.length > 0) { toast.error('All workflow steps must have a name'); return }
    if (stepLabels.length < 2) { toast.error('Workflow needs at least 2 steps'); return }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        basePrice: parseFloat(form.basePrice),
        isOptional: form.isOptional,
        isActive: form.isActive,
        workflowDefinition: buildWorkflow(stepLabels),
      }
      if (isEdit) await servicesApi.update(service.id, payload)
      else await servicesApi.create(payload)
      toast.success(isEdit ? 'Service updated' : 'Service created')
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Service' : 'New Service'}>
      <div className="space-y-3">
        <Field label="Service Name *">
          <input className="input" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Saree Pleating" />
        </Field>
        <Field label="Description">
          <textarea className="input" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Short description…" />
        </Field>
        <Field label="Base Price (RM) *">
          <input type="number" step="0.01" className="input" value={form.basePrice}
            onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
            placeholder="0.00" />
        </Field>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setForm(f => ({ ...f, isOptional: !f.isOptional }))}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              form.isOptional ? 'bg-amber-900/30 border-amber-700/50 text-amber-300' : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}>
            {form.isOptional ? <Unlock size={14} /> : <Lock size={14} />}
            {form.isOptional ? 'Optional (add-on)' : 'Required (entry)'}
          </button>
          <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              form.isActive ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300' : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}>
            {form.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {form.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>

        {/* Workflow builder */}
        <Field label="Workflow Steps">
          <p className="text-xs text-gray-500 mb-2">
            Add steps in order — the first is the starting step, the last is the completion step.
          </p>
          <WorkflowBuilder steps={stepLabels} onChange={setStepLabels} />
        </Field>

        <button onClick={submit} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving…' : isEdit ? 'Update Service' : 'Create Service'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Services Page ─────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editService, setEditService] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const load = () => servicesApi.list().then(setServices).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openNew = () => { setEditService(null); setModalOpen(true) }
  const openEdit = (s: any) => { setEditService(s); setModalOpen(true) }

  const deleteService = async () => {
    if (!deleteTarget) return
    try {
      await servicesApi.delete(deleteTarget.id)
      toast.success('Service deleted')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
    setDeleteTarget(null)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle={`${services.length} services`}
        action={
          <button onClick={openNew} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} /> New
          </button>
        }
      />

      {services.length === 0 ? (
        <Empty
          icon={<Scissors size={40} />}
          message="No services yet"
          action={<button onClick={openNew} className="btn-primary text-sm">Add first service</button>}
        />
      ) : (
        <div className="px-4 space-y-2">
          {services.map(s => (
            <div key={s.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-900/40 border border-brand-800/40 flex items-center justify-center flex-shrink-0">
                  <Scissors size={16} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white">{s.name}</p>
                    <Badge className={s.isActive ? 'bg-emerald-900/40 text-emerald-300' : 'bg-gray-800 text-gray-500'}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={s.isOptional ? 'bg-amber-900/40 text-amber-300' : 'bg-blue-900/40 text-blue-300'}>
                      {s.isOptional ? 'Add-on' : 'Required'}
                    </Badge>
                  </div>
                  {s.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{s.description}</p>}

                  {/* Workflow steps preview */}
                  {s.workflowDefinition?.steps && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.workflowDefinition.steps.map((step: any, i: number) => (
                        <span key={step.id} className="flex items-center gap-1 min-w-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full truncate max-w-[90px] ${
                            step.id === s.workflowDefinition.completionStep
                              ? 'bg-emerald-900/40 text-emerald-400'
                              : 'bg-gray-800 text-gray-400'
                          }`}>{step.label}</span>
                          {i < s.workflowDefinition.steps.length - 1 && (
                            <span className="text-gray-700 text-xs flex-shrink-0">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-semibold text-brand-300">{fmt.currency(s.basePrice)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        service={editService}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteService}
        title="Delete Service"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        danger
      />
    </div>
  )
}
