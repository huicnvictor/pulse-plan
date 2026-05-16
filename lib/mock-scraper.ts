import type { ScrapedActivity } from './store'

type RawActivity = Omit<ScrapedActivity, 'id' | 'scrapedAt' | 'status'>

const todayPlus = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const ACTIVITY_POOLS: RawActivity[][] = [
  // Pool A – fitness / outdoors
  [
    {
      title: 'Sunrise Yoga at Englischer Garten',
      description: 'Open-air yoga session for all levels. Bring a mat and stay for tea afterwards.',
      date: todayPlus(1),
      time: '07:30',
      duration: 60,
      category: 'Health',
      sourceUrl: '',
      confidence: 0.93,
    },
    {
      title: '5K Community Run – Olympic Park',
      description: 'Casual Saturday run around the Olympic Park. Pace groups for every level.',
      date: todayPlus(2),
      time: '09:00',
      duration: 45,
      category: 'Health',
      sourceUrl: '',
      confidence: 0.88,
    },
    {
      title: 'Climbing Intro Workshop',
      description: 'Learn bouldering basics at Block House. Shoes and chalk bag provided.',
      date: todayPlus(3),
      time: '18:00',
      duration: 90,
      category: 'Health',
      sourceUrl: '',
      confidence: 0.76,
    },
  ],
  // Pool B – professional / study
  [
    {
      title: 'Product Management Meetup – Munich',
      description: 'Monthly PM meetup: lightning talks on growth loops and zero-to-one thinking.',
      date: todayPlus(4),
      time: '19:00',
      duration: 120,
      category: 'Work',
      sourceUrl: '',
      confidence: 0.95,
    },
    {
      title: 'UX Research Skill Share',
      description: 'Collaborative session on guerrilla user testing. Hosted by LMU HCI lab.',
      date: todayPlus(2),
      time: '16:00',
      duration: 90,
      category: 'Study',
      sourceUrl: '',
      confidence: 0.91,
    },
    {
      title: 'Figma Advanced Workshop',
      description: 'Deep dive into component variants, auto-layout, and advanced prototyping.',
      date: todayPlus(5),
      time: '10:00',
      duration: 180,
      category: 'Work',
      sourceUrl: '',
      confidence: 0.84,
    },
  ],
  // Pool C – social / creative
  [
    {
      title: 'Photography Walk – Altstadt',
      description: 'Explore Munich\'s old town with fellow photographers. All camera types welcome.',
      date: todayPlus(1),
      time: '15:00',
      duration: 120,
      category: 'Creative',
      sourceUrl: '',
      confidence: 0.79,
    },
    {
      title: 'Language Exchange Café',
      description: 'Practice English, German, or Mandarin with native speakers over coffee.',
      date: todayPlus(3),
      time: '17:30',
      duration: 90,
      category: 'Social',
      sourceUrl: '',
      confidence: 0.82,
    },
    {
      title: 'Startup Pitch Night',
      description: 'Watch early-stage founders pitch, network with investors and builders.',
      date: todayPlus(6),
      time: '19:30',
      duration: 150,
      category: 'Work',
      sourceUrl: '',
      confidence: 0.87,
    },
  ],
]

function getRecommendationReason(
  activity: RawActivity,
  behaviors: { category: string; accepts: number; rejects: number }[]
): string | undefined {
  const b = behaviors.find((x) => x.category === activity.category)
  if (!b) return undefined
  const rate = b.accepts / (b.accepts + b.rejects + 0.001)
  if (rate > 0.6) return `You've accepted ${b.accepts} ${activity.category} events before`
  return undefined
}

export async function simulateScrape(
  url: string,
  behaviors: { category: string; accepts: number; rejects: number }[]
): Promise<RawActivity[]> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 2200))

  // Pick a pool based on URL hash
  const hash = url.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const pool = ACTIVITY_POOLS[hash % ACTIVITY_POOLS.length]

  // Pick 3–5 activities
  const count = 3 + (hash % 3)
  const shuffled = [...pool].sort(() => (hash % 3 === 0 ? 0.5 : -0.5))
  const picked = shuffled.slice(0, count)

  return picked.map((a) => ({
    ...a,
    sourceUrl: url,
    recommendationReason: getRecommendationReason(a, behaviors),
  }))
}
