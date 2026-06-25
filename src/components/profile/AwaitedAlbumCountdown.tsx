'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  albumName:       string
  albumArtist:     string
  albumCover:      string | null
  releaseDateTime: string  // ISO datetime with timezone OR legacy "YYYY-MM-DD"
}

const GRACE_MS = 24 * 60 * 60 * 1000

type Countdown =
  | { kind: 'future';   days: number; hours: number; minutes: number; seconds: number }
  | { kind: 'released' }   // within 24 h grace period
  | { kind: 'hidden'   }   // > 24 h past release — render nothing

function computeCountdown(dt: string): Countdown {
  const target = /^\d{4}-\d{2}-\d{2}$/.test(dt)
    ? new Date(dt + 'T00:00:00-03:00')
    : new Date(dt)
  const diff = target.getTime() - Date.now()
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
  return -diff <= GRACE_MS ? { kind: 'released' } : { kind: 'hidden' }
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function AwaitedAlbumCountdown({ albumName, albumArtist, albumCover, releaseDateTime }: Props) {
  const [cd, setCd] = useState<Countdown>(() => computeCountdown(releaseDateTime))

  useEffect(() => {
    const id = setInterval(() => setCd(computeCountdown(releaseDateTime)), 1000)
    return () => clearInterval(id)
  }, [releaseDateTime])

  if (cd.kind === 'hidden') return null

  const isUnder24h = cd.kind === 'future' && cd.days === 0

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 md:gap-4 md:p-4">

      {/* Cover — 48 px mobile, 64 px desktop, with pink glow */}
      {albumCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={albumCover}
          alt={albumName}
          className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-[0_0_14px_rgba(212,83,126,0.35)] md:h-16 md:w-16"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xl md:h-16 md:w-16 md:text-2xl">
          🎵
        </div>
      )}

      {/* Right column */}
      <div className="min-w-0 flex-1">
        {/* Label */}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          ⏳ Aguardando lançamento
        </p>

        {/* Album + artist */}
        <p className="mt-0.5 truncate text-sm font-bold leading-snug text-zinc-100">
          {albumName}
        </p>
        {albumArtist && (
          <p className="hidden truncate text-xs text-zinc-500 sm:block">
            {albumArtist}
          </p>
        )}

        {/* Countdown / state */}
        <div className="mt-1">
          {cd.kind === 'released' ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#1D9E75]/20 px-2 py-0.5 text-[10px] font-bold text-[#1D9E75]">
                🎉 Lançou!
              </span>
              <Link
                href="/communities/musica/avaliar"
                className="text-xs font-semibold text-[#D4537E] transition-colors hover:underline"
              >
                Avaliar agora →
              </Link>
            </div>
          ) : isUnder24h ? (
            /* Final stretch — always show HH:MM:SS even on mobile */
            <p className="font-mono text-sm font-bold tabular-nums text-[#D4537E]">
              {pad(cd.hours)}:{pad(cd.minutes)}:{pad(cd.seconds)}
            </p>
          ) : (
            /* Normal: mobile = "Xd HH:MM", desktop = "X dias HH:MM:SS" */
            <p className="font-mono text-sm font-semibold tabular-nums text-[#D4537E]">
              <span className="md:hidden">
                {cd.days}d {pad(cd.hours)}:{pad(cd.minutes)}
              </span>
              <span className="hidden md:inline">
                {cd.days} {cd.days === 1 ? 'dia' : 'dias'} {pad(cd.hours)}:{pad(cd.minutes)}:{pad(cd.seconds)}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
