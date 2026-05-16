'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, isSameDay as fnsIsSameDay } from 'date-fns'
import { cn, getMonthDays, todayStr, formatDate } from '@/lib/utils'
import { usePulsePlanStore } from '@/lib/store'
import { categoryColor } from '@/lib/utils'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface Props {
  selectedDate: string
  onSelectDate: (date: string) => void
}

export function CalendarGrid({ selectedDate, onSelectDate }: Props) {
  const [viewDate, setViewDate] = useState(new Date())
  const tasks = usePulsePlanStore((s) => s.tasks)
  const today = todayStr()

  const days = getMonthDays(viewDate.getFullYear(), viewDate.getMonth())

  const tasksByDate = tasks.reduce<Record<string, typeof tasks>>(
    (acc, t) => {
      acc[t.date] = acc[t.date] ? [...acc[t.date], t] : [t]
      return acc
    },
    {}
  )

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const currentMonth = viewDate.getMonth()

  return (
    <div className="select-none">
      {/* Month header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-neumo-text">
          {format(viewDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-muted hover:text-neumo-text transition-all flex items-center justify-center"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-muted hover:text-neumo-text transition-all flex items-center justify-center"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-neumo-subtle py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          const dateStr = formatDate(day)
          const isCurrentMonth = day.getMonth() === currentMonth
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const dayTasks = tasksByDate[dateStr] || []
          const hasTasks = dayTasks.length > 0

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                'relative flex flex-col items-center py-2 rounded-xl transition-all duration-200 group',
                isSelected
                  ? 'text-white shadow-neumo-accent'
                  : isToday
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
              <span
                className={cn(
                  'text-xs font-semibold leading-none',
                  isSelected ? 'text-white' : ''
                )}
              >
                {day.getDate()}
              </span>

              {/* Task dots */}
              {hasTasks && (
                <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center max-w-[28px]">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-white/80' : categoryColor(t.category)
                      )}
                    />
                  ))}
                  {dayTasks.length > 3 && !isSelected && (
                    <span className="text-[8px] text-neumo-subtle">+</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 rounded-2xl bg-neumo-bg shadow-neumo-press p-3">
        <p className="text-[10px] text-neumo-muted mb-2 font-semibold tracking-wider uppercase">Categories</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {['Health', 'Work', 'Study', 'Social'].map((cat) => (
            <span key={cat} className="flex items-center gap-1.5 text-[11px] text-neumo-muted">
              <span className={cn('w-2 h-2 rounded-full', categoryColor(cat))} />
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
