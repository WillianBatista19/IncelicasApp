'use client'

import { useMemo, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  targetUserId:       string
  initialIsFollowing: boolean
  currentUserId:      string
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  currentUserId,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending,   startTransition] = useTransition()
  const supabase = useMemo(() => createClient(), [])

  function toggle() {
    if (isPending) return
    const next = !isFollowing
    setIsFollowing(next)               // optimistic

    startTransition(async () => {
      if (next) {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId })
        // trg_notify_follow DB trigger fires the notification automatically
        if (error) setIsFollowing(false)
      } else {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)
        if (error) setIsFollowing(true)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={[
        'rounded-xl px-5 py-2 text-sm font-semibold transition-all active:scale-95 disabled:opacity-60',
        isFollowing
          ? 'border border-zinc-600 bg-transparent text-zinc-300 hover:border-red-500 hover:text-red-400'
          : 'bg-pink text-white hover:bg-pink-hover',
      ].join(' ')}
    >
      {isFollowing ? 'Seguindo' : 'Seguir'}
    </button>
  )
}
