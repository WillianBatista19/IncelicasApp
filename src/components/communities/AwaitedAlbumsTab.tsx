'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { addAwaitedAlbum, toggleAlbumVote } from '@/app/(app)/communities/musica/awaited-albums/actions'

export interface AwaitedAlbum {
  id:           string
  album_id:     string
  album_name:   string
  artist_name:  string
  cover_url:    string | null
  release_date: string | null
  vote_count:   number
  user_voted:   boolean
}

interface SpotifyResult {
  id:          string
  name:        string
  artist:      string
  cover:       string | null
  releaseDate: string | null
}

interface Props {
  communityId:   string
  initialAlbums: AwaitedAlbum[]
  currentUserId: string | null
  isMember:      boolean
}

function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr + 'T00:00:00')
  const diff   = target.getTime() - Date.now()
  if (diff <= 0) return null
  return Math.ceil(diff / 86_400_000)
}

function isReleased(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr + 'T00:00:00').getTime() <= Date.now()
}

function isFutureRelease(releaseDate: string | null): boolean {
  if (!releaseDate) return false
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const parts = releaseDate.split('-')
  if (parts.length === 1) return parseInt(parts[0]) >= parseInt(today.substring(0, 4))
  if (parts.length === 2) return releaseDate >= today.substring(0, 7)
  return releaseDate > today
}

function normalizeReleaseDate(d: string): string {
  const parts = d.split('-')
  if (parts.length === 1) return `${parts[0]}-12-31`
  if (parts.length === 2) return `${parts[0]}-${parts[1]}-01`
  return d
}

// ─── Add Album Modal ──────────────────────────────────────────────────────────

function AddAlbumModal({
  albums,
  onAdd,
  onClose,
}: {
  albums:  AwaitedAlbum[]
  onAdd:   (album: SpotifyResult) => Promise<void>
  onClose: () => void
}) {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<SpotifyResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding,    setAdding]    = useState(false)
  const [msg,       setMsg]       = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) { setResults([]); return }
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/spotify/albums?action=search&q=${encodeURIComponent(q)}&limit=20`)
        const json = await res.json() as { albums?: { id: string; name: string; artist: string; cover: string | null; releaseDate: string | null }[] }
        const future = (json.albums ?? []).filter(a => isFutureRelease(a.releaseDate))
        setResults(future as SpotifyResult[])
      } finally {
        setSearching(false)
      }
    }, 450)
    return () => clearTimeout(timer)
  }, [query])

  async function handleSelect(a: SpotifyResult) {
    const existing = albums.find(al => al.album_id === a.id)
    if (existing) {
      setMsg('Esse álbum já está na lista! Role para baixo e vote nele. 🔥')
      return
    }
    setAdding(true)
    setMsg(null)
    await onAdd({ ...a, releaseDate: a.releaseDate ? normalizeReleaseDate(a.releaseDate) : null })
    setAdding(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-zinc-100">Adicionar álbum aguardado</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xl leading-none">✕</button>
        </div>

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar álbum futuro no Spotify…"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-[#D4537E]"
          autoFocus
        />

        {msg && (
          <p className="text-sm text-amber-400">{msg}</p>
        )}

        {searching && (
          <p className="text-xs text-zinc-500">Buscando…</p>
        )}

        {!searching && query.trim() && results.length === 0 && !msg && (
          <p className="text-xs text-zinc-600">
            Não encontramos álbuns futuros com esse nome. Tente buscar pelo nome exato do álbum ou artista.
            O Spotify nem sempre indexa pré-lançamentos antes da divulgação oficial.
          </p>
        )}

        {results.length > 0 && (
          <ul className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-zinc-700 bg-zinc-800 p-1">
            {results.map(a => (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={adding}
                  onClick={() => handleSelect(a)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-700 disabled:opacity-50"
                >
                  {a.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cover} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-700 text-lg">🎵</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{a.name}</p>
                    <p className="truncate text-xs text-zinc-500">{a.artist}</p>
                  </div>
                  {a.releaseDate && (
                    <span className="shrink-0 text-xs text-[#D4537E]">{a.releaseDate}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-zinc-600">
          Só aparecem álbuns com data de lançamento no futuro. Ao adicionar, seu voto é automático.
        </p>
      </div>
    </div>
  )
}

// ─── Album Card ───────────────────────────────────────────────────────────────

function AlbumCard({
  album,
  onVote,
  canVote,
  voting,
}: {
  album:   AwaitedAlbum
  onVote:  () => void
  canVote: boolean
  voting:  boolean
}) {
  const released = isReleased(album.release_date)
  const days     = album.release_date ? daysUntil(album.release_date) : null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      {album.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={album.cover_url} alt={album.album_name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl">🎵</div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-100">{album.album_name}</p>
        <p className="truncate text-xs text-zinc-500">{album.artist_name}</p>
        {released ? (
          <Link
            href="/communities/musica/avaliar"
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#1D9E75] hover:underline"
          >
            🎉 Lançou! Avalie agora →
          </Link>
        ) : days !== null ? (
          <p className="mt-0.5 text-xs text-[#D4537E]">⏳ {days} {days === 1 ? 'dia' : 'dias'}</p>
        ) : album.release_date ? (
          <p className="mt-0.5 text-xs text-zinc-600">{album.release_date}</p>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onVote}
          disabled={!canVote || voting}
          className={[
            'rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40',
            album.user_voted
              ? 'bg-[#D4537E]/20 text-[#D4537E] border border-[#D4537E]/40 hover:bg-[#D4537E]/30'
              : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
          ].join(' ')}
        >
          {album.user_voted ? '🔥 Votei' : '🔥 Quero!'}
        </button>
        <span className="text-xs text-zinc-500">
          {album.vote_count} {album.vote_count === 1 ? 'voto' : 'votos'}
        </span>
      </div>
    </div>
  )
}

// ─── Featured Card ────────────────────────────────────────────────────────────

function FeaturedCard({ album }: { album: AwaitedAlbum }) {
  const released = isReleased(album.release_date)
  const days     = album.release_date ? daysUntil(album.release_date) : null

  return (
    <div className="rounded-xl border border-[#D4537E]/30 bg-gradient-to-br from-[#D4537E]/10 to-[#7F77DD]/10 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#D4537E]">
        🏆 Mais aguardado pela comunidade
      </p>

      <div className="flex items-center gap-3">
        {album.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={album.cover_url} alt={album.album_name} className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-lg" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-3xl">🎵</div>
        )}
        <div className="min-w-0">
          <p className="text-base font-bold text-zinc-100 truncate">{album.album_name}</p>
          <p className="text-sm text-zinc-400">{album.artist_name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {album.vote_count} {album.vote_count === 1 ? 'incelica aguardando' : 'incelicas aguardando'}
          </p>
        </div>
      </div>

      {released ? (
        <div className="rounded-xl bg-[#1D9E75]/10 border border-[#1D9E75]/30 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1D9E75]">🎉 {album.album_name} lançou!</p>
          <Link
            href="/communities/musica/avaliar"
            className="text-xs font-semibold text-[#1D9E75] border border-[#1D9E75]/40 rounded-lg px-3 py-1.5 hover:bg-[#1D9E75]/20 transition-colors"
          >
            Avaliar →
          </Link>
        </div>
      ) : days !== null ? (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tabular-nums text-zinc-100">{days}</span>
          <span className="text-sm text-zinc-500">{days === 1 ? 'dia para o lançamento' : 'dias para o lançamento'}</span>
        </div>
      ) : null}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AwaitedAlbumsTab({ communityId, initialAlbums, currentUserId, isMember }: Props) {
  const router      = useRouter()
  const [albums,     setAlbums]     = useState<AwaitedAlbum[]>(initialAlbums)
  const [showModal,  setShowModal]  = useState(false)
  const [votingId,   setVotingId]   = useState<string | null>(null)
  const [toast,      setToast]      = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sort descending by vote count, then by date ascending
  const sorted   = [...albums].sort((a, b) => b.vote_count - a.vote_count || (a.release_date ?? '').localeCompare(b.release_date ?? ''))
  const topAlbum = sorted[0] ?? null

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  async function handleVote(album: AwaitedAlbum) {
    if (!currentUserId || votingId) return

    const prevAlbums = albums
    const wasVoted   = album.user_voted
    // Find if user currently voted for a different album
    const prevVoted  = albums.find(a => a.user_voted && a.id !== album.id)

    // Optimistic update
    setAlbums(prev => prev.map(a => {
      if (a.id === album.id) {
        return { ...a, vote_count: wasVoted ? a.vote_count - 1 : a.vote_count + 1, user_voted: !wasVoted }
      }
      if (prevVoted && a.id === prevVoted.id && !wasVoted) {
        return { ...a, vote_count: a.vote_count - 1, user_voted: false }
      }
      return a
    }))

    setVotingId(album.id)
    const result = await toggleAlbumVote(communityId, album.id)
    setVotingId(null)

    if (result.error) {
      setAlbums(prevAlbums)
      showToast(result.error)
    }
  }

  async function handleAdd(spotifyAlbum: SpotifyResult) {
    const result = await addAwaitedAlbum(communityId, {
      albumId:     spotifyAlbum.id,
      albumName:   spotifyAlbum.name,
      artistName:  spotifyAlbum.artist,
      coverUrl:    spotifyAlbum.cover,
      releaseDate: spotifyAlbum.releaseDate,
    })

    if (result.alreadyExists) {
      setShowModal(false)
      showToast('Esse álbum já está na lista! Vote nele. 🔥')
      return
    }
    if (result.error) {
      showToast(result.error)
      return
    }

    setShowModal(false)
    showToast('Álbum adicionado! 🎵')
    router.refresh()
  }

  return (
    <div className="space-y-4">

      {/* Featured album */}
      {topAlbum && <FeaturedCard album={topAlbum} />}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-400">
          {albums.length === 0
            ? 'Nenhum álbum aguardado ainda'
            : `${albums.length} ${albums.length === 1 ? 'álbum' : 'álbuns'} na lista`}
        </h3>
        {currentUserId && isMember && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-[#D4537E]/10 border border-[#D4537E]/30 px-3 py-1.5 text-xs font-semibold text-[#D4537E] transition-colors hover:bg-[#D4537E]/20"
          >
            + Adicionar álbum
          </button>
        )}
      </div>

      {/* Album list */}
      {albums.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
          <p className="text-3xl mb-3">🎵</p>
          <p className="text-sm text-zinc-400 font-semibold">Nenhum álbum aguardado ainda</p>
          <p className="text-xs text-zinc-600 mt-1">
            {isMember
              ? 'Seja a primeira a adicionar um lançamento!'
              : 'Entre na comunidade para sugerir álbuns.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((album, i) => (
            <div key={album.id} className="flex items-start gap-2">
              <span className="mt-4 w-5 shrink-0 text-center text-xs text-zinc-600 font-medium">{i + 1}</span>
              <div className="flex-1">
                <AlbumCard
                  album={album}
                  onVote={() => handleVote(album)}
                  canVote={!!currentUserId && isMember}
                  voting={votingId === album.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!currentUserId && (
        <p className="text-center text-xs text-zinc-600 pt-2">
          Faça login para votar ou sugerir álbuns.
        </p>
      )}
      {currentUserId && !isMember && (
        <p className="text-center text-xs text-zinc-600 pt-2">
          Entre na comunidade para votar e sugerir álbuns.
        </p>
      )}

      {showModal && (
        <AddAlbumModal
          albums={albums}
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
