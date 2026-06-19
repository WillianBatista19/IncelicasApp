'use client'

import { useState, useTransition } from 'react'
import type { Category } from '@/types'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'anime',  label: 'Anime'  },
  { value: 'bbb',    label: 'BBB'    },
  { value: 'musica', label: 'Música' },
  { value: 'serie',  label: 'Série'  },
  { value: 'filme',  label: 'Filme'  },
  { value: 'livro',  label: 'Livro'  },
]

type Props = {
  action: (fd: FormData) => Promise<void>
}

export default function ComposerForm({ action }: Props) {
  const [content,  setContent]  = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || pending) return

    const fd = new FormData()
    fd.append('content', content.trim())
    if (category) fd.append('category', category)
    if (mediaUrl.trim()) fd.append('media_url', mediaUrl.trim())

    startTransition(async () => {
      await action(fd)
      setContent('')
      setCategory(null)
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
        placeholder="O que tá rolando, incelica?"
        className="w-full resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none disabled:opacity-50"
      />

      <input
        type="text"
        value={mediaUrl}
        onChange={(e) => setMediaUrl(e.target.value)}
        placeholder="🎵 Link do Spotify ou YouTube (opcional)"
        disabled={pending}
        className="mt-2 w-full rounded-xl bg-zinc-800 px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-[#D4537E] disabled:opacity-50"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, label }) => {
          const active = category === value
          return (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() => setCategory(active ? null : value)}
              className={[
                'rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95 disabled:opacity-50',
                active
                  ? 'border-[#D4537E] bg-[#D4537E]/20 text-[#D4537E]'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
              ].join(' ')}
            >
              #{label}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex justify-end border-t border-zinc-800 pt-3">
        <button
          type="submit"
          disabled={!content.trim() || pending}
          className="rounded-xl bg-[#D4537E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#c0446e] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Postando…' : 'Postar'}
        </button>
      </div>
    </form>
  )
}
