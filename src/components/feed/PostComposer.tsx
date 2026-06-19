'use client'

import { useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import type { Category, Profile } from '@/types'

const MAX = 500

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'anime',  label: 'Anime'  },
  { value: 'bbb',    label: 'BBB'    },
  { value: 'musica', label: 'Música' },
  { value: 'serie',  label: 'Série'  },
  { value: 'filme',  label: 'Filme'  },
  { value: 'livro',  label: 'Livro'  },
]

export default function PostComposer({ profile }: { profile: Profile }) {
  const [content,    setContent]    = useState('')
  const [mediaUrl,   setMediaUrl]   = useState('')
  const [category,   setCategory]   = useState<Category | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase    = useMemo(() => createClient(), [])

  const trimmed   = content.trim()
  const remaining = MAX - content.length
  const overLimit = remaining < 0
  const canPost   = trimmed.length > 0 && !overLimit && !submitting

  function resize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 300) + 'px'
  }

  function detectMedia(url: string): 'spotify' | 'youtube' | null {
    if (url.includes('spotify.com'))                              return 'spotify'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    return null
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canPost) return

    setError(null)
    setSubmitting(true)

    const url   = mediaUrl.trim()
    const mType = url ? detectMedia(url) : null

    const { error: dbErr } = await supabase.from('posts').insert({
      user_id:     profile.id,
      content:     trimmed,
      category:    category,
      spotify_url: mType === 'spotify' ? url : null,
      youtube_url: mType === 'youtube' ? url : null,
    })

    if (dbErr) {
      setError('Não foi possível publicar. Tenta de novo!')
    } else {
      setContent('')
      setMediaUrl('')
      setCategory(null)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    setSubmitting(false)
  }

  /* ─── ring colours ─── */
  const ringColour =
    overLimit          ? '#ef4444'   :
    remaining <= 50    ? '#f97316'   : '#D4537E'
  const circumference = 2 * Math.PI * 9                              // r=9
  const filled        = Math.min(circumference, (content.length / MAX) * circumference)

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
      <form onSubmit={submit} noValidate>
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar
            src={profile.avatar_url}
            name={profile.display_name || profile.username || 'U'}
            size="md"
          />

          <div className="min-w-0 flex-1 space-y-3">
            {/* ── Textarea ── */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => { setContent(e.target.value); resize() }}
              placeholder="O que tá rolando, incelica?"
              rows={3}
              className={[
                'w-full resize-none bg-transparent text-sm leading-relaxed',
                'placeholder-zinc-500 outline-none',
                overLimit ? 'text-red-400' : 'text-zinc-100',
              ].join(' ')}
            />

            {/* ── Media URL ── */}
            <div>
              <input
                type="text"
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                placeholder="🎵 Link do Spotify ou YouTube (opcional)"
                className="input-base py-2 text-xs"
              />
            </div>

            {/* ── Category pills ── */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ value, label }) => {
                const active = category === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(active ? null : value)}
                    className={[
                      'rounded-full border px-3 py-1 text-xs font-medium',
                      'transition-all duration-150 active:scale-95',
                      active
                        ? 'border-pink bg-pink/20 text-pink'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
                    ].join(' ')}
                  >
                    #{label}
                  </button>
                )
              })}
            </div>

            {/* ── Footer: ring + error + submit ── */}
            <div className="flex items-center gap-3 border-t border-zinc-800 pt-3">
              {/* Circular char-count ring */}
              <div className="flex flex-shrink-0 items-center gap-1.5">
                <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
                  <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.5" stroke="#3f3f46" />
                  {content.length > 0 && (
                    <circle
                      cx="12" cy="12" r="9"
                      fill="none"
                      strokeWidth="2.5"
                      stroke={ringColour}
                      strokeDasharray={`${filled} ${circumference}`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <span className={`text-xs tabular-nums ${overLimit ? 'text-red-400' : 'text-zinc-500'}`}>
                  {remaining}
                </span>
              </div>

              {error && (
                <p className="flex-1 text-xs text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={!canPost}
                className={[
                  'ml-auto rounded-xl px-5 py-2 text-sm font-semibold text-white',
                  'transition-all duration-150 active:scale-95',
                  canPost
                    ? 'bg-pink hover:bg-pink-hover cursor-pointer'
                    : 'bg-zinc-700 cursor-not-allowed opacity-50',
                ].join(' ')}
              >
                {submitting ? 'Postando…' : 'Postar'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
