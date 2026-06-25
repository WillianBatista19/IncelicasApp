'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  albumName:       string
  albumArtist:     string
  albumCover:      string | null
  releaseDateTime: string  // ISO datetime with timezone OR legacy "YYYY-MM-DD"
}

type Countdown = { days: number; hours: number; minutes: number; seconds: number; released: boolean }

function computeCountdown(dt: string): Countdown {
  const target = /^\d{4}-\d{2}-\d{2}$/.test(dt)
    ? new Date(dt + 'T00:00:00-03:00')   // legacy date → Brazil midnight
    : new Date(dt)
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, released: true }
  const s = Math.floor(diff / 1000)
  return {
    days:     Math.floor(s / 86400),
    hours:    Math.floor((s % 86400) / 3600),
    minutes:  Math.floor((s % 3600) / 60),
    seconds:  s % 60,
    released: false,
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function AwaitedAlbumCountdown({ albumName, albumArtist, albumCover, releaseDateTime }: Props) {
  const [cd, setCd] = useState<Countdown>(() => computeCountdown(releaseDateTime))

  useEffect(() => {
    const id = setInterval(() => setCd(computeCountdown(releaseDateTime)), 1000)
    return () => clearInterval(id)
  }, [releaseDateTime])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      {/* Album info row */}
      <div className="flex items-center gap-3">
        {albumCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={albumCover}
            alt={albumName}
            className="h-[60px] w-[60px] shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl">
            🎵
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#D4537E]">
            Aguardando lançamento
          </p>
          <p className="mt-0.5 truncate font-semibold text-zinc-100">{albumName}</p>
          <p className="text-xs text-zinc-500">{albumArtist}</p>
        </div>
      </div>

      {/* Countdown */}
      <div className="mt-3">
        {cd.released ? (
          <Link
            href="/communities/musica/avaliar"
            className="flex items-center justify-center gap-2 rounded-lg border border-[#1D9E75]/30 bg-[#1D9E75]/10 px-4 py-3 transition-colors hover:bg-[#1D9E75]/20"
          >
            <span className="text-sm font-semibold text-[#1D9E75]">🎉 {albumName} lançou!</span>
            <span className="text-xs text-zinc-400">Avalie agora →</span>
          </Link>
        ) : cd.days === 0 ? (
          /* Under 24 h: show HH:MM:SS in large pink text */
          <div className="flex flex-col items-center rounded-lg border border-[#D4537E]/20 bg-[#D4537E]/10 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4537E]/70">
              Últimas horas!
            </p>
            <span className="text-3xl font-bold tabular-nums text-[#D4537E]">
              {pad(cd.hours)}:{pad(cd.minutes)}:{pad(cd.seconds)}
            </span>
          </div>
        ) : (
          /* Normal: ⏳ X dias HH:MM:SS */
          <div className="flex items-baseline justify-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2.5">
            <span className="text-zinc-600">⏳</span>
            <span className="text-2xl font-bold tabular-nums text-zinc-100">{cd.days}</span>
            <span className="text-sm text-zinc-500 mr-1">{cd.days === 1 ? 'dia' : 'dias'}</span>
            <span className="font-mono text-lg font-semibold tabular-nums text-zinc-400">
              {pad(cd.hours)}:{pad(cd.minutes)}:{pad(cd.seconds)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
