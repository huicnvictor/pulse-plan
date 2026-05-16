'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayStr } from './utils'

const CATEGORY_COLORS_STORE: Record<string, string> = {
  Health: '#10b981',
  Work: '#3b82f6',
  Study: '#8b5cf6',
  Social: '#ec4899',
  Finance: '#f59e0b',
  Creative: '#f97316',
  Personal: '#06b6d4',
}

// ─── Mind Map ────────────────────────────────────────────────────────────────

export interface MindMapSubtask {
  id: string
  title: string
  completed: boolean
}

export interface MindMapNode {
  id: string
  title: string
  category: string
  progress: number
  parentId: string | null
  notes?: string
  subtasks: MindMapSubtask[]
}

const SEED_MINDMAP: MindMapNode[] = [
  {
    id: 'mm1',
    title: 'PM Career',
    category: 'Work',
    progress: 55,
    parentId: null,
    notes: 'Land a PM role by mid-2026.',
    subtasks: [],
  },
  {
    id: 'mm2',
    title: 'IBM PM Cert',
    category: 'Study',
    progress: 80,
    parentId: 'mm1',
    notes: 'Coursera 6-course specialisation.',
    subtasks: [
      { id: 'ms1', title: 'Foundations of PM', completed: true },
      { id: 'ms2', title: 'Agile Project Mgmt', completed: true },
      { id: 'ms3', title: 'Applied PM Capstone', completed: false },
    ],
  },
  {
    id: 'mm3',
    title: 'Portfolio',
    category: 'Creative',
    progress: 40,
    parentId: 'mm1',
    notes: 'Build 5 vibe-coded projects.',
    subtasks: [
      { id: 'ms4', title: 'Pulse Plan app', completed: true },
      { id: 'ms5', title: 'Cleaning quote tool', completed: false },
      { id: 'ms6', title: 'Data viz project', completed: false },
    ],
  },
  {
    id: 'mm4',
    title: 'HCI Research',
    category: 'Study',
    progress: 30,
    parentId: null,
    notes: 'LMU HCI thesis preparation.',
    subtasks: [],
  },
  {
    id: 'mm5',
    title: 'Lit Review',
    category: 'Study',
    progress: 35,
    parentId: 'mm4',
    notes: '20 papers on adaptive UI.',
    subtasks: [
      { id: 'ms7', title: 'Search databases', completed: true },
      { id: 'ms8', title: 'Read 20 papers', completed: false },
      { id: 'ms9', title: 'Write synthesis', completed: false },
    ],
  },
  {
    id: 'mm6',
    title: 'User Study',
    category: 'Study',
    progress: 10,
    parentId: 'mm4',
    notes: 'Usability test with 8 participants.',
    subtasks: [
      { id: 'ms10', title: 'Design protocol', completed: false },
      { id: 'ms11', title: 'Recruit participants', completed: false },
    ],
  },
  {
    id: 'mm7',
    title: 'Health',
    category: 'Health',
    progress: 52,
    parentId: null,
    notes: 'Physical & mental wellbeing.',
    subtasks: [],
  },
  {
    id: 'mm8',
    title: 'Half Marathon',
    category: 'Health',
    progress: 42,
    parentId: 'mm7',
    notes: 'Target: October race.',
    subtasks: [
      { id: 'ms12', title: 'Run 5km comfortable', completed: true },
      { id: 'ms13', title: 'Complete 10km race', completed: true },
      { id: 'ms14', title: 'Run 15km in training', completed: false },
      { id: 'ms15', title: 'Race day!', completed: false },
    ],
  },
  {
    id: 'mm9',
    title: 'Daily Yoga',
    category: 'Health',
    progress: 65,
    parentId: 'mm7',
    notes: '30-day challenge completed.',
    subtasks: [
      { id: 'ms16', title: '30-day challenge', completed: true },
      { id: 'ms17', title: 'Advanced poses', completed: false },
    ],
  },
]

export interface Task {
  id: string
  title: string
  date: string
  time?: string
  duration?: number
  category: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  source: 'manual' | 'scraped'
  scrapedActivityId?: string
  sourceUrl?: string
  notes?: string
}

export interface YearlyGoal {
  id: string
  title: string
  category: string
  color: string
  progress: number
  targetDate: string
  description?: string
  milestones: {
    id: string
    title: string
    completed: boolean
  }[]
}

export interface ScrapedActivity {
  id: string
  title: string
  description: string
  date?: string
  time?: string
  duration?: number
  category: string
  sourceUrl: string
  status: 'pending' | 'accepted' | 'ignored'
  confidence: number
  recommendationReason?: string
  scrapedAt: string
}

export interface UserBehavior {
  category: string
  accepts: number
  rejects: number
}

function updateBehavior(
  behaviors: UserBehavior[],
  category: string,
  action: 'accept' | 'reject'
): UserBehavior[] {
  const existing = behaviors.find((b) => b.category === category)
  if (existing) {
    return behaviors.map((b) =>
      b.category === category
        ? {
            ...b,
            accepts: action === 'accept' ? b.accepts + 1 : b.accepts,
            rejects: action === 'reject' ? b.rejects + 1 : b.rejects,
          }
        : b
    )
  }
  return [
    ...behaviors,
    {
      category,
      accepts: action === 'accept' ? 1 : 0,
      rejects: action === 'reject' ? 1 : 0,
    },
  ]
}

const today = todayStr()
const tomorrow = new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]

const SEED_TASKS: Task[] = [
  { id: 't1', title: 'Morning run (5km)', date: today, time: '07:00', duration: 40, category: 'Health', completed: true, priority: 'high', source: 'manual' },
  { id: 't2', title: 'Review Q2 OKRs', date: today, time: '10:00', duration: 60, category: 'Work', completed: false, priority: 'high', source: 'manual' },
  { id: 't3', title: 'Read 30 pages', date: today, time: '13:00', duration: 45, category: 'Study', completed: false, priority: 'medium', source: 'manual' },
  { id: 't4', title: 'Dinner with friends', date: today, time: '19:00', duration: 120, category: 'Social', completed: false, priority: 'medium', source: 'manual' },
  { id: 't5', title: 'Yoga session', date: tomorrow, time: '08:00', duration: 50, category: 'Health', completed: false, priority: 'medium', source: 'manual' },
  { id: 't6', title: 'Product design review', date: tomorrow, time: '14:00', duration: 90, category: 'Work', completed: false, priority: 'high', source: 'manual' },
]

const SEED_GOALS: YearlyGoal[] = [
  {
    id: 'g1',
    title: 'Run a Half Marathon',
    category: 'Health',
    color: '#10b981',
    progress: 42,
    targetDate: '2026-10-15',
    description: 'Train consistently and complete a 21km race.',
    milestones: [
      { id: 'm1', title: 'Run 5km without stopping', completed: true },
      { id: 'm2', title: 'Complete a 10km race', completed: true },
      { id: 'm3', title: 'Run 15km in training', completed: false },
      { id: 'm4', title: 'Register for half marathon', completed: false },
      { id: 'm5', title: 'Finish the race', completed: false },
    ],
  },
  {
    id: 'g2',
    title: 'Land a PM Role',
    category: 'Work',
    color: '#3b82f6',
    progress: 65,
    targetDate: '2026-07-01',
    description: 'Secure a Product Manager position at a tech company.',
    milestones: [
      { id: 'm6', title: 'Complete IBM PM Certificate', completed: true },
      { id: 'm7', title: 'Build portfolio projects', completed: true },
      { id: 'm8', title: 'Send 20 applications', completed: false },
      { id: 'm9', title: 'Get 3 interviews', completed: false },
      { id: 'm10', title: 'Receive offer', completed: false },
    ],
  },
  {
    id: 'g3',
    title: 'Build 5 Vibe Coding Projects',
    category: 'Creative',
    color: '#f97316',
    progress: 20,
    targetDate: '2026-12-31',
    description: 'Ship 5 polished web apps to showcase in portfolio.',
    milestones: [
      { id: 'm11', title: 'Project 1: Pulse Plan', completed: true },
      { id: 'm12', title: 'Project 2', completed: false },
      { id: 'm13', title: 'Project 3', completed: false },
      { id: 'm14', title: 'Project 4', completed: false },
      { id: 'm15', title: 'Project 5', completed: false },
    ],
  },
]

export interface EventSource {
  id: string
  name: string
  url: string
}

const SEED_SOURCES: EventSource[] = [
  { id: 'src-tum', name: 'TUM Venture Labs', url: 'https://www.tum-venture-labs.de/events/' },
  { id: 'src-munich', name: 'München City', url: 'https://www.muenchen.de/veranstaltungen' },
]

export interface TrashedTask extends Task {
  deletedAt: string
}

export interface TrashedGoal extends YearlyGoal {
  deletedAt: string
}

interface PulsePlanStore {
  tasks: Task[]
  yearlyGoals: YearlyGoal[]
  trashedTasks: TrashedTask[]
  trashedGoals: TrashedGoal[]
  scrapedActivities: ScrapedActivity[]
  userBehaviors: UserBehavior[]
  selectedDate: string
  mindMapNodes: MindMapNode[]
  eventSources: EventSource[]

  addEventSource: (source: Omit<EventSource, 'id'>) => void
  removeEventSource: (id: string) => void
  updateEventSource: (id: string, updates: Partial<Omit<EventSource, 'id'>>) => void

  addMindMapNode: (node: Omit<MindMapNode, 'id'>) => void
  updateMindMapNode: (id: string, updates: Partial<Omit<MindMapNode, 'id' | 'subtasks'>>) => void
  deleteMindMapNode: (id: string) => void
  toggleMindMapSubtask: (nodeId: string, subtaskId: string) => void
  addMindMapSubtask: (nodeId: string, title: string) => void
  updateMindMapSubtask: (nodeId: string, subtaskId: string, title: string) => void
  deleteMindMapSubtask: (nodeId: string, subtaskId: string) => void

  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void

  addYearlyGoal: (goal: Omit<YearlyGoal, 'id'>) => void
  updateYearlyGoal: (id: string, updates: Partial<Omit<YearlyGoal, 'id' | 'milestones'>>) => void
  deleteYearlyGoal: (id: string) => void

  restoreTask: (id: string) => void
  restoreGoal: (id: string) => void
  permanentlyDeleteTask: (id: string) => void
  permanentlyDeleteGoal: (id: string) => void
  clearTrash: () => void
  updateGoalProgress: (id: string, progress: number) => void
  toggleMilestone: (goalId: string, milestoneId: string) => void
  addMilestone: (goalId: string, title: string) => void
  updateMilestone: (goalId: string, milestoneId: string, title: string) => void
  deleteMilestone: (goalId: string, milestoneId: string) => void

  addScrapedActivities: (
    activities: Omit<ScrapedActivity, 'id' | 'scrapedAt' | 'status'>[]
  ) => void
  acceptActivity: (id: string) => void
  ignoreActivity: (id: string) => void

  setSelectedDate: (date: string) => void
}

export const usePulsePlanStore = create<PulsePlanStore>()(
  persist(
    (set, get) => ({
      tasks: SEED_TASKS,
      yearlyGoals: SEED_GOALS,
      trashedTasks: [],
      trashedGoals: [],
      scrapedActivities: [],
      userBehaviors: [],
      selectedDate: today,
      mindMapNodes: SEED_MINDMAP,
      eventSources: SEED_SOURCES,

      addEventSource: (source) =>
        set((s) => ({
          eventSources: [...s.eventSources, { ...source, id: crypto.randomUUID() }],
        })),

      removeEventSource: (id) =>
        set((s) => {
          const source = s.eventSources.find((src) => src.id === id)
          const newSources = s.eventSources.filter((src) => src.id !== id)
          if (!source) return { eventSources: newSources }

          let host: string
          try {
            host = new URL(source.url).hostname
          } catch {
            return { eventSources: newSources }
          }

          const matchesHost = (sourceUrl: string | undefined) => {
            if (!sourceUrl) return false
            try {
              return new URL(sourceUrl).hostname === host
            } catch {
              return false
            }
          }

          // Drop activities from this host. Track their IDs to also drop linked tasks.
          const removedActivityIds = new Set<string>()
          const remainingActivities = s.scrapedActivities.filter((a) => {
            if (matchesHost(a.sourceUrl)) {
              removedActivityIds.add(a.id)
              return false
            }
            return true
          })

          // Move linked tasks to trash so they can be restored if needed.
          const orphanTasks = s.tasks.filter(
            (t) => t.scrapedActivityId && removedActivityIds.has(t.scrapedActivityId)
          )
          const remainingTasks = s.tasks.filter(
            (t) => !t.scrapedActivityId || !removedActivityIds.has(t.scrapedActivityId)
          )
          const now = new Date().toISOString()

          return {
            eventSources: newSources,
            scrapedActivities: remainingActivities,
            tasks: remainingTasks,
            trashedTasks: [
              ...orphanTasks.map((t) => ({ ...t, deletedAt: now })),
              ...s.trashedTasks,
            ],
          }
        }),

      updateEventSource: (id, updates) =>
        set((s) => ({
          eventSources: s.eventSources.map((src) =>
            src.id === id ? { ...src, ...updates } : src
          ),
        })),

      addMindMapNode: (node) =>
        set((s) => ({
          mindMapNodes: [...s.mindMapNodes, { ...node, id: crypto.randomUUID() }],
        })),

      updateMindMapNode: (id, updates) =>
        set((s) => ({
          mindMapNodes: s.mindMapNodes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),

      deleteMindMapNode: (id) =>
        set((s) => ({
          mindMapNodes: s.mindMapNodes.filter(
            (n) => n.id !== id && n.parentId !== id
          ),
        })),

      toggleMindMapSubtask: (nodeId, subtaskId) =>
        set((s) => ({
          mindMapNodes: s.mindMapNodes.map((n) => {
            if (n.id !== nodeId) return n
            const subtasks = n.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            )
            const progress = subtasks.length
              ? Math.round(
                  (subtasks.filter((st) => st.completed).length / subtasks.length) * 100
                )
              : n.progress
            return { ...n, subtasks, progress }
          }),
        })),

      addMindMapSubtask: (nodeId, title) =>
        set((s) => ({
          mindMapNodes: s.mindMapNodes.map((n) => {
            if (n.id !== nodeId) return n
            const subtasks = [
              ...n.subtasks,
              { id: crypto.randomUUID(), title, completed: false },
            ]
            const progress = Math.round(
              (subtasks.filter((st) => st.completed).length / subtasks.length) * 100
            )
            return { ...n, subtasks, progress }
          }),
        })),

      updateMindMapSubtask: (nodeId, subtaskId, title) =>
        set((s) => ({
          mindMapNodes: s.mindMapNodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  subtasks: n.subtasks.map((st) =>
                    st.id === subtaskId ? { ...st, title } : st
                  ),
                }
              : n
          ),
        })),

      deleteMindMapSubtask: (nodeId, subtaskId) =>
        set((s) => ({
          mindMapNodes: s.mindMapNodes.map((n) => {
            if (n.id !== nodeId) return n
            const subtasks = n.subtasks.filter((st) => st.id !== subtaskId)
            const progress = subtasks.length
              ? Math.round(
                  (subtasks.filter((st) => st.completed).length / subtasks.length) * 100
                )
              : n.progress
            return { ...n, subtasks, progress }
          }),
        })),

      addTask: (task) =>
        set((s) => ({
          tasks: [...s.tasks, { ...task, id: crypto.randomUUID() }],
        })),

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTask: (id) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === id)
          if (!task) return s
          // If this task came from a scraped activity, mark that activity as ignored
          // so it stays out of the pending feed and dedupe keeps it from re-appearing
          const scrapedActivities = task.scrapedActivityId
            ? s.scrapedActivities.map((a) =>
                a.id === task.scrapedActivityId ? { ...a, status: 'ignored' as const } : a
              )
            : s.scrapedActivities
          return {
            tasks: s.tasks.filter((t) => t.id !== id),
            trashedTasks: [{ ...task, deletedAt: new Date().toISOString() }, ...s.trashedTasks],
            scrapedActivities,
          }
        }),

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })),

      addYearlyGoal: (goal) =>
        set((s) => ({
          yearlyGoals: [
            ...s.yearlyGoals,
            { ...goal, id: crypto.randomUUID() },
          ],
        })),

      updateYearlyGoal: (id, updates) =>
        set((s) => ({
          yearlyGoals: s.yearlyGoals.map((g) =>
            g.id === id ? { ...g, ...updates, color: CATEGORY_COLORS_STORE[updates.category ?? g.category] ?? g.color } : g
          ),
        })),

      deleteYearlyGoal: (id) =>
        set((s) => {
          const goal = s.yearlyGoals.find((g) => g.id === id)
          if (!goal) return s
          return {
            yearlyGoals: s.yearlyGoals.filter((g) => g.id !== id),
            trashedGoals: [{ ...goal, deletedAt: new Date().toISOString() }, ...s.trashedGoals],
          }
        }),

      restoreTask: (id) =>
        set((s) => {
          const item = s.trashedTasks.find((t) => t.id === id)
          if (!item) return s
          const { deletedAt, ...task } = item
          // If linked to a scraped activity, flip it back to accepted
          const scrapedActivities = task.scrapedActivityId
            ? s.scrapedActivities.map((a) =>
                a.id === task.scrapedActivityId ? { ...a, status: 'accepted' as const } : a
              )
            : s.scrapedActivities
          return {
            trashedTasks: s.trashedTasks.filter((t) => t.id !== id),
            tasks: [...s.tasks, { ...task, completed: false }],
            scrapedActivities,
          }
        }),

      restoreGoal: (id) =>
        set((s) => {
          const item = s.trashedGoals.find((g) => g.id === id)
          if (!item) return s
          const { deletedAt, ...goal } = item
          return {
            trashedGoals: s.trashedGoals.filter((g) => g.id !== id),
            yearlyGoals: [...s.yearlyGoals, goal],
          }
        }),

      permanentlyDeleteTask: (id) =>
        set((s) => ({ trashedTasks: s.trashedTasks.filter((t) => t.id !== id) })),

      permanentlyDeleteGoal: (id) =>
        set((s) => ({ trashedGoals: s.trashedGoals.filter((g) => g.id !== id) })),

      clearTrash: () =>
        set(() => ({ trashedTasks: [], trashedGoals: [] })),

      updateGoalProgress: (id, progress) =>
        set((s) => ({
          yearlyGoals: s.yearlyGoals.map((g) =>
            g.id === id ? { ...g, progress } : g
          ),
        })),

      toggleMilestone: (goalId, milestoneId) =>
        set((s) => ({
          yearlyGoals: s.yearlyGoals.map((g) => {
            if (g.id !== goalId) return g
            const milestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: !m.completed } : m
            )
            const progress = milestones.length
              ? Math.round(
                  (milestones.filter((m) => m.completed).length / milestones.length) * 100
                )
              : g.progress
            return { ...g, milestones, progress }
          }),
        })),

      addMilestone: (goalId, title) =>
        set((s) => ({
          yearlyGoals: s.yearlyGoals.map((g) => {
            if (g.id !== goalId) return g
            const milestones = [...g.milestones, { id: crypto.randomUUID(), title, completed: false }]
            const progress = Math.round(
              (milestones.filter((m) => m.completed).length / milestones.length) * 100
            )
            return { ...g, milestones, progress }
          }),
        })),

      updateMilestone: (goalId, milestoneId, title) =>
        set((s) => ({
          yearlyGoals: s.yearlyGoals.map((g) => {
            if (g.id !== goalId) return g
            const milestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, title } : m
            )
            return { ...g, milestones }
          }),
        })),

      deleteMilestone: (goalId, milestoneId) =>
        set((s) => ({
          yearlyGoals: s.yearlyGoals.map((g) => {
            if (g.id !== goalId) return g
            const milestones = g.milestones.filter((m) => m.id !== milestoneId)
            const progress = milestones.length
              ? Math.round(
                  (milestones.filter((m) => m.completed).length / milestones.length) * 100
                )
              : 0
            return { ...g, milestones, progress }
          }),
        })),

      addScrapedActivities: (activities) =>
        set((s) => {
          const existingUrls = new Set(
            s.scrapedActivities.map((a) => a.sourceUrl).filter(Boolean)
          )
          const newOnes = activities
            .filter((a) => a.sourceUrl && !existingUrls.has(a.sourceUrl))
            .map((a) => ({
              ...a,
              id: crypto.randomUUID(),
              status: 'pending' as const,
              scrapedAt: new Date().toISOString(),
            }))
          return {
            scrapedActivities: [...newOnes, ...s.scrapedActivities],
          }
        }),

      acceptActivity: (id) => {
        const activity = get().scrapedActivities.find((a) => a.id === id)
        if (!activity) return
        const taskDate = activity.date || todayStr()
        set((s) => ({
          scrapedActivities: s.scrapedActivities.map((a) =>
            a.id === id ? { ...a, status: 'accepted' } : a
          ),
          tasks: [
            ...s.tasks,
            {
              id: crypto.randomUUID(),
              title: activity.title,
              date: taskDate,
              time: activity.time,
              duration: activity.duration,
              category: activity.category,
              completed: false,
              priority: 'medium',
              source: 'scraped',
              scrapedActivityId: id,
              sourceUrl: activity.sourceUrl,
            },
          ],
          userBehaviors: updateBehavior(s.userBehaviors, activity.category, 'accept'),
          // Jump daily plan to the activity's date so it's visible there too
          selectedDate: taskDate,
        }))
      },

      ignoreActivity: (id) => {
        const activity = get().scrapedActivities.find((a) => a.id === id)
        if (!activity) return
        set((s) => ({
          scrapedActivities: s.scrapedActivities.map((a) =>
            a.id === id ? { ...a, status: 'ignored' } : a
          ),
          userBehaviors: updateBehavior(s.userBehaviors, activity.category, 'reject'),
        }))
      },

      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    { name: 'pulse-plan-v1' }
  )
)
