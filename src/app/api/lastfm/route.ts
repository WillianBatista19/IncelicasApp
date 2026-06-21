import { NextRequest, NextResponse } from 'next/server'

const BASE    = 'https://ws.audioscrobbler.com/2.0/'
const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY ?? process.env.LASTFM_API_KEY ?? ''

export async function GET(req: NextRequest) {
  console.log('[lastfm] API_KEY present:', !!API_KEY, '| source: NEXT_PUBLIC_LASTFM_API_KEY =', !!process.env.NEXT_PUBLIC_LASTFM_API_KEY, '| LASTFM_API_KEY =', !!process.env.LASTFM_API_KEY)

  if (!API_KEY) {
    console.error('[lastfm] No API key configured — set NEXT_PUBLIC_LASTFM_API_KEY or LASTFM_API_KEY in Vercel env vars')
    return NextResponse.json({ error: 'Last.fm API key not configured' }, { status: 500 })
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const qs     = new URLSearchParams({ ...params, api_key: API_KEY, format: 'json' })
  const url    = `${BASE}?${qs}`

  console.log('[lastfm] fetching:', url.replace(API_KEY, 'REDACTED'))

  try {
    const res  = await fetch(url, { cache: 'no-store' })
    console.log('[lastfm] Last.fm status:', res.status)
    const json = await res.json()
    if (!res.ok) console.error('[lastfm] Last.fm error response:', JSON.stringify(json))
    return NextResponse.json(json, { status: res.ok ? 200 : res.status })
  } catch (err) {
    console.error('[lastfm] fetch threw:', err)
    return NextResponse.json({ error: 'Failed to fetch from Last.fm' }, { status: 502 })
  }
}
