import { NextRequest, NextResponse } from 'next/server'

// Server-side proxy for Deezer search.
// Deezer's API blocks cross-origin requests from browsers, so all
// client-side calls go through here instead of hitting api.deezer.com directly.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=8`
  const res  = await fetch(url, { headers: { Accept: 'application/json' } })

  if (!res.ok) {
    console.error('[Deezer proxy] search failed:', res.status)
    return NextResponse.json({ data: [] })
  }

  const json = await res.json() as { data?: unknown[] }
  return NextResponse.json({ data: json.data ?? [] })
}
