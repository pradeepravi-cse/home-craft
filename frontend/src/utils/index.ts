import { format } from 'date-fns'
import clsx from 'clsx'
export { clsx }

export const fmt = {
  currency: (n: number) => `RM ${Number(n).toFixed(2)}`,
  date: (d: string | Date) => format(new Date(d), 'dd MMM yyyy'),
  dateTime: (d: string | Date) => format(new Date(d), 'dd MMM yyyy, h:mm a'),
  short: (d: string | Date) => format(new Date(d), 'dd MMM'),
}

export const STATUS_LABELS: Record<string, string> = {
  received: 'Received', processing: 'Processing', ready: 'Ready',
  collected: 'Collected', draped: 'Draped', completed: 'Completed',
}
export const STATUS_COLORS: Record<string, string> = {
  received: 'bg-blue-900/40 text-blue-300',
  processing: 'bg-yellow-900/40 text-yellow-300',
  ready: 'bg-emerald-900/40 text-emerald-300',
  collected: 'bg-purple-900/40 text-purple-300',
  draped: 'bg-pink-900/40 text-pink-300',
  completed: 'bg-gray-800 text-gray-400',
}
export const ORDER_TYPE_LABELS: Record<string, string> = {
  pre_pleating: 'Pre-Pleating', draping: 'Draping', combo: 'Combo',
}
export const ORDER_TYPE_COLORS: Record<string, string> = {
  pre_pleating: 'bg-brand-900/40 text-brand-300',
  draping: 'bg-amber-900/40 text-amber-300',
  combo: 'bg-teal-900/40 text-teal-300',
}
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  packing: 'Packing', safety_pins: 'Safety Pins', iron: 'Ironing',
  electricity: 'Electricity', transport: 'Transport', material: 'Material', other: 'Other',
}
