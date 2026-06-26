'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export interface AlbumEntry {
  album_id:     string
  album_name:   string
  artist_name:  string
  cover_url:    string | null
  release_year: string | null
  avg_score:    number | null
  rating_count: number
  last_rated:   string
}

const PAGE_SIZE = 20

export default function AlbumListClient({ albums }: { albums: AlbumEntry[] }) {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return albums
    return albums.filter(a =>
      a.album_name.toLowerCase().includes(q) ||
      a.artist_name.toLowerCase().includes(q)
    )
  }, [albums, search])

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="🔍  Filtrar por álbum ou artista..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        className="w-full rounded-xl bg-zinc-800/60 border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#D4537E]"
      />

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">Nenhum álbum avaliado ainda.</p>
      ) : (
        <>
          <p className="text-xs text-zinc-600">{filtered.length} álbum{filtered.length !== 1 ? 'ns' : ''}</p>
          <div className="space-y-2">
            {visible.map(album => (
              <Link
                key={album.album_id}
                href={`/communities/musica/avaliar/${album.album_id}`}
                className="flex items-center gap-3 rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 hover:bg-zinc-800/60 transition-colors"
              >
                {album.cover_url ? (
                  <Image
                    src={album.cover_url}
                    alt={album.album_name}
                    width={40} height={40}
                    className="rounded-lg shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-lg shrink-0">🎵</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{album.album_name}</p>
                  <p className="text-xs text-zinc-400 truncate">{album.artist_name}</p>
                </div>
                <div className="shrink-0 text-right">
                  {album.avg_score != null ? (
                    <p className="text-sm font-bold text-[#D4537E]">⭐ {album.avg_score.toFixed(1)}</p>
                  ) : (
                    <p className="text-sm font-bold text-zinc-600">—</p>
                  )}
                  <p className="text-xs text-zinc-600">{album.rating_count} aval.</p>
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="w-full rounded-xl bg-white/10 py-3 text-sm text-zinc-300 hover:bg-white/20 transition-colors"
            >
              Carregar mais ({filtered.length - visible.length} restantes)
            </button>
          )}
        </>
      )}
    </div>
  )
}
