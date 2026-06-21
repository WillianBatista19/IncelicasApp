'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

const DURATIONS = [1, 2, 4, 8, 16, 30]
const SCORES    = [600, 500, 400, 300, 200, 100]
const MAX_TRIES = 6

type DailySong = {
  id:            string
  preview_url:   string
  answer_title:  string
  answer_artist: string
  cover_url:     string | null
}

type DeezerTrack = {
  id:     number
  title:  string
  artist: { name: string }
}

// Strip accents and lowercase for comparison
function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function isMatch(guess: string, answerTitle: string): boolean {
  const a = normalize(guess)
  const b = normalize(answerTitle)
  return a === b || b.includes(a) || a.includes(b)
}

export default function MusicGame({ currentUserId }: { currentUserId: string | null }) {
  const supabase     = useMemo(() => createClient(), [])
  const today        = new Date().toISOString().split('T')[0]
  const audioRef     = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)  // wraps input + dropdown

  const [song,         setSong]         = useState<DailySong | null>(null)
  const [snippetIdx,   setSnippetIdx]   = useState(0)
  const [guesses,      setGuesses]      = useState<string[]>([])
  const [input,        setInput]        = useState('')
  const [gameOver,     setGameOver]     = useState(false)
  const [won,          setWon]          = useState(false)
  const [playing,      setPlaying]      = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [message,      setMessage]      = useState('')

  // Autocomplete state
  const [suggestions,   setSuggestions]  = useState<DeezerTrack[]>([])
  const [showDropdown,  setShowDropdown] = useState(false)
  const [searching,     setSearching]    = useState(false)

  // ─── init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data, error } = await supabase.rpc('get_daily_song')
      if (error) {
        console.error('[MusicGame] get_daily_song:', error.message, error.code)
      } else {
        const rows = Array.isArray(data) ? data : (data ? [data] : [])
        const row  = rows[0] as DailySong | undefined
        if (row?.preview_url) setSong(row)
      }

      if (currentUserId) {
        const { data: attempt } = await supabase
          .from('game_attempts')
          .select('attempts, guesses, solved')
          .eq('user_id', currentUserId)
          .eq('game_type', 'music')
          .eq('play_date', today)
          .maybeSingle()
        if (attempt) {
          const att = attempt as { attempts: number; guesses: string[]; solved: boolean }
          setGuesses(att.guesses || [])
          setGameOver(true)
          setWon(att.solved)
          setSnippetIdx(Math.min(att.attempts, MAX_TRIES - 1))
        }
      }
      setLoading(false)
    }
    void init()
  }, [supabase, currentUserId, today])

  // ─── audio cleanup ───────────────────────────────────────────────────────────
  useEffect(() => () => { audioRef.current?.pause() }, [])

  // ─── debounced Deezer search ─────────────────────────────────────────────────
  useEffect(() => {
    const q = input.trim()
    if (q.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      setSearching(false)
      return
    }

    setSearching(true)
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/deezer?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        const json = await res.json() as { data?: DeezerTrack[] }
        const data = json.data ?? []
        setSuggestions(data)
        setShowDropdown(data.length > 0)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
      setSearching(false)
    }
  }, [input])

  // ─── close dropdown on outside click / Escape ────────────────────────────────
  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowDropdown(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown',   onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown',   onKey)
    }
  }, [])

  // ─── audio ───────────────────────────────────────────────────────────────────
  function playSnippet() {
    const audio = audioRef.current
    if (!audio || !song) return
    const limit = DURATIONS[snippetIdx]
    audio.currentTime = 0
    setPlaying(true)

    const handler = () => {
      if (audio.currentTime >= limit) {
        audio.pause()
        setPlaying(false)
        audio.removeEventListener('timeupdate', handler)
      }
    }
    audio.addEventListener('timeupdate', handler)
    audio.play().catch(() => {
      setPlaying(false)
      audio.removeEventListener('timeupdate', handler)
    })
  }

  function stopAudio() {
    audioRef.current?.pause()
    setPlaying(false)
  }

  // ─── game logic ──────────────────────────────────────────────────────────────
  async function saveResult(finalGuesses: string[], solved: boolean, usedIdx: number) {
    if (!currentUserId) return
    const score = solved ? (SCORES[usedIdx] ?? 0) : 0
    await supabase.from('game_attempts').insert({
      user_id: currentUserId, game_type: 'music', play_date: today,
      attempts: finalGuesses.length, guesses: finalGuesses, solved, score,
    })
    if (score > 0) {
      await supabase.rpc('add_game_score', {
        p_user_id: currentUserId, p_game_type: 'music', p_score: score,
      })
    }
  }

  // Accepts the selected title directly so there's no stale-closure on `input` state
  async function submitGuess(title: string) {
    if (!title.trim() || !song || gameOver) return

    setInput('')
    setSuggestions([])
    setShowDropdown(false)
    stopAudio()

    const newGuesses = [...guesses, title.trim()]
    setGuesses(newGuesses)

    if (isMatch(title, song.answer_title)) {
      setGameOver(true)
      setWon(true)
      const score = SCORES[snippetIdx] ?? 0
      setMessage(`🎉 Acertou! +${score} pts`)
      await saveResult(newGuesses, true, snippetIdx)
    } else {
      const next = snippetIdx + 1
      if (next >= MAX_TRIES) {
        setGameOver(true)
        setMessage(`Era: "${song.answer_title}" — ${song.answer_artist}`)
        await saveResult(newGuesses, false, snippetIdx)
      } else {
        setSnippetIdx(next)
        setMessage(`Errou! Ouça mais ${DURATIONS[next]}s e tente de novo`)
        setTimeout(() => setMessage(''), 2500)
      }
    }
  }

  async function handleSkip() {
    if (!song || gameOver) return
    const skipped = [...guesses, '—']
    setGuesses(skipped)
    setInput('')
    setSuggestions([])
    setShowDropdown(false)
    stopAudio()

    const next = snippetIdx + 1
    if (next >= MAX_TRIES) {
      setGameOver(true)
      setMessage(`Era: "${song.answer_title}" — ${song.answer_artist}`)
      await saveResult(skipped, false, snippetIdx)
    } else {
      setSnippetIdx(next)
    }
  }

  // ─── render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="flex h-40 items-center justify-center text-sm text-zinc-500">Carregando...</div>
  }
  if (!song) {
    return (
      <div className="space-y-1 py-8 text-center">
        <p className="text-sm text-zinc-400">Nenhuma música no banco ainda.</p>
        <p className="text-xs text-zinc-600">
          O admin precisa adicionar músicas em{' '}
          <a href="/jogar/admin" className="text-[#D4537E] hover:underline">/jogar/admin</a>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <audio ref={audioRef} src={song.preview_url} preload="auto" />

      {/* Attempt rows */}
      <div className="space-y-1.5">
        {Array.from({ length: MAX_TRIES }, (_, i) => {
          const g         = guesses[i]
          const isCurrent = i === guesses.length && !gameOver
          return (
            <div
              key={i}
              className={`flex h-9 items-center rounded-xl border px-3 text-sm ${
                isCurrent
                  ? 'border-[#D4537E]/40 bg-[#D4537E]/5'
                  : g
                  ? g === '—'
                    ? 'border-zinc-800 bg-zinc-900/40 text-zinc-600 italic'
                    : 'border-zinc-700 bg-zinc-900/60 text-zinc-300'
                  : 'border-zinc-800 bg-transparent'
              }`}
            >
              <span className="mr-2 w-3 text-xs text-zinc-600">{i + 1}.</span>
              <span className="truncate">
                {g === '—' ? 'Pulou' : g}
                {isCurrent && !g && <span className="text-zinc-600">Selecione uma música...</span>}
              </span>
            </div>
          )
        })}
      </div>

      {/* Snippet progress bar */}
      <div className="flex items-center gap-2">
        {DURATIONS.map((d, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < snippetIdx   ? 'bg-zinc-600' :
              i === snippetIdx ? 'bg-[#D4537E]' :
              'bg-zinc-800'
            }`}
          />
        ))}
        <span className="text-xs text-zinc-500 tabular-nums">{DURATIONS[snippetIdx]}s</span>
      </div>

      {/* Message */}
      {message && (
        <div className="rounded-xl bg-zinc-800 px-4 py-2 text-center text-sm font-medium text-zinc-100">
          {message}
        </div>
      )}

      {/* Song reveal on game over */}
      {gameOver && (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/60 p-3">
          {song.cover_url && (
            <img src={song.cover_url} alt={song.answer_title} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-100">{song.answer_title}</p>
            <p className="truncate text-sm text-zinc-400">{song.answer_artist}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {!gameOver && (
        <div className="space-y-2">
          {/* Play button + autocomplete input */}
          <div className="flex gap-2">
            <button
              onPointerDown={e => { e.preventDefault(); playing ? stopAudio() : playSnippet() }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4537E] text-white transition-colors hover:bg-[#c0456e] active:opacity-80"
              aria-label={playing ? 'Pausar' : 'Ouvir trecho'}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Autocomplete container */}
            <div ref={containerRef} className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
                placeholder="Buscar música..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 pr-8 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-[#D4537E]"
              />

              {/* Spinner inside input */}
              {searching && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <SpinnerIcon />
                </span>
              )}

              {/* Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                  {suggestions.map(track => (
                    <li key={track.id}>
                      <button
                        // onPointerDown fires before the input's blur, preventing the
                        // dropdown from closing before the click registers
                        onPointerDown={e => {
                          e.preventDefault()
                          void submitGuess(track.title)
                        }}
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-zinc-800 active:bg-zinc-700"
                      >
                        <span className="text-sm font-medium text-zinc-100 line-clamp-1">
                          {track.title}
                        </span>
                        <span className="text-xs text-zinc-500 line-clamp-1">
                          {track.artist.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Pular button */}
          <button
            onClick={() => void handleSkip()}
            className="w-full rounded-xl border border-zinc-700 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            Pular →
          </button>
        </div>
      )}

      {!currentUserId && !gameOver && (
        <p className="text-center text-xs text-zinc-600">Faça login para salvar sua pontuação</p>
      )}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg
      width="14" height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="animate-spin text-zinc-500"
      aria-hidden
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
