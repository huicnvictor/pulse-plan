import { load } from 'cheerio'
import type { ScrapedActivity } from '../store'

type RawActivity = Omit<ScrapedActivity, 'id' | 'scrapedAt' | 'status'>

// Two months window
const HORIZON_DAYS = 60

// "09.05.2026 - 08:00:00" → "08:00"
function parseTimeFromDetailDatetime(dt: string | undefined): string | undefined {
  if (!dt) return undefined
  const m = dt.match(/(\d{2}:\d{2})/)
  return m ? m[1] : undefined
}

// "2026-05-08T12:00:00Z" → "2026-05-08"
function isoToDate(iso: string): string | undefined {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : undefined
}

// "Sa. 09.05.2026 08:00" → minutes (for duration calc)
function parseHHMM(text: string): number | undefined {
  const m = text.match(/(\d{2}):(\d{2})/)
  if (!m) return undefined
  return parseInt(m[1]) * 60 + parseInt(m[2])
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PulsePlan/1.0)' },
  })
  if (!res.ok) throw new Error(`muenchen.de fetch failed: ${res.status}`)
  return res.text()
}

export async function scrapeMuenchen(url: string): Promise<RawActivity[]> {
  // Landing page has no real listing — auto-switch to a richer endpoint
  let effectiveUrl = url
  const u = new URL(url)
  if (u.pathname === '/veranstaltungen' || u.pathname === '/veranstaltungen/') {
    effectiveUrl = 'https://www.muenchen.de/veranstaltungen/event/termine-der-woche'
  }

  const html = await fetchHtml(effectiveUrl)
  const $ = load(html)

  const today = new Date().toISOString().split('T')[0]
  const horizon = new Date(Date.now() + HORIZON_DAYS * 86400000)
    .toISOString()
    .split('T')[0]

  const events: RawActivity[] = []
  $('.m-event-list-item').each((_, el) => {
    const titleEl = $(el).find('h3.m-event-list-item__headline a').first()
    const title = titleEl.find('span').first().text().trim() || titleEl.text().trim()
    const href = titleEl.attr('href') || ''
    const link = href.startsWith('http')
      ? href
      : `https://www.muenchen.de${href}`

    const startIso = $(el)
      .find('time[itemprop="startDate"]')
      .attr('datetime') || ''
    const endIso = $(el)
      .find('time[itemprop="endDate"]')
      .attr('datetime') || startIso
    const startDate = isoToDate(startIso)
    const endDate = isoToDate(endIso)

    // Keep only events whose [start, end] overlaps with [today, horizon]
    // i.e., end >= today AND start <= horizon
    if (startDate && endDate) {
      if (endDate < today || startDate > horizon) return
    }

    // For ongoing events, surface today as the actionable date
    const date =
      startDate && startDate < today ? today : startDate

    // Time and duration from the <time> elements inside the detail row
    const detailRow = $(el).find('.m-event-list-item__detail').first()
    const timeElements = detailRow.find('time')
    const startDt = timeElements.eq(0).attr('datetime')
    const endDt = timeElements.eq(1).attr('datetime')
    const time = parseTimeFromDetailDatetime(startDt)
    const endTime = parseTimeFromDetailDatetime(endDt)
    let duration: number | undefined
    if (time && endTime) {
      const start = parseHHMM(time)
      const end = parseHHMM(endTime)
      if (start !== undefined && end !== undefined && end > start) {
        duration = end - start
      }
    }

    const location = $(el).find('p[itemprop="location"]').first().text().trim()
    const description = location || 'muenchen.de event'

    if (!title) return

    events.push({
      title,
      description,
      date,
      time,
      duration,
      category: 'Social',
      sourceUrl: link,
      confidence: 1.0,
    })
  })

  // Sort by date ascending
  events.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
  return events
}
