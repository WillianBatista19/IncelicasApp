'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type TrackResult = {
  title:        string
  artist:       string
  preview_url:  string | null   // from Deezer; null if not found
  cover_url:    string | null
  deezer_found: boolean
}

export default function AdminClient() {
  const supabase = useMemo(() => createClient(), [])

  // Song form
  const [spotifyUrl,  setSpotifyUrl]  = useState('')
  const [trackResult, setTrackResult] = useState<TrackResult | null>(null)
  const [songLoading, setSongLoading] = useState(false)
  const [songMsg,     setSongMsg]     = useState('')

  // Word form
  const [wordInput,  setWordInput]  = useState('')
  const [wordMsg,    setWordMsg]    = useState('')
  const [wordSaving, setWordSaving] = useState(false)

  async function fetchTrack() {
    if (!spotifyUrl.trim()) return
    setSongLoading(true)
    setTrackResult(null)
    setSongMsg('')
    try {
      const res  = await fetch(`/api/spotify?url=${encodeURIComponent(spotifyUrl.trim())}`)
      const json = await res.json() as TrackResult & { error?: string }
      if (json.error) {
        setSongMsg(`Erro: ${json.error}`)
        return
      }
      setTrackResult(json)
      if (!json.deezer_found) {
        setSongMsg('⚠️ Preview não encontrado no Deezer. Não é possível salvar sem preview.')
      }
    } finally {
      setSongLoading(false)
    }
  }

  async function saveSong() {
    if (!trackResult?.preview_url) return
    setSongMsg('')
    const { error } = await supabase.from('daily_songs').insert({
      preview_url:   trackResult.preview_url,
      answer_title:  trackResult.title,
      answer_artist: trackResult.artist,
      cover_url:     trackResult.cover_url,
    })
    if (error) setSongMsg(`Erro: ${error.message}`)
    else {
      setSongMsg('✓ Música adicionada ao banco!')
      setTrackResult(null)
      setSpotifyUrl('')
    }
  }

  async function saveWord() {
    const w = wordInput.trim().toUpperCase()
    if (w.length !== 5) { setWordMsg('A palavra precisa ter 5 letras.'); return }
    setWordSaving(true)
    setWordMsg('')
    const { error } = await supabase.from('daily_words').insert({ word: w })
    if (error) setWordMsg(error.code === '23505' ? 'Palavra já existe.' : `Erro: ${error.message}`)
    else { setWordMsg(`✓ "${w}" adicionada!`); setWordInput('') }
    setWordSaving(false)
  }

  const msgColor = songMsg.startsWith('✓')
    ? 'text-[#1D9E75]'
    : songMsg.startsWith('⚠️')
    ? 'text-amber-400'
    : 'text-red-400'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jogar" className="text-xs text-zinc-500 hover:text-zinc-300">← Voltar</Link>
        <h1 className="text-xl font-black text-zinc-100">⚙️ Admin — Banco de Jogos</h1>
      </div>

      {/* SONG SECTION */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-1 text-sm font-semibold text-zinc-100">🎵 Adicionar Música</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Cole a URL do Spotify — o título e artista vêm do Spotify, o preview vem do Deezer.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={spotifyUrl}
            onChange={e => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-[#D4537E]"
          />
          <button
            onClick={() => void fetchTrack()}
            disabled={songLoading || !spotifyUrl.trim()}
            className="rounded-xl bg-[#D4537E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c0456e] disabled:opacity-40"
          >
            {songLoading ? '...' : 'Buscar'}
          </button>
        </div>

        {trackResult && (
          <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-800 p-3">
            <div className="flex items-center gap-3">
              {trackResult.cover_url && (
                <img
                  src={trackResult.cover_url}
                  alt={trackResult.title}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-100">{trackResult.title}</p>
                <p className="truncate text-sm text-zinc-400">{trackResult.artist}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {trackResult.deezer_found ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1D9E75]" />
                      <p className="truncate text-xs text-zinc-600">{trackResult.preview_url}</p>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <p className="text-xs text-amber-500">Preview não encontrado no Deezer</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => void saveSong()}
              disabled={!trackResult.deezer_found}
              className="mt-3 w-full rounded-xl bg-[#1D9E75] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#178a63] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {trackResult.deezer_found ? 'Salvar no banco' : 'Sem preview — não é possível salvar'}
            </button>
          </div>
        )}

        {songMsg && (
          <p className={`mt-2 text-xs ${msgColor}`}>{songMsg}</p>
        )}
      </div>

      {/* WORD SECTION */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">📝 Adicionar Palavra</h2>
        <p className="mb-3 text-xs text-zinc-500">Somente palavras de exatamente 5 letras (sem acentos).</p>

        <div className="flex gap-2">
          <input
            type="text"
            value={wordInput}
            onChange={e => setWordInput(e.target.value.toUpperCase().slice(0, 5))}
            onKeyDown={e => { if (e.key === 'Enter') void saveWord() }}
            placeholder="PALAVRA"
            maxLength={5}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm tracking-widest text-zinc-100 placeholder-zinc-600 outline-none focus:border-[#7F77DD]"
          />
          <button
            onClick={() => void saveWord()}
            disabled={wordSaving || wordInput.trim().length !== 5}
            className="rounded-xl bg-[#7F77DD] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6d65cb] disabled:opacity-40"
          >
            {wordSaving ? '...' : 'Adicionar'}
          </button>
        </div>

        {wordMsg && (
          <p className={`mt-2 text-xs ${wordMsg.startsWith('✓') ? 'text-[#1D9E75]' : 'text-red-400'}`}>
            {wordMsg}
          </p>
        )}
      </div>
    </div>
  )
}
