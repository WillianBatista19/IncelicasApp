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
  const [content,        setContent]        = useState('')
  const [mediaUrl,       setMediaUrl]       = useState('')
  const [category,       setCategory]       = useState<Category | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [submitting,     setSubmitting]     = useState(false)
  const [imageFile,      setImageFile]      = useState<File | null>(null)
  const [imagePreview,   setImagePreview]   = useState<string | null>(null)
  const [showCameraMenu, setShowCameraMenu] = useState(false)

  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const galleryRef     = useRef<HTMLInputElement>(null)
  const cameraBackRef  = useRef<HTMLInputElement>(null)
  const selfieRef      = useRef<HTMLInputElement>(null)
  const supabase       = useMemo(() => createClient(), [])

  const trimmed   = content.trim()
  const remaining = MAX - content.length
  const overLimit = remaining < 0
  const canPost   = (trimmed.length > 0 || imageFile !== null) && !overLimit && !submitting

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

  function handleImageFile(file: File | null) {
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (galleryRef.current)    galleryRef.current.value    = ''
    if (cameraBackRef.current) cameraBackRef.current.value = ''
    if (selfieRef.current)     selfieRef.current.value     = ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canPost) return

    setError(null)
    setSubmitting(true)

    let imageUrl: string | null = null

    if (imageFile) {
      const ext  = imageFile.name.split('.').pop() || 'jpg'
      const path = `${profile.id}/${Date.now()}.${ext}`
      console.log('[PostComposer] uploading to path:', path)
      const { error: uploadErr } = await supabase.storage
        .from('post-images')
        .upload(path, imageFile, { contentType: imageFile.type })

      if (uploadErr) {
        console.error('[PostComposer] storage upload error:', uploadErr)
        setError('Erro ao enviar a foto. Tenta de novo!')
        setSubmitting(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(path)
      imageUrl = publicUrl
      console.log('[PostComposer] upload ok, publicUrl:', imageUrl)
    }

    const url   = mediaUrl.trim()
    const mType = url ? detectMedia(url) : null

    console.log('[PostComposer] inserting post with image_url:', imageUrl)
    const { error: dbErr } = await supabase.from('posts').insert({
      user_id:     profile.id,
      content:     trimmed,
      category:    category,
      spotify_url: mType === 'spotify' ? url : null,
      youtube_url: mType === 'youtube' ? url : null,
      image_url:   imageUrl,
    })

    if (dbErr) {
      console.error('[PostComposer] insert error:', dbErr)
      setError('Não foi possível publicar. Tenta de novo!')
    } else {
      setContent('')
      setMediaUrl('')
      setCategory(null)
      removeImage()
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    setSubmitting(false)
  }

  /* ─── ring colours ─── */
  const ringColour =
    overLimit          ? '#ef4444'   :
    remaining <= 50    ? '#f97316'   : '#D4537E'
  const circumference = 2 * Math.PI * 9
  const filled        = Math.min(circumference, (content.length / MAX) * circumference)

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-lg">
      {/* Hidden file inputs */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleImageFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={cameraBackRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleImageFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={selfieRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={e => handleImageFile(e.target.files?.[0] ?? null)}
      />

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

            {/* ── Photo / Camera buttons ── */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                title="Enviar foto da galeria"
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-[#D4537E] active:scale-95"
              >
                <PhotoIcon className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCameraMenu(v => !v)}
                  title="Tirar foto"
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-[#D4537E] active:scale-95"
                >
                  <CameraIcon className="h-5 w-5" />
                </button>

                {showCameraMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowCameraMenu(false)}
                    />
                    <div className="absolute left-0 top-full z-20 mt-1.5 w-44 rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
                      <button
                        type="button"
                        onClick={() => { setShowCameraMenu(false); cameraBackRef.current?.click() }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                      >
                        <span>📷</span> Câmera traseira
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCameraMenu(false); selfieRef.current?.click() }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                      >
                        <span>🤳</span> Selfie
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Image preview ── */}
            {imagePreview && (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Prévia da foto"
                  className="max-h-48 rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remover foto"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 shadow-md transition-colors hover:bg-red-950 hover:text-red-400"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

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

// ─── Icons (Tabler style) ─────────────────────────────────────────────────────

function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M15 8h.01" />
      <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z" />
      <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
      <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" />
      <path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  )
}
