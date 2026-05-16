import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayStr(): string {
  return formatDate(new Date())
}

export function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []

  // Pad start with previous month
  const startPad = firstDay.getDay()
  for (let i = startPad - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  // Pad end to complete the grid (6 rows × 7)
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d))
  }

  return days
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function categoryColor(category: string): string {
  const map: Record<string, string> = {
    Health: 'bg-emerald-500',
    Work: 'bg-blue-500',
    Study: 'bg-violet-500',
    Social: 'bg-pink-500',
    Finance: 'bg-amber-500',
    Creative: 'bg-orange-500',
    Personal: 'bg-cyan-500',
  }
  return map[category] ?? 'bg-neumo-subtle'
}

export function categoryTextColor(category: string): string {
  const map: Record<string, string> = {
    Health: 'text-emerald-600',
    Work: 'text-blue-600',
    Study: 'text-violet-600',
    Social: 'text-pink-600',
    Finance: 'text-amber-600',
    Creative: 'text-orange-600',
    Personal: 'text-cyan-600',
  }
  return map[category] ?? 'text-neumo-muted'
}

export function categoryBg(category: string): string {
  const map: Record<string, string> = {
    Health: 'bg-emerald-100 border-emerald-200',
    Work: 'bg-blue-100 border-blue-200',
    Study: 'bg-violet-100 border-violet-200',
    Social: 'bg-pink-100 border-pink-200',
    Finance: 'bg-amber-100 border-amber-200',
    Creative: 'bg-orange-100 border-orange-200',
    Personal: 'bg-cyan-100 border-cyan-200',
  }
  return map[category] ?? 'bg-neumo-bg border-neumo-dark/40'
}
