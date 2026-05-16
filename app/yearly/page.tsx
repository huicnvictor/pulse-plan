'use client'
import { useState } from 'react'
import { Plus, CheckCircle2, Circle, Target, X, ChevronDown, ChevronUp, Pencil, Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePulsePlanStore, type YearlyGoal } from '@/lib/store'
import { format, parseISO } from 'date-fns'

const CATEGORY_COLORS: Record<string, string> = {
  Health: '#10b981',
  Work: '#3b82f6',
  Study: '#8b5cf6',
  Social: '#ec4899',
  Finance: '#f59e0b',
  Creative: '#f97316',
  Personal: '#06b6d4',
}

const CATEGORIES = Object.keys(CATEGORY_COLORS)

interface GoalForm {
  title: string
  category: string
  targetDate: string
  description: string
}

const EMPTY: GoalForm = { title: '', category: 'Work', targetDate: '', description: '' }

export default function YearlyPage() {
  const goals = usePulsePlanStore((s) => s.yearlyGoals)
  const addYearlyGoal = usePulsePlanStore((s) => s.addYearlyGoal)
  const updateYearlyGoal = usePulsePlanStore((s) => s.updateYearlyGoal)
  const deleteYearlyGoal = usePulsePlanStore((s) => s.deleteYearlyGoal)
  const toggleMilestone = usePulsePlanStore((s) => s.toggleMilestone)
  const addMilestone = usePulsePlanStore((s) => s.addMilestone)
  const updateMilestone = usePulsePlanStore((s) => s.updateMilestone)
  const deleteMilestone = usePulsePlanStore((s) => s.deleteMilestone)

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<GoalForm>(EMPTY)
  const [expanded, setExpanded] = useState<string | null>(null)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    addYearlyGoal({
      title: form.title.trim(),
      category: form.category,
      color: CATEGORY_COLORS[form.category] ?? '#8b5cf6',
      progress: 0,
      targetDate: form.targetDate || `${new Date().getFullYear()}-12-31`,
      description: form.description,
      milestones: [],
    })
    setForm(EMPTY)
    setShowAdd(false)
  }

  const avgProgress = goals.length
    ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
    : 0

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={18} className="text-neumo-accent" />
            <h1 className="text-xl font-semibold text-neumo-text">Year Goals</h1>
          </div>
          <p className="text-sm text-neumo-muted">
            {new Date().getFullYear()} · {goals.length} goals · {avgProgress}% avg progress
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
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
          {showAdd ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {/* Progress summary bar */}
      {goals.length > 0 && (
        <div className="p-5 rounded-2xl bg-neumo-bg shadow-neumo-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-neumo-muted tracking-wider uppercase">Overall progress</p>
            <span className="text-sm font-bold text-neumo-text">{avgProgress}%</span>
          </div>
          <div className="h-2.5 bg-neumo-bg shadow-neumo-press rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${avgProgress}%`,
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
              }}
            />
          </div>
          <div className="flex gap-4 mt-3 flex-wrap">
            {goals.map((g) => (
              <div key={g.id} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: g.color }}
                />
                <span className="text-[11px] text-neumo-muted truncate max-w-[100px]">{g.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="p-5 rounded-2xl bg-neumo-bg shadow-neumo space-y-3 animate-slide-up"
        >
          <input
            autoFocus
            placeholder="Goal title..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2.5 text-sm text-neumo-text placeholder-neumo-subtle outline-none transition-all"
          />
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
              <label className="text-[11px] text-neumo-subtle mb-1 block">Target Date</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text outline-none transition-all"
              />
            </div>
          </div>
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            rows={2}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text placeholder-neumo-subtle outline-none transition-all resize-none"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-95 shadow-neumo-accent"
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
          >
            Add Goal
          </button>
        </form>
      )}

      {/* Goals list */}
      <div className="space-y-3">
        {goals.length === 0 && !showAdd && (
          <div className="py-20 text-center space-y-2">
            <Target size={32} className="text-neumo-subtle mx-auto" />
            <p className="text-neumo-muted text-sm">No goals yet</p>
            <p className="text-neumo-subtle text-xs">Add your first yearly goal to start tracking</p>
          </div>
        )}

        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            expanded={expanded === goal.id}
            onToggleExpand={() =>
              setExpanded((p) => (p === goal.id ? null : goal.id))
            }
            onToggleMilestone={(mId) => toggleMilestone(goal.id, mId)}
            onAddMilestone={(title) => addMilestone(goal.id, title)}
            onUpdateMilestone={(mId, title) => updateMilestone(goal.id, mId, title)}
            onDeleteMilestone={(mId) => deleteMilestone(goal.id, mId)}
            onUpdate={(updates) => updateYearlyGoal(goal.id, updates)}
            onDelete={() => deleteYearlyGoal(goal.id)}
          />
        ))}
      </div>
    </div>
  )
}

function GoalCard({
  goal,
  expanded,
  onToggleExpand,
  onToggleMilestone,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onUpdate,
  onDelete,
}: {
  goal: YearlyGoal
  expanded: boolean
  onToggleExpand: () => void
  onToggleMilestone: (milestoneId: string) => void
  onAddMilestone: (title: string) => void
  onUpdateMilestone: (milestoneId: string, title: string) => void
  onDeleteMilestone: (milestoneId: string) => void
  onUpdate: (updates: Partial<Omit<YearlyGoal, 'id' | 'milestones'>>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editForm, setEditForm] = useState<GoalForm>({
    title: goal.title,
    category: goal.category,
    targetDate: goal.targetDate,
    description: goal.description ?? '',
  })
  const [newMilestone, setNewMilestone] = useState('')

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm.title.trim()) return
    onUpdate({
      title: editForm.title.trim(),
      category: editForm.category,
      targetDate: editForm.targetDate || `${new Date().getFullYear()}-12-31`,
      description: editForm.description,
    })
    setEditing(false)
  }

  function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault()
    if (!newMilestone.trim()) return
    onAddMilestone(newMilestone.trim())
    setNewMilestone('')
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="rounded-2xl bg-neumo-bg shadow-neumo p-5 space-y-3 animate-slide-up"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-neumo-accent tracking-wider uppercase">Edit Goal</p>
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
            <label className="text-[11px] text-neumo-subtle mb-1 block">Target Date</label>
            <input
              type="date"
              value={editForm.targetDate}
              onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })}
              className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text outline-none transition-all"
            />
          </div>
        </div>
        <textarea
          placeholder="Description (optional)"
          value={editForm.description}
          rows={2}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-sm text-neumo-text placeholder-neumo-subtle outline-none transition-all resize-none"
        />
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors"
        >
          Save Changes
        </button>
      </form>
    )
  }

  return (
    <div className="rounded-2xl bg-neumo-bg shadow-neumo-sm overflow-hidden transition-all duration-200">
      <div className="flex items-stretch">
        <button onClick={onToggleExpand} className="flex-1 text-left p-4 min-w-0">
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold mt-0.5 bg-neumo-bg shadow-neumo-xs"
              style={{ color: goal.color }}
            >
              {goal.title[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neumo-text">{goal.title}</h3>
                  <p className="text-[11px] text-neumo-muted mt-0.5">
                    {goal.category} · Due {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-neumo-text">{goal.progress}%</span>
                  {expanded ? (
                    <ChevronUp size={15} className="text-neumo-subtle" />
                  ) : (
                    <ChevronDown size={15} className="text-neumo-subtle" />
                  )}
                </div>
              </div>
              <div className="mt-3 h-2 bg-neumo-bg shadow-neumo-press rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
                />
              </div>
            </div>
          </div>
        </button>

        {/* Edit / Delete buttons */}
        <div className="flex flex-col justify-center gap-1.5 px-3">
          <button
            onClick={() => {
              setEditForm({
                title: goal.title,
                category: goal.category,
                targetDate: goal.targetDate,
                description: goal.description ?? '',
              })
              setEditing(true)
            }}
            className="w-7 h-7 rounded-lg bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-muted hover:text-neumo-accent transition-all flex items-center justify-center"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          {confirmDelete ? (
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg shadow-neumo-press text-white transition-all flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f56565, #c53030)' }}
              title="Confirm delete"
            >
              <Trash2 size={12} />
            </button>
          ) : (
            <button
              onClick={() => {
                setConfirmDelete(true)
                setTimeout(() => setConfirmDelete(false), 2500)
              }}
              className="w-7 h-7 rounded-lg bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-muted hover:text-red-500 transition-all flex items-center justify-center"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-3 mx-3 mb-3 rounded-xl bg-neumo-bg shadow-neumo-press animate-slide-up">
          {goal.description && (
            <p className="text-xs text-neumo-muted mt-3 mb-4 leading-relaxed">{goal.description}</p>
          )}

          {goal.milestones.length > 0 && (
            <div className="space-y-1 mb-3">
              <p className="text-[10px] font-semibold text-neumo-muted mb-2 tracking-wider uppercase">Milestones</p>
              {goal.milestones.map((m) => (
                <MilestoneRow
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  completed={m.completed}
                  onToggle={() => onToggleMilestone(m.id)}
                  onRename={(title) => onUpdateMilestone(m.id, title)}
                  onDelete={() => onDeleteMilestone(m.id)}
                />
              ))}
            </div>
          )}

          {/* Add milestone */}
          <form onSubmit={handleAddMilestone} className="flex gap-2 mt-3">
            <input
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              placeholder="Add milestone..."
              className="flex-1 bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-xs text-neumo-text placeholder-neumo-subtle outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newMilestone.trim()}
              className="px-4 py-2 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press disabled:opacity-30 text-xs font-medium text-neumo-text transition-all"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function MilestoneRow({
  id,
  title,
  completed,
  onToggle,
  onRename,
  onDelete,
}: {
  id: string
  title: string
  completed: boolean
  onToggle: () => void
  onRename: (title: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)

  function startEdit() {
    setDraft(title)
    setEditing(true)
  }

  function commit() {
    const next = draft.trim()
    if (next && next !== title) onRename(next)
    setEditing(false)
  }

  function cancel() {
    setDraft(title)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2.5 py-2 px-3 rounded-xl shadow-neumo-press bg-neumo-bg">
          {completed ? (
            <CheckCircle2 size={15} className="shrink-0" style={{ color: '#10b981' }} />
          ) : (
            <Circle size={15} className="text-neumo-subtle shrink-0" />
          )}
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                cancel()
              }
            }}
            onBlur={commit}
            className="flex-1 bg-transparent text-sm text-neumo-text outline-none"
          />
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
          className="p-1 rounded-lg text-neumo-muted hover:text-emerald-500 transition-all"
          title="Save"
        >
          <Check size={12} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          className="p-1 rounded-lg text-neumo-subtle hover:text-neumo-text transition-all"
          title="Cancel"
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div key={id} className="flex items-center gap-2 group">
      <button
        onClick={onToggle}
        onDoubleClick={startEdit}
        className="flex-1 flex items-center gap-2.5 py-2 px-3 rounded-xl hover:shadow-neumo-xs transition-all text-left bg-neumo-bg"
      >
        {completed ? (
          <CheckCircle2 size={15} className="shrink-0" style={{ color: '#10b981' }} />
        ) : (
          <Circle size={15} className="text-neumo-subtle group-hover:text-neumo-muted shrink-0 transition-colors" />
        )}
        <span
          className={cn(
            'text-sm',
            completed ? 'line-through text-neumo-subtle' : 'text-neumo-text'
          )}
        >
          {title}
        </span>
      </button>
      <button
        onClick={startEdit}
        className="p-1 rounded-lg text-neumo-subtle hover:text-neumo-accent opacity-0 group-hover:opacity-100 transition-all"
        title="Rename"
      >
        <Pencil size={12} />
      </button>
      <button
        onClick={onDelete}
        className="p-1 rounded-lg text-neumo-subtle hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        title="Delete"
      >
        <X size={12} />
      </button>
    </div>
  )
}
