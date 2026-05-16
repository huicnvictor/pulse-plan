'use client'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Globe,
  CalendarDays,
  Target,
  Sparkles,
  TrendingUp,
  ExternalLink,
} from 'lucide-react'
import { usePulsePlanStore } from '@/lib/store'
import { todayStr, categoryBg, categoryTextColor } from '@/lib/utils'
import { format } from 'date-fns'

export default function Dashboard() {
  const today = todayStr()
  const tasks = usePulsePlanStore((s) => s.tasks)
  const yearlyGoals = usePulsePlanStore((s) => s.yearlyGoals)
  const scrapedActivities = usePulsePlanStore((s) => s.scrapedActivities)
  const toggleTask = usePulsePlanStore((s) => s.toggleTask)
  const deleteTask = usePulsePlanStore((s) => s.deleteTask)
  const deleteYearlyGoal = usePulsePlanStore((s) => s.deleteYearlyGoal)

  const todayTasks = tasks.filter((t) => t.date === today)
  const completedToday = todayTasks.filter((t) => t.completed).length
  const pendingScrapes = scrapedActivities.filter((a) => a.status === 'pending').length
  const avgGoalProgress = yearlyGoals.length
    ? Math.round(yearlyGoals.reduce((s, g) => s + g.progress, 0) / yearlyGoals.length)
    : 0

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-neumo-muted text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        <h1 className="text-2xl font-semibold mt-1 text-neumo-text">
          {greeting()}, Victor 👋
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Tasks Today"
          value={`${completedToday}/${todayTasks.length}`}
          sub="completed"
          icon={<CheckCircle2 size={18} className="text-emerald-500" />}
        />
        <StatCard
          label="Pending Discover"
          value={String(pendingScrapes)}
          sub="activities"
          icon={<Globe size={18} className="text-neumo-accent" />}
        />
        <StatCard
          label="Year Goals"
          value={String(yearlyGoals.length)}
          sub="in progress"
          icon={<Target size={18} className="text-blue-500" />}
        />
        <StatCard
          label="Avg Progress"
          value={`${avgGoalProgress}%`}
          sub="of goals"
          icon={<TrendingUp size={18} className="text-amber-500" />}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's tasks */}
        <section className="rounded-3xl bg-neumo-bg shadow-neumo-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neumo-text flex items-center gap-2">
              <CalendarDays size={15} className="text-neumo-muted" />
              Today
            </h2>
            <Link
              href="/daily"
              className="text-xs text-neumo-accent hover:opacity-80 flex items-center gap-1 transition-opacity"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {todayTasks.length === 0 && (
              <p className="text-sm text-neumo-subtle py-6 text-center">No tasks today</p>
            )}
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press transition-all group"
              >
                <button
                  onClick={() => deleteTask(task.id)}
                  className="shrink-0 text-neumo-subtle hover:text-red-500 transition-colors"
                  title="Delete task"
                >
                  <Circle size={16} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate text-neumo-text">{task.title}</p>
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
                  </div>
                  {task.time && (
                    <p className="text-xs text-neumo-muted">{task.time}</p>
                  )}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryBg(task.category)} ${categoryTextColor(task.category)} shrink-0`}>
                  {task.category}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Year goals preview */}
        <section className="rounded-3xl bg-neumo-bg shadow-neumo-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neumo-text flex items-center gap-2">
              <Target size={15} className="text-neumo-muted" />
              Year Goals
            </h2>
            <Link
              href="/yearly"
              className="text-xs text-neumo-accent hover:opacity-80 flex items-center gap-1 transition-opacity"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {yearlyGoals.slice(0, 4).map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-neumo-bg shadow-neumo-xs hover:shadow-neumo-press transition-all group"
              >
                <button
                  onClick={() => deleteYearlyGoal(goal.id)}
                  className="shrink-0 text-neumo-subtle hover:text-red-500 transition-colors"
                  title="Delete goal"
                >
                  <Circle size={16} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-neumo-text truncate flex-1 mr-2">{goal.title}</p>
                    <span className="text-xs font-semibold text-neumo-muted shrink-0">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-neumo-bg shadow-neumo-press rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Discover CTA */}
      {pendingScrapes > 0 && (
        <Link
          href="/scraper"
          className="flex items-center justify-between p-4 rounded-2xl bg-neumo-bg shadow-neumo-sm hover:shadow-neumo-press transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
              }}
            >
              <Sparkles size={17} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neumo-text">
                {pendingScrapes} new {pendingScrapes === 1 ? 'activity' : 'activities'} waiting
              </p>
              <p className="text-xs text-neumo-muted">Review and add to your plan</p>
            </div>
          </div>
          <ArrowRight size={17} className="text-neumo-muted group-hover:text-neumo-accent group-hover:translate-x-1 transition-all" />
        </Link>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
}) {
  return (
    <div className="p-4 rounded-2xl bg-neumo-bg shadow-neumo-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neumo-muted">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-neumo-bg shadow-neumo-press flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-neumo-text">{value}</p>
        <p className="text-xs text-neumo-muted">{sub}</p>
      </div>
    </div>
  )
}
