// Parses Chinese / English time and date hints out of free-form task text.
// Returns the values it found plus the title with matched fragments removed.

export interface ParsedTaskText {
  title: string
  date?: string // YYYY-MM-DD
  time?: string // HH:MM (24h)
}

const CN_DIGITS: Record<string, number> = {
  零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
}

function cnToNumber(s: string): number | null {
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  if (s in CN_DIGITS) return CN_DIGITS[s]
  if (s.length === 2 && s[0] === '十' && s[1] in CN_DIGITS) return 10 + CN_DIGITS[s[1]]
  if (s.length === 2 && s[1] === '十' && s[0] in CN_DIGITS) return CN_DIGITS[s[0]] * 10
  if (s.length === 3 && s[1] === '十' && s[0] in CN_DIGITS && s[2] in CN_DIGITS) {
    return CN_DIGITS[s[0]] * 10 + CN_DIGITS[s[2]]
  }
  return null
}

const CN_WEEKDAY: Record<string, number> = {
  日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6,
}

const EN_WEEKDAY: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(d: Date, n: number) {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

function weekdayDate(today: Date, target: number, weekOffset: 'this' | 'next' | 'after-next'): Date {
  const diffToTarget = (target - today.getDay() + 7) % 7
  if (weekOffset === 'this') return addDays(today, diffToTarget)
  if (weekOffset === 'next') return addDays(today, diffToTarget === 0 ? 7 : diffToTarget + 7)
  return addDays(today, (diffToTarget === 0 ? 7 : diffToTarget) + 7)
}

export function parseTaskText(input: string, now: Date = new Date()): ParsedTaskText {
  let text = input
  let date: string | undefined
  let time: string | undefined

  // ── Date: Chinese relative ──────────────────────────────────────────────
  const cnRel: Array<[RegExp, number]> = [
    [/大后天/, 3],
    [/后天/, 2],
    [/明天|明日/, 1],
    [/今天|今日/, 0],
  ]
  for (const [re, offset] of cnRel) {
    const m = text.match(re)
    if (m) {
      date = fmtDate(addDays(now, offset))
      text = text.replace(re, ' ')
      break
    }
  }

  // ── Date: English relative ──────────────────────────────────────────────
  if (!date) {
    const enRel: Array<[RegExp, number]> = [
      [/\bday after tomorrow\b/i, 2],
      [/\btomorrow\b|\btmrw\b/i, 1],
      [/\btoday\b/i, 0],
    ]
    for (const [re, offset] of enRel) {
      const m = text.match(re)
      if (m) {
        date = fmtDate(addDays(now, offset))
        text = text.replace(re, ' ')
        break
      }
    }
  }

  // ── Date: Chinese weekday ───────────────────────────────────────────────
  if (!date) {
    const m = text.match(/(下下|下|这)?(?:周|星期|礼拜)([一二三四五六日天])/)
    if (m) {
      const target = CN_WEEKDAY[m[2]]
      const offset: 'this' | 'next' | 'after-next' =
        m[1] === '下下' ? 'after-next' : m[1] === '下' ? 'next' : 'this'
      date = fmtDate(weekdayDate(now, target, offset))
      text = text.replace(m[0], ' ')
    }
  }

  // ── Date: English weekday ───────────────────────────────────────────────
  if (!date) {
    const m = text.match(/\b(next |this )?(sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:s|nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?)\b/i)
    if (m) {
      const target = EN_WEEKDAY[m[2].toLowerCase()]
      const offset: 'this' | 'next' = /next/i.test(m[1] || '') ? 'next' : 'this'
      date = fmtDate(weekdayDate(now, target, offset))
      text = text.replace(m[0], ' ')
    }
  }

  // ── Date: M月D日 / M月D号 ───────────────────────────────────────────────
  if (!date) {
    const m = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?/)
    if (m) {
      const month = parseInt(m[1], 10)
      const day = parseInt(m[2], 10)
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const candidate = new Date(now.getFullYear(), month - 1, day)
        // If date has passed this year, assume next year
        if (candidate < addDays(now, -1)) candidate.setFullYear(now.getFullYear() + 1)
        date = fmtDate(candidate)
        text = text.replace(m[0], ' ')
      }
    }
  }

  // ── Time: Chinese 点 / 时 ───────────────────────────────────────────────
  {
    const re = /(凌晨|清晨|早上|早晨|上午|中午|下午|傍晚|晚上|晚|夜里|夜晚)?\s*(\d{1,2}|[零一二两三四五六七八九十]{1,3})\s*[点时](?:\s*(\d{1,2}|半|[一二三四五][十]?|[零一二两三四五六七八九十]{1,3})\s*分?)?/
    const m = text.match(re)
    if (m) {
      const period = m[1]
      const hour = cnToNumber(m[2])
      let minute = 0
      if (m[3]) {
        if (m[3] === '半') minute = 30
        else {
          const n = cnToNumber(m[3])
          if (n !== null) minute = n
        }
      }
      if (hour !== null && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        let h = hour
        if (period === '下午' || period === '傍晚' || period === '晚上' || period === '晚' || period === '夜里' || period === '夜晚') {
          if (h < 12) h += 12
        } else if (period === '中午') {
          if (h < 12) h += 12 // 中午1点 → 13:00
          if (h === 24) h = 12
        } else if (period === '凌晨') {
          if (h === 12) h = 0
        } else if (period === '上午' || period === '早上' || period === '早晨' || period === '清晨') {
          if (h === 12) h = 0
        }
        time = `${pad(h)}:${pad(minute)}`
        text = text.replace(m[0], ' ')
      }
    }
  }

  // ── Time: English am/pm ─────────────────────────────────────────────────
  if (!time) {
    const m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i)
    if (m) {
      let hour = parseInt(m[1], 10)
      const minute = m[2] ? parseInt(m[2], 10) : 0
      const isPm = /^p/i.test(m[3])
      if (isPm && hour < 12) hour += 12
      if (!isPm && hour === 12) hour = 0
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        time = `${pad(hour)}:${pad(minute)}`
        text = text.replace(m[0], ' ')
      }
    }
  }

  // ── Time: 24h HH:MM ─────────────────────────────────────────────────────
  if (!time) {
    const m = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
    if (m) {
      time = `${pad(parseInt(m[1], 10))}:${m[2]}`
      text = text.replace(m[0], ' ')
    }
  }

  // ── Cleanup leftover joiner words ───────────────────────────────────────
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/^\s*[，,、。.;；:：]\s*/, '')
    .replace(/\s*[，,、。.;；:：]\s*$/, '')
    .replace(/\s+\b(at|on|by|in|the)\s*$/i, '')
    .replace(/^\s*\b(at|on|by|in)\s+/i, '')
    .replace(/^\s*(在|到|于|要)\s*/, '')
    .replace(/\s*(在|到|于)\s*$/, '')
    .trim()

  return {
    title: cleaned || input.trim(),
    date,
    time,
  }
}
