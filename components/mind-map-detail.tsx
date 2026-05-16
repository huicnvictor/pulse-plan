'use client'
import { useState, useEffect, useRef } from 'react'
import {
  X,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ChevronRight,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePulsePlanStore } from '@/lib/store'
import { CAT_COLOR } from './mind-map-canvas'

interface Props {
  nodeId: string
  onClose: () => void
}

export function MindMapDetail({ nodeId, onClose }: Props) {
  const node = usePulsePlanStore((s) => s.mindMapNodes.find((n) => n.id === nodeId))
  const parentNode = usePulsePlanStore((s) =>
    s.mindMapNodes.find((n) => n.id === node?.parentId)
  )
  const updateNode = usePulsePlanStore((s) => s.updateMindMapNode)
  const deleteNode = usePulsePlanStore((s) => s.deleteMindMapNode)
  const toggleSubtask = usePulsePlanStore((s) => s.toggleMindMapSubtask)
  const addSubtask = usePulsePlanStore((s) => s.addMindMapSubtask)
  const updateSubtask = usePulsePlanStore((s) => s.updateMindMapSubtask)
  const deleteSubtask = usePulsePlanStore((s) => s.deleteMindMapSubtask)

  const [newSub, setNewSub] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [subDraft, setSubDraft] = useState('')

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [editingTitle])

  if (!node) return null

  function startEditTitle() {
    setTitleDraft(node!.title)
    setEditingTitle(true)
  }

  function commitTitle() {
    const t = titleDraft.trim()
    if (t && t !== node!.title) updateNode(nodeId, { title: t })
    setEditingTitle(false)
  }

  function handleTitleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitTitle()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditingTitle(false)
    }
  }

  function startEditSub(id: string, current: string) {
    setEditingSubId(id)
    setSubDraft(current)
  }

  function commitSub() {
    if (!editingSubId) return
    const t = subDraft.trim()
    const original = node!.subtasks.find((s) => s.id === editingSubId)
    if (t && original && t !== original.title) {
      updateSubtask(nodeId, editingSubId, t)
    }
    setEditingSubId(null)
  }

  function handleSubKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitSub()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditingSubId(null)
    }
  }

  const col = CAT_COLOR[node.category] ?? '#71717a'
  const done = node.subtasks.filter((s) => s.completed).length
  const total = node.subtasks.length

  function handleAddSub(e: React.FormEvent) {
    e.preventDefault()
    const t = newSub.trim()
    if (!t) return
    addSubtask(nodeId, t)
    setNewSub('')
  }

  function handleDelete() {
    deleteNode(nodeId)
    onClose()
  }

  // Arc for the big donut
  const R = 42
  const sw = 8
  const ir = R - sw / 2
  const circ = 2 * Math.PI * ir
  const dash = (node.progress / 100) * circ

  return (
    <aside className="w-80 shrink-0 h-full bg-neumo-bg flex flex-col p-4 gap-4 animate-slide-in">
      {/* Header card */}
      <div className="rounded-2xl bg-neumo-bg shadow-neumo-sm px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {parentNode && (
              <p className="text-[10px] text-neumo-muted mb-1 flex items-center gap-1">
                <span>{parentNode.title}</span>
                <ChevronRight size={10} />
              </p>
            )}
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={handleTitleKey}
                className="w-full bg-neumo-bg shadow-neumo-press rounded-lg px-3 py-1.5 text-sm font-semibold text-neumo-text outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={startEditTitle}
                title="Click to rename"
                className="group flex items-center gap-1.5 text-left w-full"
              >
                <h3 className="font-semibold text-neumo-text truncate">{node.title}</h3>
                <Pencil size={11} className="text-neumo-subtle opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-neumo-muted hover:text-neumo-text transition-all shrink-0 flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
        {/* Progress card */}
        <div className="rounded-2xl bg-neumo-bg shadow-neumo-sm px-5 py-5">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <svg width={R * 2 + 4} height={R * 2 + 4} viewBox={`0 0 ${R*2+4} ${R*2+4}`}>
                <circle
                  cx={R + 2} cy={R + 2} r={ir}
                  fill="none" stroke="rgba(190,200,212,0.55)" strokeWidth={sw}
                />
                {node.progress > 0 && (
                  <circle
                    cx={R + 2} cy={R + 2} r={ir}
                    fill="none"
                    stroke={col}
                    strokeWidth={sw}
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    transform={`rotate(-90,${R+2},${R+2})`}
                    style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)' }}
                  />
                )}
                <text
                  x={R + 2} y={R + 2 - 4}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="#2d3748" fontSize={13} fontWeight="700"
                >
                  {node.progress}%
                </text>
                <text
                  x={R + 2} y={R + 2 + 9}
                  textAnchor="middle"
                  fill="#a0aec0" fontSize={7}
                >
                  done
                </text>
              </svg>
            </div>

            <div className="min-w-0 space-y-2 flex-1">
              <span
                className="inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: `${col}20`,
                  color: col,
                  boxShadow: 'inset 1px 1px 2px #BEC8D4, inset -1px -1px 2px #FFFFFF',
                }}
              >
                {node.category}
              </span>
              {node.notes && (
                <p className="text-xs text-neumo-muted leading-relaxed">{node.notes}</p>
              )}
              {total > 0 && (
                <p className="text-[11px] text-neumo-subtle">{done}/{total} subtasks</p>
              )}
            </div>
          </div>
        </div>

        {/* Manual progress slider — only when no subtasks */}
        {total === 0 && (
          <div className="rounded-2xl bg-neumo-bg shadow-neumo-sm px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neumo-muted tracking-wider uppercase">Adjust progress</span>
              <span className="text-xs font-bold" style={{ color: col }}>{node.progress}%</span>
            </div>
            <input
              type="range" min="0" max="100"
              value={node.progress}
              onChange={(e) =>
                updateNode(nodeId, { progress: parseInt(e.target.value) })
              }
              className="w-full"
            />
            <p className="text-[10px] text-neumo-subtle mt-2">
              Add subtasks below to switch to auto-tracking
            </p>
          </div>
        )}

        {/* Subtasks card */}
        <div className="rounded-2xl bg-neumo-bg shadow-neumo-sm px-5 py-4">
          <p className="text-[11px] font-semibold text-neumo-muted mb-3 tracking-wider uppercase">
            Subtasks {total > 0 && `· ${done}/${total}`}
          </p>

          {node.subtasks.length === 0 && (
            <p className="text-xs text-neumo-subtle mb-3">No subtasks yet</p>
          )}

          <div className="space-y-2">
            {node.subtasks.map((st) => (
              <div
                key={st.id}
                className="group flex items-center gap-2.5 py-2 px-3 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press transition-all"
              >
                <button
                  onClick={() => toggleSubtask(nodeId, st.id)}
                  className="shrink-0"
                >
                  {st.completed ? (
                    <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                  ) : (
                    <Circle size={16} className="text-neumo-subtle hover:text-neumo-muted transition-colors" />
                  )}
                </button>
                {editingSubId === st.id ? (
                  <input
                    autoFocus
                    value={subDraft}
                    onChange={(e) => setSubDraft(e.target.value)}
                    onBlur={commitSub}
                    onKeyDown={handleSubKey}
                    className="flex-1 bg-neumo-bg shadow-neumo-press rounded-md px-2 py-1 text-xs text-neumo-text outline-none"
                  />
                ) : (
                  <span
                    onClick={() => startEditSub(st.id, st.title)}
                    title="Click to rename"
                    className={cn(
                      'flex-1 text-xs cursor-text',
                      st.completed ? 'line-through text-neumo-subtle' : 'text-neumo-text'
                    )}
                  >
                    {st.title}
                  </span>
                )}
                <button
                  onClick={() => deleteSubtask(nodeId, st.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neumo-subtle hover:text-red-500 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Add subtask */}
          <form onSubmit={handleAddSub} className="flex items-center gap-2 mt-4">
            <input
              placeholder="Add subtask..."
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              className="flex-1 bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2 text-xs text-neumo-text placeholder-neumo-subtle outline-none"
            />
            <button
              type="submit"
              disabled={!newSub.trim()}
              className="w-9 h-9 rounded-xl text-white transition-all duration-200 disabled:opacity-30 hover:opacity-95 shrink-0 flex items-center justify-center shadow-neumo-accent disabled:shadow-none"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
            >
              <Plus size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Footer: delete */}
      <div className="rounded-2xl bg-neumo-bg shadow-neumo-sm p-3">
        {confirmDelete ? (
          <div className="space-y-2">
            <p className="text-xs text-neumo-muted text-center mb-2">
              Delete this node{node.parentId ? '' : ' and all its children'}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-xs font-medium text-neumo-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-95"
                style={{
                  background: 'linear-gradient(135deg, #f56565, #c53030)',
                  boxShadow: '0 4px 12px rgba(245, 101, 101, 0.4)',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2.5 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-xs font-medium text-neumo-muted hover:text-red-500 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 size={12} />
            Delete node
          </button>
        )}
      </div>
    </aside>
  )
}
