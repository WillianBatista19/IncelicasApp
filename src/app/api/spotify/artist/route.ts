import { NextResponse } from 'next/server'

export const runtime    = 'nodejs'
export const dynamic    = 'force-dynamic'
export const fetchCache = 'force-no-store'

async function getToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body:  'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Token request failed: ${res.status}`)
  const json = await res.json() as { access_token: string }
  return json.access_token
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (!process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Spotify not configured' }, { status: 500 })
    }

    const token = await getToken()

    // ?action=search&q=artist+name
    if (action === 'search') {
      const q = searchParams.get('q')
      if (!q) return NextResponse.json({ error: 'Missing q' }, { status: 400 })

      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=8&market=BR`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache:   'no-store',
      })
      if (!res.ok) return NextResponse.json({ error: `Spotify search failed: ${res.status}` }, { status: res.status })

      const json = await res.json() as {
        artists?: { items?: Array<{
          id: string; name: string
          images: { url: string }[]
          followers: { total: number }
          genres: string[]
        }> }
      }

      const artists = (json.artists?.items ?? []).map(a => ({
        id:        a.id,
        name:      a.name,
        image:     a.images[0]?.url ?? null,
        followers: a.followers?.total ?? 0,
        genres:    a.genres?.slice(0, 2) ?? [],
      }))
      return NextResponse.json({ artists })
    }

    // ?action=albums&id=artistId
    if (action === 'albums') {
      const id = searchParams.get('id')
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

      type SpotifyAlbum = {
        id: string; name: string
        images: { url: string }[]
        release_date: string
        total_tracks: number
        next?: string | null
      }
      type AlbumsPage = { items?: SpotifyAlbum[]; next?: string | null }

      const allItems: SpotifyAlbum[] = []
      // Spotify dev-mode apps are capped at limit=10 for this endpoint
      const firstPageParams = new URLSearchParams({
        include_groups: 'album',
        market:         'BR',
        limit:          '10',
      })
      let nextUrl: string | null =
        `https://api.spotify.com/v1/artists/${id}/albums?${firstPageParams}`

      while (nextUrl) {
        const res = await fetch(nextUrl, {
          headers: { Authorization: `Bearer ${token}` },
          cache:   'no-store',
        })
        if (!res.ok) {
          const body = await res.text()
          return NextResponse.json({ error: `Spotify albums failed: ${res.status}` }, { status: res.status })
        }
        const page = await res.json() as AlbumsPage
        allItems.push(...(page.items ?? []))
        nextUrl = page.next ?? null
        if (allItems.length >= 100) break  // safety cap
      }

      // Deduplicate by normalised name (Spotify returns regional duplicates)
      const seen = new Set<string>()
      const albums = allItems
        .filter(a => {
          const key = a.name.toLowerCase().trim()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .map(a => ({
          id:          a.id,
          name:        a.name,
          cover:       a.images[0]?.url ?? a.images[1]?.url ?? a.images[2]?.url ?? null,
          year:        a.release_date?.split('-')[0] ?? null,
          totalTracks: a.total_tracks,
        }))

      return NextResponse.json({ albums })
    }

    // ?action=tracks&id=albumId
    if (action === 'tracks') {
      const id = searchParams.get('id')
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

      const res = await fetch(
        `https://api.spotify.com/v1/albums/${id}/tracks?limit=50&market=BR`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
      )
      if (!res.ok) return NextResponse.json({ error: `Spotify tracks failed: ${res.status}` }, { status: res.status })

      const json = await res.json() as {
        items?: Array<{ track_number: number; name: string; id: string; duration_ms: number }>
      }
      const tracks = (json.items ?? []).map(t => ({
        position: t.track_number,
        name:     t.name,
        id:       t.id,
        duration: t.duration_ms,
      }))
      return NextResponse.json({ tracks })
    }

    return NextResponse.json({ error: 'Invalid action. Use search | albums | tracks' }, { status: 400 })
  } catch (err) {
    console.error('[Spotify Artist]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
