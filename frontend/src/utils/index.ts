import { format } from 'date-fns'
import clsx from 'clsx'
export { clsx }

export const fmt = {
  currency: (n: number) => `RM ${Number(n).toFixed(2)}`,
  date: (d: string | Date) => format(new Date(d), 'dd MMM yyyy'),
  dateTime: (d: string | Date) => format(new Date(d), 'dd MMM yyyy, h:mm a'),
  short: (d: string | Date) => format(new Date(d), 'dd MMM'),
}

// Order statuses (new model)
export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}
export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-800 text-gray-400',
  CONFIRMED: 'bg-blue-900/40 text-blue-300',
  IN_PROGRESS: 'bg-yellow-900/40 text-yellow-300',
  READY: 'bg-emerald-900/40 text-emerald-300',
  COMPLETED: 'bg-brand-900/40 text-brand-300',
  CANCELLED: 'bg-red-900/40 text-red-400',
}

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED']

export const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'IN_PROGRESS',
  IN_PROGRESS: 'READY',
  READY: 'COMPLETED',
}
export const NEXT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Confirm Order',
  CONFIRMED: 'Start Processing',
  IN_PROGRESS: 'Mark Ready',
  READY: 'Mark Complete',
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  PACKING: 'Packing',
  SAFETY_PINS: 'Safety Pins',
  IRON: 'Ironing',
  ELECTRICITY: 'Electricity',
  TRANSPORT: 'Transport',
  MATERIAL: 'Material',
  LABOR: 'Labor',
  OTHER: 'Other',
}

/** Turn-around time: days open (for active orders) or days taken (for completed) */
export const tat = (createdAt: string, completedDate?: string | null): string => {
  const start = new Date(createdAt)
  const end = completedDate ? new Date(completedDate) : new Date()
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000)
  if (days === 0) return '< 1d'
  return `${days}d`
}

/**
 * Extracts a human-readable message from any API error shape.
 * Handles: NestJS class-validator arrays, plain strings, network errors.
 */
export function getErrorMessage(err: any, fallback = 'Something went wrong. Please try again.'): string {
  if (!err.response) {
    return 'Unable to reach the server. Check your connection and try again.'
  }
  const msg = err.response?.data?.message
  if (Array.isArray(msg)) return msg[0] // class-validator returns array; first is most relevant
  if (typeof msg === 'string' && msg.trim()) return msg
  const status = err.response?.status
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (status >= 500) return 'A server error occurred. Please try again later.'
  return fallback
}

export const CONTACT_SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  referral: 'Referral',
  'walk-in': 'Walk-in',
}
