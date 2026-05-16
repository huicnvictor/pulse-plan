import { NextResponse } from 'next/server'
import { scrapeTum } from '@/lib/scrapers/tum'
import { scrapeMuenchen } from '@/lib/scrapers/muenchen'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    let activities
    if (host.includes('tum-venture-labs.de')) {
      activities = await scrapeTum(url)
    } else if (host.includes('muenchen.de')) {
      activities = await scrapeMuenchen(url)
    } else {
      return NextResponse.json(
        { error: `Site not supported yet: ${host}. Currently supports tum-venture-labs.de and muenchen.de` },
        { status: 400 }
      )
    }
    return NextResponse.json({ activities })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Scrape failed' },
      { status: 500 }
    )
  }
}
