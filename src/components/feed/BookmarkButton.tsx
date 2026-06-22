'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  postId:        string
  currentUserId: string | null
}

export default function BookmarkButton({ postId, currentUserId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentUserId) return
    supabase
      .from('saved_posts')
      .select('post_id', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .eq('post_id', postId)
      .then(({ count }) => setSaved((count ?? 0) > 0))
  }, [supabase, currentUserId, postId])

  if (!currentUserId) return null

  async function toggle() {
    if (!currentUserId || loading) return
    const next = !saved
    setSaved(next)
    setLoading(true)
    if (next) {
      const { error } = await supabase
        .from('saved_posts')
        .insert({ user_id: currentUserId, post_id: postId })
      if (error) setSaved(!next)
    } else {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', currentUserId)
        .eq('post_id', postId)
      if (error) setSaved(!next)
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={loading}
      aria-label={saved ? 'Remover dos salvos' : 'Salvar post'}
      className={`shrink-0 transition-colors disabled:opacity-50 ${
        saved ? 'text-[#D4537E]' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <BookmarkIcon filled={saved} className="h-4 w-4" />
    </button>
  )
}

function BookmarkIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}
