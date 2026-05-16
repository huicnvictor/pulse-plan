'use client'
import { useEffect } from 'react'
import { CalendarGrid } from '@/components/calendar-grid'
import { DayTaskList } from '@/components/day-task-list'
import { usePulsePlanStore } from '@/lib/store'
import { todayStr } from '@/lib/utils'

export default function DailyPage() {
  const selectedDate = usePulsePlanStore((s) => s.selectedDate)
  const setSelectedDate = usePulsePlanStore((s) => s.setSelectedDate)

  // If selectedDate is in the past (e.g., persisted from a previous session),
  // jump to today on mount only — otherwise users can't click past dates.
  useEffect(() => {
    const today = todayStr()
    if (selectedDate < today) setSelectedDate(today)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen p-5 gap-5 bg-neumo-bg">
      {/* Calendar panel */}
      <div className="md:w-80 lg:w-96 shrink-0 rounded-3xl bg-neumo-bg shadow-neumo-sm p-5">
        <CalendarGrid
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Task list panel */}
      <div className="flex-1 rounded-3xl bg-neumo-bg shadow-neumo-sm p-5 md:p-6">
        <DayTaskList date={selectedDate} />
      </div>
    </div>
  )
}
