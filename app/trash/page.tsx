'use client'
import { useState } from 'react'
import { Trash2, RotateCcw, X, CalendarDays, Target } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { usePulsePlanStore } from '@/lib/store'
import { categoryBg, categoryTextColor } from '@/lib/utils'

export default function TrashPage() {
  const trashedTasks = usePulsePlanStore((s) => s.trashedTasks)
  const trashedGoals = usePulsePlanStore((s) => s.trashedGoals)
  const restoreTask = usePulsePlanStore((s) => s.restoreTask)
  const restoreGoal = usePulsePlanStore((s) => s.restoreGoal)
  const permanentlyDeleteTask = usePulsePlanStore((s) => s.permanentlyDeleteTask)
  const permanentlyDeleteGoal = usePulsePlanStore((s) => s.permanentlyDeleteGoal)
  const clearTrash = usePulsePlanStore((s) => s.clearTrash)

  const [confirmClear, setConfirmClear] = useState(false)
  const total = trashedTasks.length + trashedGoals.length

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trash2 size={18} className="text-neumo-muted" />
            <h1 className="text-xl font-semibold text-neumo-text">Trash</h1>
          </div>
          <p className="text-sm text-neumo-muted">
            {total === 0 ? 'Empty' : `${total} deleted item${total > 1 ? 's' : ''} · Restore or remove forever`}
          </p>
        </div>
        {total > 0 && (
          confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neumo-muted">Sure?</span>
              <button
                onClick={() => { clearTrash(); setConfirmClear(false) }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-95"
                style={{
                  background: 'linear-gradient(135deg, #f56565, #c53030)',
                  boxShadow: '0 4px 12px rgba(245, 101, 101, 0.4)',
                }}
              >
                Yes, clear all
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="w-8 h-8 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-muted hover:text-neumo-text transition-all flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neumo-muted hover:text-red-500 bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press transition-all"
            >
              Clear all
            </button>
          )
        )}
      </div>

      {total === 0 && (
        <div className="py-24 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-neumo-bg shadow-neumo-press flex items-center justify-center mx-auto">
            <Trash2 size={28} className="text-neumo-subtle" />
          </div>
          <p className="text-neumo-muted text-sm">Trash is empty</p>
        </div>
      )}

      {/* Trashed Tasks */}
      {trashedTasks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-neumo-muted" />
            <p className="text-xs font-semibold text-neumo-muted uppercase tracking-widest">
              Tasks · {trashedTasks.length}
            </p>
          </div>
          <div className="space-y-2">
            {trashedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-4 rounded-2xl bg-neumo-bg shadow-neumo-sm group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-neumo-muted line-through truncate">{task.title}</p>
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
                      categoryBg(task.category),
                      categoryTextColor(task.category)
                    )}>
                      {task.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-neumo-subtle mt-0.5">
                    {task.date}{task.time ? ` · ${task.time}` : ''} · deleted {formatDistanceToNow(parseISO(task.deletedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => restoreTask(task.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-all"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </button>
                  <button
                    onClick={() => permanentlyDeleteTask(task.id)}
                    className="w-7 h-7 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-subtle hover:text-red-500 transition-all flex items-center justify-center"
                    title="Delete forever"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trashed Goals */}
      {trashedGoals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-neumo-muted" />
            <p className="text-xs font-semibold text-neumo-muted uppercase tracking-widest">
              Year Goals · {trashedGoals.length}
            </p>
          </div>
          <div className="space-y-2">
            {trashedGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-3 p-4 rounded-2xl bg-neumo-bg shadow-neumo-sm group"
              >
                <div
                  className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold opacity-50 bg-neumo-bg shadow-neumo-xs"
                  style={{ color: goal.color }}
                >
                  {goal.title[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neumo-muted line-through truncate">{goal.title}</p>
                  <p className="text-[11px] text-neumo-subtle mt-0.5">
                    {goal.category} · {goal.progress}% progress · deleted {formatDistanceToNow(parseISO(goal.deletedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => restoreGoal(goal.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-all"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </button>
                  <button
                    onClick={() => permanentlyDeleteGoal(goal.id)}
                    className="w-7 h-7 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-subtle hover:text-red-500 transition-all flex items-center justify-center"
                    title="Delete forever"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
