'use client'
import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Trash2,
  X,
  Pencil,
  LayoutList,
  CalendarDays,
  ExternalLink,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn, categoryBg, categoryTextColor, todayStr } from '@/lib/utils'
import { parseTaskText } from '@/lib/parse-task-time'
import { usePulsePlanStore, type Task } from '@/lib/store'

const CATEGORIES = ['Health', 'Work', 'Study', 'Social', 'Finance', 'Creative', 'Personal']
const PRIORITIES = ['low', 'medium', 'high'] as const

const CATEGORY_HEX: Record<string, string> = {
  Health: '#10b981',
  Work: '#3b82f6',
  Study: '#8b5cf6',
  Social: '#ec4899',
  Finance: '#f59e0b',
  Creative: '#f97316',
  Personal: '#06b6d4',
}

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

interface Props {
  date: string
}

interface AddForm {
  title: string
  date: string
  time: string
  duration: string
  category: string
  priority: 'low' | 'medium' | 'high'
  notes: string
}

const EMPTY_FORM: AddForm = {
  title: '',
  date: '',
  time: '',
  duration: '',
  category: 'Work',
  priority: 'medium',
  notes: '',
}

export function DayTaskList({ date }: Props) {
  const tasks = usePulsePlanStore((s) => s.tasks)
  const toggleTask = usePulsePlanStore((s) => s.toggleTask)
  const deleteTask = usePulsePlanStore((s) => s.deleteTask)
  const addTask = usePulsePlanStore((s) => s.addTask)
  const updateTask = usePulsePlanStore((s) => s.updateTask)

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>({ ...EMPTY_FORM, date })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'timeline'>('list')
  // Track which fields were auto-filled by the parser so we don't clobber
  // values the user picked manually.
  const autofilled = useRef({ time: false, date: false })

  const dayTasks = tasks
    .filter((t) => t.date === date)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  const completed = dayTasks.filter((t) => t.completed).length
  const isToday = date === todayStr()

  function handleTitleChange(value: string) {
    const parsed = parseTaskText(value)
    setForm((prev) => {
      const next: AddForm = { ...prev, title: value }
      if (parsed.time && (!prev.time || autofilled.current.time)) {
        next.time = parsed.time
        autofilled.current.time = true
      }
      if (parsed.date && (prev.date === date || autofilled.current.date)) {
        next.date = parsed.date
        autofilled.current.date = true
      }
      return next
    })
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM, date })
    autofilled.current = { time: false, date: false }
    setShowAdd(true)
  }

  function closeAdd() {
    setForm({ ...EMPTY_FORM, date })
    autofilled.current = { time: false, date: false }
    setShowAdd(false)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    const parsed = parseTaskText(form.title)
    addTask({
      title: (parsed.title || form.title).trim(),
      date: form.date || parsed.date || date,
      time: form.time || parsed.time || undefined,
      duration: form.duration ? parseInt(form.duration) : undefined,
      category: form.category,
      completed: false,
      priority: form.priority,
      source: 'manual',
      notes: form.notes || undefined,
    })
    closeAdd()
  }

  return (
    <div className="max-w-xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neumo-text">
            {isToday ? 'Today' : format(parseISO(date), 'EEEE')}
          </h2>
          <p className="text-sm text-neumo-muted mt-0.5">
            {format(parseISO(date), 'MMMM d, yyyy')} · {completed}/{dayTasks.length} done
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl bg-neumo-bg shadow-neumo-press p-1 gap-1">
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg transition-all',
                view === 'list' ? 'bg-neumo-bg shadow-neumo-xs text-neumo-text' : 'text-neumo-subtle hover:text-neumo-muted'
              )}
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setView('timeline')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg transition-all',
                view === 'timeline' ? 'bg-neumo-bg shadow-neumo-xs text-neumo-text' : 'text-neumo-subtle hover:text-neumo-muted'
              )}
            >
              <CalendarDays size={14} />
            </button>
          </div>
          <button
            onClick={() => (showAdd ? closeAdd() : openAdd())}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              showAdd
                ? 'bg-neumo-bg shadow-neumo-press text-neumo-muted'
                : 'text-white shadow-neumo-accent hover:opacity-95'
            )}
            style={
              showAdd
                ? undefined
                : { background: 'linear-gradient(135deg, #667eea, #764ba2)' }
            }
          >
            {showAdd ? <X size={15} /> : <Plus size={15} />}
            {showAdd ? 'Cancel' : 'Add task'}
          </button>
        </div>
      </div>

      {/* Add task form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="mb-5 p-5 rounded-2xl bg-neumo-bg shadow-neumo space-y-3 animate-slide-up"
        >
          <input
            autoFocus
            placeholder='试试 "下午两点开会" 或 "明天 3pm gym"'
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2.5 text-sm text-neumo-text placeholder-neumo-subtle outline-none transition-all"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-neumo-subtle mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => {
                  autofilled.current.date = false
                  setForm({ ...form, date: e.target.value })
                }}
                className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] text-neumo-subtle mb-1 block">Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => {
                  autofilled.current.time = false
                  setForm({ ...form, time: e.target.value })
                }}
                className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] text-neumo-subtle mb-1 block">Duration (min)</label>
              <input
                type="number"
                placeholder="60"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text placeholder-neumo-subtle outline-none transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-neumo-subtle mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text outline-none transition-all"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-neumo-subtle mb-1 block">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}
                className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text outline-none transition-all"
              >
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={form.notes}
            rows={2}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text placeholder-neumo-subtle outline-none transition-all resize-none"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-95 shadow-neumo-accent"
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
          >
            Add Task
          </button>
        </form>
      )}

      {/* Views */}
      {dayTasks.length === 0 && !showAdd && (
        <div className="py-16 text-center">
          <p className="text-neumo-subtle text-sm">No tasks for this day</p>
          <p className="text-neumo-subtle text-xs mt-1">Click &quot;Add task&quot; to get started</p>
        </div>
      )}

      {dayTasks.length > 0 && view === 'list' && (
        <div className="space-y-2">
          {dayTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              expanded={expandedId === task.id}
              onToggleExpand={() =>
                setExpandedId((prev) => (prev === task.id ? null : task.id))
              }
              onToggle={() => toggleTask(task.id)}
              onDelete={() => deleteTask(task.id)}
              onUpdate={(updates) => updateTask(task.id, updates)}
            />
          ))}
        </div>
      )}

      {dayTasks.length > 0 && view === 'timeline' && (
        <TimelineView
          tasks={dayTasks}
          isToday={isToday}
          onDelete={(id) => deleteTask(id)}
          onToggle={(id) => toggleTask(id)}
        />
      )}
    </div>
  )
}

// ── Timeline view ─────────────────────────────────────────────────────────────

function TimelineView({
  tasks,
  isToday,
  onDelete,
  onToggle,
}: {
  tasks: Task[]
  isToday: boolean
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scheduledTasks = tasks.filter((t) => t.time)
  const unscheduledTasks = tasks.filter((t) => !t.time)
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const totalHeight = hours.length * HOUR_HEIGHT

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTop = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT

  // Scroll to current time on mount
  useEffect(() => {
    if (!isToday || !scrollRef.current) return
    const scrollTo = Math.max(nowTop - 80, 0)
    scrollRef.current.scrollTop = scrollTo
  }, [isToday, nowTop])

  return (
    <div className="space-y-4">
      {/* Unscheduled tasks */}
      {unscheduledTasks.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-neumo-subtle mb-2">UNSCHEDULED</p>
          <div className="space-y-1.5">
            {unscheduledTasks.map((t) => {
              const color = CATEGORY_HEX[t.category] ?? '#71717a'
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press transition-all group"
                >
                  <button onClick={() => onToggle(t.id)} className="shrink-0">
                    {t.completed
                      ? <CheckCircle2 size={14} className="text-emerald-500" />
                      : <Circle size={14} className="text-neumo-subtle group-hover:text-neumo-muted transition-colors" />
                    }
                  </button>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className={cn('text-sm flex-1 truncate', t.completed ? 'line-through text-neumo-subtle' : 'text-neumo-text')}>
                    {t.title}
                  </span>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neumo-subtle hover:text-red-500 transition-all rounded-lg"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hour grid */}
      <div
        ref={scrollRef}
        className="overflow-y-auto rounded-2xl bg-neumo-bg shadow-neumo-press"
        style={{ maxHeight: 520 }}
      >
        <div className="relative" style={{ height: totalHeight }}>
          {/* Hour lines */}
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-start pointer-events-none"
              style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
            >
              <span className="text-[10px] text-neumo-subtle w-12 shrink-0 select-none text-right pr-2.5 leading-none -mt-[6px]">
                {String(h).padStart(2, '0')}:00
              </span>
              <div className="flex-1 border-t border-neumo-dark/40" />
            </div>
          ))}

          {/* Current time indicator */}
          {isToday && nowTop > 0 && nowTop < totalHeight && (
            <div
              className="absolute left-12 right-0 flex items-center gap-1.5 pointer-events-none z-10"
              style={{ top: nowTop }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1" />
              <div className="flex-1 border-t border-red-500/60" />
            </div>
          )}

          {/* Task blocks */}
          {scheduledTasks.map((t) => {
            const { top, height } = getTaskPosition(t.time!, t.duration)
            const color = CATEGORY_HEX[t.category] ?? '#71717a'
            return (
              <div
                key={t.id}
                className="absolute group"
                style={{ top: top + 1, height: height - 2, left: 48, right: 8 }}
              >
                <div
                  className="h-full rounded-lg px-2 py-1 overflow-hidden flex items-start gap-1.5 cursor-default"
                  style={{
                    backgroundColor: color + '18',
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-xs font-medium leading-tight truncate',
                        t.completed ? 'line-through opacity-40' : ''
                      )}
                      style={{ color }}
                    >
                      {t.title}
                    </p>
                    {height > 38 && (
                      <p className="text-[10px] text-neumo-subtle mt-0.5">
                        {t.time}{t.duration ? ` · ${t.duration}min` : ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-neumo-subtle hover:text-red-400 transition-all rounded shrink-0"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── List task card ────────────────────────────────────────────────────────────

function TaskCard({
  task,
  expanded,
  onToggleExpand,
  onToggle,
  onDelete,
  onUpdate,
}: {
  task: Task
  expanded: boolean
  onToggleExpand: () => void
  onToggle: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<Task>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<AddForm>({
    title: task.title,
    date: task.date,
    time: task.time ?? '',
    duration: task.duration ? String(task.duration) : '',
    category: task.category,
    priority: task.priority,
    notes: task.notes ?? '',
  })

  const priorityDot: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-neumo-subtle',
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm.title.trim()) return
    onUpdate({
      title: editForm.title.trim(),
      date: editForm.date || task.date,
      time: editForm.time || undefined,
      duration: editForm.duration ? parseInt(editForm.duration) : undefined,
      category: editForm.category,
      priority: editForm.priority,
      notes: editForm.notes || undefined,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="rounded-2xl bg-neumo-bg shadow-neumo p-5 space-y-3 animate-slide-up"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-neumo-accent tracking-wider uppercase">Edit Task</p>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="w-7 h-7 rounded-lg bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-muted hover:text-neumo-text transition-all flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
        <input
          autoFocus
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2.5 text-sm text-neumo-text outline-none transition-all"
        />
        <div>
          <label className="text-[11px] text-neumo-subtle mb-1 block">Date</label>
          <input
            type="date"
            value={editForm.date}
            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-neumo-subtle mb-1 block">Time</label>
            <input
              type="time"
              value={editForm.time}
              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
              className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] text-neumo-subtle mb-1 block">Duration (min)</label>
            <input
              type="number"
              placeholder="60"
              value={editForm.duration}
              onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
              className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text placeholder-neumo-subtle outline-none transition-all"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-neumo-subtle mb-1 block">Category</label>
            <select
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text outline-none transition-all"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-neumo-subtle mb-1 block">Priority</label>
            <select
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as AddForm['priority'] })}
              className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text outline-none transition-all"
            >
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <textarea
          placeholder="Notes (optional)"
          value={editForm.notes}
          rows={2}
          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text placeholder-neumo-subtle outline-none transition-all resize-none"
        />
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-95 shadow-neumo-accent"
          style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
        >
          Save Changes
        </button>
      </form>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl bg-neumo-bg transition-all duration-200',
        task.completed
          ? 'shadow-neumo-press opacity-75'
          : 'shadow-neumo-xs hover:shadow-neumo-sm'
      )}
    >
      <div className="flex items-center gap-3 p-3.5">
        <button
          onClick={onToggle}
          className="shrink-0 transition-colors"
          title={task.completed ? 'Mark as not done' : 'Mark complete'}
        >
          {task.completed ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <Circle size={18} className="text-neumo-subtle hover:text-emerald-500" />
          )}
        </button>
        <button onClick={onToggleExpand} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'text-sm font-medium',
                task.completed ? 'line-through text-neumo-subtle' : 'text-neumo-text'
              )}
            >
              {task.title}
            </span>
            {task.sourceUrl && (
              <a
                href={task.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-neumo-subtle hover:text-neumo-accent shrink-0"
                title="Open event page"
              >
                <ExternalLink size={11} />
              </a>
            )}
            {task.source === 'scraped' && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700">
                Discovered
              </span>
            )}
          </div>
          {task.time && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock size={11} className="text-neumo-subtle" />
              <span className="text-[11px] text-neumo-subtle">
                {task.time}
                {task.duration ? ` · ${task.duration}min` : ''}
              </span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('w-2 h-2 rounded-full', priorityDot[task.priority])} />
          <span
            className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded-full border',
              categoryBg(task.category),
              categoryTextColor(task.category)
            )}
          >
            {task.category}
          </span>
          <button
            onClick={() => {
              setEditForm({
                title: task.title,
                date: task.date,
                time: task.time ?? '',
                duration: task.duration ? String(task.duration) : '',
                category: task.category,
                priority: task.priority,
                notes: task.notes ?? '',
              })
              setEditing(true)
            }}
            className="p-1.5 text-neumo-subtle hover:text-neumo-accent transition-colors rounded-lg"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-neumo-subtle hover:text-red-500 transition-colors rounded-lg"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && task.notes && (
        <div className="px-4 pb-3 pt-0">
          <p className="text-xs text-neumo-muted bg-neumo-bg shadow-neumo-press rounded-lg px-3 py-2">
            {task.notes}
          </p>
        </div>
      )}
    </div>
  )
}
