'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendFollowRequest, cancelFollowRequest } from '@/app/(app)/profile/actions'

type Props = {
  targetUserId:     string
  currentUserId:    string
  isPrivate?:       boolean
  pendingRequestId?: string | null
  onFollowChange?:  (isNowFollowing: boolean) => void
}

export default function FollowButton({
  targetUserId,
  currentUserId,
  isPrivate,
  pendingRequestId,
  onFollowChange,
}: Props) {
  const supabase = useMemo(() => createClient(), [])

  // null = still loading; boolean = settled
  const [isFollowing,     setIsFollowing]     = useState<boolean | null>(null)
  const [targetFollowsMe, setTargetFollowsMe] = useState(false)
  const [isPending,       setIsPending]       = useState(false)
  const [requestPending,  setRequestPending]  = useState(!!pendingRequestId)
  const [requestLoading,  setRequestLoading]  = useState(false)

  useEffect(() => {
    Promise.all([
      supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle(),
      supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', targetUserId)
        .eq('following_id', currentUserId)
        .maybeSingle(),
    ]).then(([{ data: iFollow }, { data: theyFollow }]) => {
      setIsFollowing(!!iFollow)
      setTargetFollowsMe(!!theyFollow)
    })
  }, [currentUserId, targetUserId, supabase])

  async function handleSendRequest() {
    if (requestLoading) return
    setRequestLoading(true)
    setRequestPending(true)
    try {
      await sendFollowRequest(targetUserId)
    } catch {
      setRequestPending(false)
    } finally {
      setRequestLoading(false)
    }
  }

  async function handleCancelRequest() {
    if (requestLoading) return
    setRequestLoading(true)
    setRequestPending(false)
    try {
      await cancelFollowRequest(targetUserId)
    } catch {
      setRequestPending(true)
    } finally {
      setRequestLoading(false)
    }
  }

  async function toggle() {
    if (isPending || isFollowing === null) return
    const currentlyFollowing = isFollowing
    setIsFollowing(!currentlyFollowing)
    setIsPending(true)

    if (!currentlyFollowing) {
      await supabase
        .from('follows')
        .upsert(
          { follower_id: currentUserId, following_id: targetUserId },
          { onConflict: 'follower_id,following_id' },
        )
    } else {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
    }

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

  // Loading skeleton
  if (isFollowing === null) {
    return (
      <button disabled className="rounded-xl px-5 py-2 text-sm font-semibold bg-pink text-white opacity-40">
        Seguir
      </button>
    )
  }

  // Private profile — not yet following: show request flow
  if (isPrivate && !isFollowing) {
    if (requestPending) {
      return (
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            disabled
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-500"
          >
            Solicitação enviada
          </button>
          <button
            type="button"
            onClick={handleCancelRequest}
            disabled={requestLoading}
            className="text-xs text-zinc-600 transition-colors hover:text-zinc-400 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={handleSendRequest}
        disabled={requestLoading}
        className="rounded-xl bg-pink px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-pink-hover active:scale-95 disabled:opacity-60"
      >
        {requestLoading ? '…' : 'Solicitar seguir'}
      </button>
    )
  }

  // Normal follow/unfollow (public profile, or private profile where already following)
  const label = isFollowing
    ? 'Seguindo'
    : targetFollowsMe
      ? 'Seguir de volta'
      : 'Seguir'

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
      {label}
    </button>
  )
}
