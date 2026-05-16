import { load } from 'cheerio'
import type { ScrapedActivity } from '../store'

type RawActivity = Omit<ScrapedActivity, 'id' | 'scrapedAt' | 'status'>

function parseEnglishDate(text: string): string | undefined {
  const trimmed = text.trim()
  if (!trimmed) return undefined
  const d = new Date(trimmed)
  if (isNaN(d.getTime())) return undefined
  return d.toISOString().split('T')[0]
}

export async function scrapeTum(url: string): Promise<RawActivity[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PulsePlan/1.0)' },
  })
  if (!res.ok) throw new Error(`TUM fetch failed: ${res.status}`)
  const html = await res.text()
  const $ = load(html)

  const events: RawActivity[] = []
  $('.event-tile').each((_, el) => {
    const titleEl = $(el).find('h3 a').first()
    const title = titleEl.text().trim()
    const link = titleEl.attr('href') || url
    const dateText = $(el).find('p.fw-bold.c-neutral-muted').first().text().trim()
    const categoryText = $(el).find('.comb-text').first().text().trim()

    if (!title) return

    const date = parseEnglishDate(dateText)
    // Skip past events
    if (date) {
      const today = new Date().toISOString().split('T')[0]
      if (date < today) return
    }

    events.push({
      title,
      description: categoryText
        ? `${categoryText} · TUM Venture Labs`
        : 'TUM Venture Labs',
      date,
      category: 'Work',
      sourceUrl: link,
      confidence: 1.0,
    })
  })

  // Sort by date ascending (soonest first)
  events.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
  return events
}
