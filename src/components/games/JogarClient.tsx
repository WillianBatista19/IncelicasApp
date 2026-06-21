'use client'

import { useState } from 'react'
import Link from 'next/link'
import WordGame    from '@/components/games/WordGame'
import MusicGame   from '@/components/games/MusicGame'
import GameRanking from '@/components/games/GameRanking'

type Tab = 'word' | 'music'

export default function JogarClient({
  currentUserId,
  isAdmin,
}: {
  currentUserId: string | null
  isAdmin:       boolean
}) {
  const [tab, setTab] = useState<Tab>('word')

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-zinc-100">🎮 Jogar</h1>
          <p className="text-xs capitalize text-zinc-500">{today}</p>
        </div>
        {isAdmin && (
          <Link
            href="/jogar/admin"
            className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            ⚙️ Admin
          </Link>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-2xl bg-zinc-900 p-1">
        <button
          onClick={() => setTab('word')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            tab === 'word'
              ? 'bg-[#7F77DD] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          📝 Termo das Incelicas
        </button>
        <button
          onClick={() => setTab('music')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            tab === 'music'
              ? 'bg-[#D4537E] text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          🎵 Adivinhe a Música
        </button>
      </div>

      {/* Game card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100">
            {tab === 'word' ? '📝 Termo das Incelicas' : '🎵 Adivinhe a Música'}
          </span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
            {tab === 'word' ? '6 tentativas' : '6 trechos'}
          </span>
        </div>
        {tab === 'word'
          ? <WordGame  currentUserId={currentUserId} />
          : <MusicGame currentUserId={currentUserId} />
        }
      </div>

      {/* Ranking */}
      <GameRanking currentUserId={currentUserId} />
    </div>
  )
}
