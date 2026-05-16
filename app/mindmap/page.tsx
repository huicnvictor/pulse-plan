'use client'
import { useState } from 'react'
import { Plus, X, Network } from 'lucide-react'
import { MindMapCanvas, CAT_COLOR } from '@/components/mind-map-canvas'
import { MindMapDetail } from '@/components/mind-map-detail'
import { usePulsePlanStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const CATEGORIES = Object.keys(CAT_COLOR)

interface AddForm {
  title: string
  category: string
  parentId: string
  notes: string
}

const EMPTY: AddForm = { title: '', category: 'Work', parentId: '', notes: '' }

export default function MindMapPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY)

  const nodes = usePulsePlanStore((s) => s.mindMapNodes)
  const addNode = usePulsePlanStore((s) => s.addMindMapNode)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    addNode({
      title: form.title.trim(),
      category: form.category,
      parentId: form.parentId || null,
      progress: 0,
      notes: form.notes.trim() || undefined,
      subtasks: [],
    })
    setForm(EMPTY)
    setShowAdd(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neumo-bg">
      {/* Canvas area */}
      <div className="flex-1 relative min-w-0 p-4">
        {/* Toolbar */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-neumo-bg shadow-neumo-sm">
            <Network size={13} className="text-neumo-accent" />
            <span className="text-xs font-medium text-neumo-muted">
              {nodes.length} nodes
            </span>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200',
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
            {showAdd ? <X size={13} /> : <Plus size={13} />}
            {showAdd ? 'Cancel' : 'Add Node'}
          </button>
        </div>

        {/* Add node modal */}
        {showAdd && (
          <div className="absolute top-20 right-6 z-20 w-80 animate-slide-up">
            <form
              onSubmit={handleAdd}
              className="p-5 rounded-3xl bg-neumo-bg shadow-neumo space-y-4"
            >
              <p className="text-sm font-semibold text-neumo-text mb-1">New Node</p>

              <input
                autoFocus
                placeholder="Title (e.g. React Course)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-4 py-2.5 text-sm text-neumo-text placeholder-neumo-subtle outline-none focus:shadow-neumo-press transition-all"
              />

              <div>
                <label className="text-[10px] font-medium text-neumo-muted mb-1.5 block tracking-wider uppercase">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2.5 text-xs text-neumo-text outline-none transition-all appearance-none"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-medium text-neumo-muted mb-1.5 block tracking-wider uppercase">Parent node (optional)</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2.5 text-xs text-neumo-text outline-none transition-all appearance-none"
                >
                  <option value="">— Root node —</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.parentId ? '    ↳ ' : ''}{n.title}
                    </option>
                  ))}
                </select>
              </div>

              <input
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-neumo-bg shadow-neumo-press rounded-xl px-4 py-2.5 text-xs text-neumo-text placeholder-neumo-subtle outline-none transition-all"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-semibold text-white transition-all duration-200 hover:opacity-95 shadow-neumo-accent"
                style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
              >
                Add to Map
              </button>
            </form>
          </div>
        )}

        {/* Canvas */}
        <div className="w-full h-full rounded-3xl bg-neumo-bg shadow-neumo-inset overflow-hidden">
          <MindMapCanvas selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>

      {/* Detail panel */}
      {selectedId && (
        <MindMapDetail
          nodeId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
