'use client'

import { useRef, useState } from 'react'
import { createCommunityPost } from '@/app/(app)/communities/actions'

interface Props {
  communityId: string
  onPost?:     () => void
}

export default function CommunityPostComposer({ communityId, onPost }: Props) {
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      await createCommunityPost(communityId, text.trim())
      setText('')
      onPost?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao postar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl bg-white/5 p-4 space-y-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Posta algo na comunidade…"
        rows={3}
        className="w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D4537E]"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="rounded-xl bg-[#D4537E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition"
        >
          {loading ? 'Postando…' : 'Postar'}
        </button>
      </div>
    </form>
  )
}
