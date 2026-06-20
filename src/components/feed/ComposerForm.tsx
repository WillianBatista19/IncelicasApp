'use client'

import { useState, useTransition } from 'react'

type Props = {
  action: (fd: FormData) => Promise<void>
}

export default function ComposerForm({ action }: Props) {
  const [content,  setContent]  = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [pending, startTransition] = useTransition()

  // Detect hashtags while typing for live preview
  const detectedTags = Array.from(
    new Set((content.match(/#[A-Za-z0-9_]+/g) ?? []).map(t => t.toLowerCase()))
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || pending) return

    const fd = new FormData()
    fd.append('content', content.trim())
    if (mediaUrl.trim()) fd.append('media_url', mediaUrl.trim())

    startTransition(async () => {
      await action(fd)
      setContent('')
      setMediaUrl('')
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        rows={3}
        disabled={pending}
        placeholder="O que tá rolando, incelica? Use #hashtags para categorizar."
        className="w-full resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none disabled:opacity-50"
      />

      {/* Live hashtag preview */}
      {detectedTags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {detectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-[#D4537E]/40 bg-[#D4537E]/10 px-2 py-0.5 text-[11px] font-semibold text-[#D4537E]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={mediaUrl}
        onChange={(e) => setMediaUrl(e.target.value)}
        placeholder="🎵 Link do Spotify ou YouTube (opcional)"
        disabled={pending}
        className="mt-3 w-full rounded-xl bg-zinc-800 px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-[#D4537E] disabled:opacity-50"
      />

      <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
        <span className="text-xs text-zinc-700">
          {content.length}/500
        </span>
        <button
          type="submit"
          disabled={!content.trim() || pending}
          className="rounded-xl bg-[#D4537E] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#c0446e] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Postando…' : 'Postar'}
        </button>
      </div>
    </form>
  )
}
