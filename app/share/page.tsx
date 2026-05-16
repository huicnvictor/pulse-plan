'use client'
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { usePulsePlanStore } from '@/lib/store'
import { cn, getMonthDays, todayStr, formatDate } from '@/lib/utils'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const HOUR_HEIGHT = 56
const START_HOUR = 6
const END_HOUR = 24

function getTaskPosition(time: string, duration = 60) {
  const [h, m] = time.split(':').map(Number)
  const startMin = Math.max(h * 60 + m, START_HOUR * 60)
  const endMin = Math.min(h * 60 + m + duration, END_HOUR * 60)
  const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 28)
  return { top, height }
}

export default function SharePage() {
  const tasks = usePulsePlanStore((s) => s.tasks)
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewDate, setViewDate] = useState(new Date())

  const days = getMonthDays(viewDate.getFullYear(), viewDate.getMonth())
  const currentMonth = viewDate.getMonth()

  const tasksByDate = tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
    acc[t.date] = acc[t.date] ? [...acc[t.date], t] : [t]
    return acc
  }, {})

  const dayTasks = (tasksByDate[selectedDate] ?? [])
    .filter((t) => t.time)
    .sort((a, b) => (a.time! > b.time! ? 1 : -1))

  const hasUnscheduled = (tasksByDate[selectedDate] ?? []).some((t) => !t.time)

  const scrollRef = useRef<HTMLDivElement>(null)
  const now = new Date()
  const nowTop = ((now.getHours() * 60 + now.getMinutes() - START_HOUR * 60) / 60) * HOUR_HEIGHT
  const isToday = selectedDate === today

  useEffect(() => {
    if (!isToday || !scrollRef.current) return
    scrollRef.current.scrollTop = Math.max(nowTop - 80, 0)
  }, [isToday, nowTop, selectedDate])

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

  return (
    <div className="min-h-screen bg-neumo-bg text-neumo-text font-sans">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-neumo-bg shadow-neumo-sm rounded-b-3xl">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-neumo-accent"
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
          >
            <Lock size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neumo-text">Hui&apos;s Calendar</p>
            <p className="text-[11px] text-neumo-muted">Busy times only · Details are private</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-neumo-bg shadow-neumo-press text-neumo-muted">
          Read-only view
        </span>
      </div>

      <div className="flex flex-col md:flex-row max-w-4xl mx-auto p-6 gap-6">
        {/* Calendar */}
        <div className="md:w-80 shrink-0 rounded-3xl bg-neumo-bg shadow-neumo-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-neumo-text">
              {format(viewDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="w-8 h-8 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-muted hover:text-neumo-text transition-all flex items-center justify-center"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="w-8 h-8 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-muted hover:text-neumo-text transition-all flex items-center justify-center"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-neumo-subtle py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, i) => {
              const dateStr = formatDate(day)
              const isCurrentMonth = day.getMonth() === currentMonth
              const isTodayDate = dateStr === today
              const isSelected = dateStr === selectedDate
              const hasTasks = (tasksByDate[dateStr] ?? []).length > 0

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    'relative flex flex-col items-center py-2 rounded-xl transition-all duration-200',
                    isSelected
                      ? 'text-white shadow-neumo-accent'
                      : isTodayDate
                      ? 'bg-neumo-bg shadow-neumo-press text-neumo-accent'
                      : isCurrentMonth
                      ? 'bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-text'
                      : 'text-neumo-subtle hover:shadow-neumo-press'
                  )}
                  style={
                    isSelected
                      ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' }
                      : undefined
                  }
                >
                  <span className={cn('text-xs font-semibold leading-none', isSelected ? 'text-white' : '')}>
                    {day.getDate()}
                  </span>
                  {hasTasks && (
                    <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5', isSelected ? 'bg-white/80' : 'bg-neumo-muted')} />
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-5 p-3 rounded-2xl bg-neumo-bg shadow-neumo-press space-y-2">
            <p className="text-[10px] font-semibold text-neumo-muted tracking-wider uppercase">Legend</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-neumo-bg shadow-neumo-xs" />
              <span className="text-[11px] text-neumo-muted">Booked (details hidden)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-neumo-bg shadow-neumo-press" />
              <span className="text-[11px] text-neumo-muted">Available</span>
            </div>
          </div>
        </div>

        {/* Day timeline */}
        <div className="flex-1 min-w-0 rounded-3xl bg-neumo-bg shadow-neumo-sm p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-neumo-text">
              {isToday ? 'Today' : format(parseISO(selectedDate), 'EEEE')}
            </p>
            <p className="text-xs text-neumo-muted mt-0.5">
              {format(parseISO(selectedDate), 'MMMM d, yyyy')}
              {dayTasks.length > 0
                ? ` · ${dayTasks.length} booked slot${dayTasks.length > 1 ? 's' : ''}`
                : ' · All clear'}
              {hasUnscheduled ? ' · +unscheduled' : ''}
            </p>
          </div>

          <div
            ref={scrollRef}
            className="overflow-y-auto rounded-2xl bg-neumo-bg shadow-neumo-press"
            style={{ maxHeight: 560 }}
          >
            <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
              {/* Hour lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 flex items-start pointer-events-none"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                >
                  <span className="text-[10px] text-neumo-subtle w-12 shrink-0 text-right pr-2.5 leading-none -mt-[6px] select-none">
                    {String(h).padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 border-t border-neumo-dark/40" />
                </div>
              ))}

              {/* Current time */}
              {isToday && nowTop > 0 && nowTop < hours.length * HOUR_HEIGHT && (
                <div
                  className="absolute left-12 right-0 flex items-center pointer-events-none z-10"
                  style={{ top: nowTop }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1" />
                  <div className="flex-1 border-t border-red-500/60" />
                </div>
              )}

              {/* Booked blocks */}
              {dayTasks.map((t) => {
                const { top, height } = getTaskPosition(t.time!, t.duration)
                return (
                  <div
                    key={t.id}
                    className="absolute rounded-lg overflow-hidden"
                    style={{ top: top + 1, height: height - 2, left: 48, right: 8 }}
                  >
                    <div className="h-full px-3 py-1.5 flex flex-col justify-center bg-neumo-bg shadow-neumo-xs border-l-[3px] border-l-neumo-accent rounded-lg">
                      <p className="text-xs font-semibold text-neumo-text">Booked</p>
                      {height > 38 && (
                        <p className="text-[10px] text-neumo-muted mt-0.5">
                          {t.time}{t.duration ? ` · ${t.duration}min` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
