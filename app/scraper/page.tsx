'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Globe,
  Search,
  Loader2,
  CheckCircle2,
  X,
  Sparkles,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
  Plus as PlusIcon,
  Trash2,
  Pencil,
  Check,
  ExternalLink,
} from 'lucide-react'
import { cn, categoryBg, categoryTextColor } from '@/lib/utils'
import { usePulsePlanStore, type ScrapedActivity, type EventSource } from '@/lib/store'
import { format, parseISO } from 'date-fns'

type FilterStatus = 'all' | 'pending' | 'accepted' | 'ignored'

async function scrapeReal(url: string) {
  const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Scrape failed')
  return data.activities as Omit<ScrapedActivity, 'id' | 'scrapedAt' | 'status'>[]
}

export default function ScraperPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoLoading, setAutoLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [autoFetchSummary, setAutoFetchSummary] = useState<string | null>(null)

  const scrapedActivities = usePulsePlanStore((s) => s.scrapedActivities)
  const addScrapedActivities = usePulsePlanStore((s) => s.addScrapedActivities)
  const acceptActivity = usePulsePlanStore((s) => s.acceptActivity)
  const ignoreActivity = usePulsePlanStore((s) => s.ignoreActivity)
  const eventSources = usePulsePlanStore((s) => s.eventSources)
  const addEventSource = usePulsePlanStore((s) => s.addEventSource)
  const removeEventSource = usePulsePlanStore((s) => s.removeEventSource)
  const updateEventSource = usePulsePlanStore((s) => s.updateEventSource)

  const didAutoFetch = useRef(false)

  // Auto-fetch all sources on first mount
  useEffect(() => {
    if (didAutoFetch.current) return
    didAutoFetch.current = true
    refreshAllSources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshAllSources() {
    if (eventSources.length === 0) return
    setAutoLoading(true)
    setAutoFetchSummary(null)
    let added = 0
    let failed = 0
    for (const src of eventSources) {
      try {
        const activities = await scrapeReal(src.url)
        const before = usePulsePlanStore.getState().scrapedActivities.length
        addScrapedActivities(activities)
        const after = usePulsePlanStore.getState().scrapedActivities.length
        added += after - before
      } catch {
        failed += 1
      }
    }
    setAutoLoading(false)
    if (added === 0 && failed === 0) {
      setAutoFetchSummary('Already up to date')
    } else {
      const parts = []
      if (added > 0) parts.push(`${added} new`)
      if (failed > 0) parts.push(`${failed} source failed`)
      setAutoFetchSummary(parts.join(' · '))
    }
  }

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://')
      return
    }

    setError('')
    setLoading(true)
    try {
      const activities = await scrapeReal(trimmed)
      if (activities.length === 0) {
        setError('No events found on this page.')
        return
      }
      addScrapedActivities(activities)
      setUrl('')
      setFilter('pending')
    } catch (err) {
      setError((err as Error).message || 'Failed to scrape. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = scrapedActivities.filter(
    (a) => filter === 'all' || a.status === filter
  )

  const counts = {
    all: scrapedActivities.length,
    pending: scrapedActivities.filter((a) => a.status === 'pending').length,
    accepted: scrapedActivities.filter((a) => a.status === 'accepted').length,
    ignored: scrapedActivities.filter((a) => a.status === 'ignored').length,
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe size={18} className="text-neumo-accent" />
          <h1 className="text-xl font-semibold text-neumo-text">Discover</h1>
        </div>
        <p className="text-sm text-neumo-muted">
          Auto-fetched from your sources. Add more URLs below or paste any event page.
        </p>
      </div>

      {/* Sources panel */}
      <div className="rounded-2xl bg-neumo-bg shadow-neumo-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSourcesOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-semibold text-neumo-text"
            >
              {sourcesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Sources
              <span className="text-xs text-neumo-subtle font-normal">
                ({eventSources.length})
              </span>
            </button>
            {autoFetchSummary && !autoLoading && (
              <span className="text-[11px] text-neumo-subtle">· {autoFetchSummary}</span>
            )}
          </div>
          <button
            onClick={refreshAllSources}
            disabled={autoLoading || eventSources.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neumo-text shadow-neumo-xs hover:shadow-neumo-press disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={11} className={autoLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {sourcesOpen && (
          <div className="border-t border-neumo-bg-darker/30 px-4 py-3 space-y-2">
            {eventSources.map((src) => {
              let host = ''
              try { host = new URL(src.url).hostname } catch {}
              const linkedCount = host
                ? scrapedActivities.filter((a) => {
                    try { return new URL(a.sourceUrl).hostname === host } catch { return false }
                  }).length
                : 0
              return (
                <SourceRow
                  key={src.id}
                  source={src}
                  onUpdate={(updates) => updateEventSource(src.id, updates)}
                  onRemove={() => {
                    const msg = linkedCount > 0
                      ? `Remove "${src.name}" and delete ${linkedCount} event${linkedCount === 1 ? '' : 's'} from it?\n\n(Linked accepted tasks will be moved to Trash and can be restored.)`
                      : `Remove "${src.name}"?`
                    if (confirm(msg)) removeEventSource(src.id)
                  }}
                />
              )
            })}
            <AddSourceForm onAdd={addEventSource} />
          </div>
        )}
      </div>

      {/* Manual URL paste */}
      <form onSubmit={handleScrape} className="space-y-3">
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-neumo-bg shadow-neumo-press transition-all duration-200">
          <div className="pl-3 text-neumo-subtle">
            {loading ? (
              <Loader2 size={18} className="animate-spin text-neumo-accent" />
            ) : (
              <Search size={18} />
            )}
          </div>
          <input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            placeholder="Paste any event page URL for a one-off scrape..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-neumo-text placeholder-neumo-subtle outline-none py-2.5 pr-2"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-neumo-accent hover:opacity-95"
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
          >
            {loading ? 'Scanning...' : 'Scrape'}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 px-1 font-medium">{error}</p>}
      </form>

      {/* Loading skeleton */}
      {(loading || autoLoading) && filtered.length === 0 && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-neumo-bg shadow-neumo-press" />
          ))}
        </div>
      )}

      {/* Activity feed */}
      {scrapedActivities.length > 0 && (
        <div className="space-y-5">
          <div className="flex gap-1 p-1 bg-neumo-bg shadow-neumo-press rounded-xl w-fit">
            {(['pending', 'accepted', 'ignored', 'all'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                  filter === f
                    ? 'bg-neumo-bg shadow-neumo-xs text-neumo-text'
                    : 'text-neumo-muted hover:text-neumo-text'
                )}
              >
                {f}
                {counts[f] > 0 && (
                  <span className="ml-1.5 text-[10px] text-neumo-subtle">{counts[f]}</span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-neumo-subtle py-8 text-center">No {filter} activities</p>
          )}

          <div className="space-y-3">
            {filtered.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onAccept={() => acceptActivity(activity.id)}
                onIgnore={() => ignoreActivity(activity.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !autoLoading && scrapedActivities.length === 0 && (
        <div className="py-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-neumo-bg shadow-neumo flex items-center justify-center mx-auto">
            <Globe size={24} className="text-neumo-accent" />
          </div>
          <p className="text-neumo-text font-semibold">No activities yet</p>
          <p className="text-neumo-muted text-sm max-w-xs mx-auto">
            Sources are configured but nothing returned. Click Refresh, or paste a URL above.
          </p>
        </div>
      )}
    </div>
  )
}

function SourceRow({
  source,
  onUpdate,
  onRemove,
}: {
  source: EventSource
  onUpdate: (updates: Partial<Omit<EventSource, 'id'>>) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(source.name)
  const [url, setUrl] = useState(source.url)

  function save() {
    if (name.trim() && url.trim()) {
      onUpdate({ name: name.trim(), url: url.trim() })
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-xl bg-neumo-bg shadow-neumo-press">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-32 bg-transparent text-xs text-neumo-text outline-none px-2 py-1.5"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="flex-1 bg-transparent text-xs text-neumo-text outline-none px-2 py-1.5"
        />
        <button
          onClick={save}
          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
        >
          <Check size={13} />
        </button>
        <button
          onClick={() => { setEditing(false); setName(source.name); setUrl(source.url) }}
          className="p-1.5 rounded-lg text-neumo-subtle hover:text-neumo-text"
        >
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-neumo-bg shadow-neumo-xs">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-neumo-text truncate">{source.name}</div>
        <div className="text-[10px] text-neumo-subtle truncate font-mono">{source.url}</div>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="p-1.5 rounded-lg text-neumo-muted hover:text-neumo-text"
        title="Edit"
      >
        <Pencil size={12} />
      </button>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg text-neumo-muted hover:text-red-500"
        title="Remove"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

function AddSourceForm({
  onAdd,
}: {
  onAdd: (source: Omit<EventSource, 'id'>) => void
}) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return
    if (!url.startsWith('http://') && !url.startsWith('https://')) return
    onAdd({ name: name.trim(), url: url.trim() })
    setName('')
    setUrl('')
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 p-2 rounded-xl bg-neumo-bg shadow-neumo-press">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Source name"
        className="w-32 bg-transparent text-xs text-neumo-text placeholder-neumo-subtle outline-none px-2 py-1.5"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        className="flex-1 bg-transparent text-xs text-neumo-text placeholder-neumo-subtle outline-none px-2 py-1.5"
      />
      <button
        type="submit"
        disabled={!name.trim() || !url.trim()}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-neumo-accent hover:opacity-95 disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
      >
        <PlusIcon size={11} />
        Add
      </button>
    </form>
  )
}

function ActivityCard({
  activity,
  onAccept,
  onIgnore,
}: {
  activity: ScrapedActivity
  onAccept: () => void
  onIgnore: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const isPending = activity.status === 'pending'
  const isAccepted = activity.status === 'accepted'

  return (
    <div
      className={cn(
        'rounded-2xl bg-neumo-bg transition-all duration-200 overflow-hidden',
        isPending
          ? 'shadow-neumo-sm hover:shadow-neumo'
          : isAccepted
          ? 'shadow-neumo-press'
          : 'shadow-neumo-press opacity-60'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
            categoryBg(activity.category)
          )}>
            <span className={cn('text-xs font-bold', categoryTextColor(activity.category))}>
              {activity.category[0]}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {activity.sourceUrl ? (
                  <a
                    href={activity.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-start gap-1 text-sm font-semibold text-neumo-text leading-snug hover:text-neumo-accent transition-colors"
                  >
                    <span>{activity.title}</span>
                    <ExternalLink size={11} className="mt-0.5 opacity-40 group-hover:opacity-100 shrink-0" />
                  </a>
                ) : (
                  <h3 className="text-sm font-semibold text-neumo-text leading-snug">
                    {activity.title}
                  </h3>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {activity.date && (
                    <span className="flex items-center gap-1 text-[11px] text-neumo-muted">
                      <Calendar size={10} />
                      {format(parseISO(activity.date), 'MMM d')}
                    </span>
                  )}
                  {activity.time && (
                    <span className="flex items-center gap-1 text-[11px] text-neumo-muted">
                      <Clock size={10} />
                      {activity.time}
                      {activity.duration ? ` · ${activity.duration}min` : ''}
                    </span>
                  )}
                  <span className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                    categoryBg(activity.category),
                    categoryTextColor(activity.category)
                  )}>
                    {activity.category}
                  </span>
                </div>
              </div>

              {isAccepted && (
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              )}
              {activity.status === 'ignored' && (
                <X size={16} className="text-neumo-subtle shrink-0 mt-0.5" />
              )}
            </div>

            {activity.recommendationReason && isPending && (
              <div className="mt-2 flex items-start gap-1.5 px-3 py-2 rounded-xl bg-violet-100 border border-violet-200">
                <Sparkles size={12} className="text-violet-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-violet-700 font-medium">{activity.recommendationReason}</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-[11px] text-neumo-subtle hover:text-neumo-muted transition-colors"
        >
          <Info size={11} />
          {expanded ? 'Hide' : 'Show'} description
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {expanded && (
          <p className="mt-2 text-xs text-neumo-muted leading-relaxed bg-neumo-bg shadow-neumo-press rounded-xl px-3 py-2.5 animate-slide-up">
            {activity.description}
          </p>
        )}
      </div>

      {isPending && (
        <div className="flex gap-2 px-3 pb-3">
          <button
            onClick={onIgnore}
            className="flex-1 py-2.5 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press text-xs font-semibold text-neumo-muted hover:text-neumo-text transition-all"
          >
            Ignore
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-95 flex items-center justify-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #10b981, #047857)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
            }}
          >
            <PlusIcon size={13} />
            Add to Plan
          </button>
        </div>
      )}
    </div>
  )
}
