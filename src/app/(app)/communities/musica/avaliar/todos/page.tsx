import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AlbumListClient from '@/components/music/AlbumListClient'
import type { AlbumEntry } from '@/components/music/AlbumListClient'

export const dynamic = 'force-dynamic'

export default async function TodosPage() {
  const supabase = await createClient()

  const { data: allRatings } = await supabase
    .from('album_ratings')
    .select('album_id, album_name, artist_name, cover_url, release_year, overall_score, created_at')
    .order('created_at', { ascending: false })

  // Aggregate per-album in JS (Supabase JS has no GROUP BY)
  const albumMap = new Map<string, {
    album_name:   string
    artist_name:  string
    cover_url:    string | null
    release_year: string | null
    scores:       number[]
    count:        number
    last_rated:   string
  }>()

  for (const r of allRatings ?? []) {
    if (!albumMap.has(r.album_id)) {
      albumMap.set(r.album_id, {
        album_name:   r.album_name,
        artist_name:  r.artist_name,
        cover_url:    r.cover_url,
        release_year: (r as Record<string, unknown>).release_year as string | null ?? null,
        scores:       [],
        count:        0,
        last_rated:   r.created_at,
      })
    }
    const entry = albumMap.get(r.album_id)!
    entry.count++
    if (r.overall_score != null) entry.scores.push(r.overall_score)
    if (r.created_at > entry.last_rated) entry.last_rated = r.created_at
  }

  const albums: AlbumEntry[] = Array.from(albumMap.entries())
    .map(([id, v]) => ({
      album_id:     id,
      album_name:   v.album_name,
      artist_name:  v.artist_name,
      cover_url:    v.cover_url,
      release_year: v.release_year,
      avg_score:    v.scores.length
        ? Math.round((v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 10) / 10
        : null,
      rating_count: v.count,
      last_rated:   v.last_rated,
    }))
    .sort((a, b) => b.last_rated.localeCompare(a.last_rated))

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/communities/musica/avaliar"
          className="text-zinc-400 hover:text-white transition-colors text-sm"
        >
          ← Avaliar Álbum
        </Link>
      </div>

      <h1 className="text-xl font-bold text-zinc-100">Todas as avaliações</h1>

      <AlbumListClient albums={albums} />
    </main>
  )
}
