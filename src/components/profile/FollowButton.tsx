'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  targetUserId:    string
  currentUserId:   string
  onFollowChange?: (isNowFollowing: boolean) => void
}

export default function FollowButton({ targetUserId, currentUserId, onFollowChange }: Props) {
  const supabase = useMemo(() => createClient(), [])
  // null = still loading from DB; boolean = settled state
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null)
  const [isPending,   setIsPending]   = useState(false)

  // Fetch the real follow state from Supabase on mount
  useEffect(() => {
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data))
  }, [currentUserId, targetUserId])

  async function toggle() {
    if (isPending || isFollowing === null) return

    const currentlyFollowing = isFollowing   // snapshot – no closure ambiguity

    setIsFollowing(!currentlyFollowing)      // optimistic flip
    setIsPending(true)

    if (!currentlyFollowing) {
      // User is NOT following → upsert so a stale duplicate row never causes a 409
      await supabase
        .from('follows')
        .upsert(
          { follower_id: currentUserId, following_id: targetUserId },
          { onConflict: 'follower_id,following_id' },
        )
    } else {
      // User IS following → DELETE the follow row
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
    }

    // Confirm actual DB state so the button always reflects reality
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle()

    const confirmed = !!data
    setIsFollowing(confirmed)
    onFollowChange?.(confirmed)
    setIsPending(false)
  }

  // While loading, render a visually consistent disabled placeholder
  if (isFollowing === null) {
    return (
      <button disabled className="rounded-xl px-5 py-2 text-sm font-semibold bg-pink text-white opacity-40">
        Seguir
      </button>
    )
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
