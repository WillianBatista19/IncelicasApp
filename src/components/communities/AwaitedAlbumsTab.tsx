'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WaiterProfile = {
  id:           string
  username:     string
  display_name: string | null
  avatar_url:   string | null
}

export type AwaitedAlbumGroup = {
  albumName:   string
  artistName:  string
  coverUrl:    string | null
  releaseDate: string | null   // ISO datetime or YYYY-MM-DD
  memberCount: number
  members:     WaiterProfile[]
}

interface Props {
  groups:        AwaitedAlbumGroup[]
  currentUserId: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRACE_MS = 24 * 60 * 60 * 1000  // 24 h grace period after release

function parseRelease(dt: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(dt)
    ? new Date(dt + 'T00:00:00-03:00')
    : new Date(dt)
}

type CdState =
  | { kind: 'future';   days: number; hours: number; minutes: number; seconds: number }
  | { kind: 'released' }   // within grace period
  | { kind: 'expired'  }   // > 24 h past release

function getCountdown(dt: string): CdState {
  const target = parseRelease(dt)
  const diff   = target.getTime() - Date.now()
  if (diff > 0) {
    const s = Math.floor(diff / 1000)
    return {
      kind:    'future',
      days:    Math.floor(s / 86400),
      hours:   Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
    }
  }
  return -diff <= GRACE_MS ? { kind: 'released' } : { kind: 'expired' }
}

function pad(n: number) { return String(n).padStart(2, '0') }

function wantUrl(g: AwaitedAlbumGroup): string {
  let url = `/profile/edit?section=awaited&awaited_name=${encodeURIComponent(g.albumName)}&awaited_artist=${encodeURIComponent(g.artistName)}`
  if (g.coverUrl)    url += `&awaited_cover=${encodeURIComponent(g.coverUrl)}`
  if (g.releaseDate) url += `&awaited_datetime=${encodeURIComponent(g.releaseDate)}`
  url += '#section-awaited'
  return url
}

// ─── Avatar stack + popover ───────────────────────────────────────────────────

function AvatarStack({ members, albumName }: { members: WaiterProfile[]; albumName: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
      >
        <span className="flex -space-x-1.5">
          {members.slice(0, 3).map(m =>
            m.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={m.id}
                src={m.avatar_url}
                alt=""
                className="h-4 w-4 rounded-full border border-zinc-800 object-cover"
              />
            ) : (
              <div
                key={m.id}
                className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-800 bg-zinc-700 text-[8px] font-semibold text-zinc-400"
              >
                {(m.display_name ?? m.username).charAt(0).toUpperCase()}
              </div>
            )
          )}
        </span>
        {members.length} {members.length === 1 ? 'membro' : 'membros'}
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 z-20 w-48 rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
          <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Aguardando {albumName}
          </p>
          <ul className="max-h-44 space-y-0.5 overflow-y-auto">
            {members.map(m => (
              <li key={m.id}>
                <Link
                  href={`/profile/${m.username}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-800"
                >
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-400">
                      {(m.display_name ?? m.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate text-xs text-zinc-200">
                    {m.display_name ?? m.username}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Album card ───────────────────────────────────────────────────────────────

function AlbumGroupCard({ group, rank }: { group: AwaitedAlbumGroup; rank: number }) {
  const [cd, setCd] = useState<CdState>(() =>
    group.releaseDate ? getCountdown(group.releaseDate) : { kind: 'expired' }
  )

  useEffect(() => {
    if (!group.releaseDate) return
    const id = setInterval(() => setCd(getCountdown(group.releaseDate!)), 1000)
    return () => clearInterval(id)
  }, [group.releaseDate])

  // After 24 h grace: hide silently
  if (cd.kind === 'expired') return null

  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      {/* Rank */}
      <span className="w-4 shrink-0 text-center text-xs font-medium text-zinc-600">{rank}</span>

      {/* Cover */}
      {group.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={group.coverUrl}
          alt={group.albumName}
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl">
          🎵
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-100">{group.albumName}</p>
        <p className="truncate text-xs text-zinc-500 mb-1">{group.artistName}</p>

        {cd.kind === 'released' ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[#1D9E75]/20 px-2 py-0.5 text-[10px] font-semibold text-[#1D9E75]">
              🎉 Lançado!
            </span>
            <Link
              href="/communities/musica/avaliar"
              className="text-[10px] text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Avaliar agora →
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-1 font-mono text-xs tabular-nums text-[#D4537E]">
            <span className="font-sans">⏳</span>
            {cd.days > 0 && (
              <>
                <span className="font-bold text-zinc-100">{cd.days}</span>
                <span className="font-sans text-zinc-500">{cd.days === 1 ? 'd ' : 'd '}</span>
              </>
            )}
            <span>{pad(cd.hours)}:{pad(cd.minutes)}:{pad(cd.seconds)}</span>
          </div>
        )}
      </div>

      {/* Right: member stack + quero button */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <AvatarStack members={group.members} albumName={group.albumName} />
        <Link
          href={wantUrl(group)}
          className="rounded-lg border border-[#7F77DD]/30 bg-[#7F77DD]/10 px-2.5 py-1 text-[10px] font-semibold text-[#7F77DD] transition-colors hover:bg-[#7F77DD]/20"
        >
          ➕ Quero também
        </Link>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AwaitedAlbumsTab({ groups, currentUserId }: Props) {
  // Sort by memberCount desc, then releaseDate asc
  const sorted = [...groups].sort(
    (a, b) =>
      b.memberCount - a.memberCount ||
      (a.releaseDate ?? '').localeCompare(b.releaseDate ?? '')
  )

  // Count visible (future + in grace period) for the header
  const now = Date.now()
  const visibleCount = sorted.filter(g => {
    if (!g.releaseDate) return false
    const t = parseRelease(g.releaseDate)
    return now - t.getTime() <= GRACE_MS
  }).length

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {visibleCount === 0
            ? 'Nenhum álbum aguardado pelos membros'
            : `${visibleCount} ${visibleCount === 1 ? 'álbum' : 'álbuns'} aguardados`}
        </p>
        <Link
          href="/profile/edit?section=awaited#section-awaited"
          className="rounded-xl border border-[#D4537E]/30 bg-[#D4537E]/10 px-3 py-1.5 text-xs font-semibold text-[#D4537E] transition-colors hover:bg-[#D4537E]/20"
        >
          ➕ Adicionar ao meu perfil
        </Link>
      </div>

      {/* Album list */}
      {visibleCount === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
          <p className="mb-3 text-3xl">🎵</p>
          <p className="text-sm font-semibold text-zinc-400">Nenhum álbum aguardado ainda</p>
          <p className="mt-1 text-xs text-zinc-600">
            Adicione um álbum que você está esperando no seu perfil!
          </p>
          <Link
            href="/profile/edit?section=awaited#section-awaited"
            className="mt-4 inline-block rounded-xl border border-[#D4537E]/30 bg-[#D4537E]/10 px-4 py-2 text-xs font-semibold text-[#D4537E] transition-colors hover:bg-[#D4537E]/20"
          >
            ➕ Adicionar ao meu perfil
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((group, i) => (
            <AlbumGroupCard
              key={`${group.albumName}|||${group.artistName}`}
              group={group}
              rank={i + 1}
            />
          ))}
        </div>
      )}

      {!currentUserId && (
        <p className="pt-2 text-center text-xs text-zinc-600">
          Faça login para adicionar o álbum que você está esperando ao seu perfil.
        </p>
      )}
    </div>
  )
}
