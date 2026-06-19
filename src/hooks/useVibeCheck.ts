'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Vibe, VibeType } from '@/types'

export type VibeCounts = Record<VibeType, number>

export function useVibeCheck(
  postId:        string,
  initialVibes:  Vibe[],
  currentUserId: string | null,
) {
  const [vibes,   setVibes]   = useState<Vibe[]>(initialVibes)
  const [pending, setPending] = useState(false)
  const supabase              = useMemo(() => createClient(), [])

  // pendingRef mirrors the pending state but is a ref so it can be read
  // inside the useEffect below without being a dependency. This prevents
  // the effect from firing—and wiping the optimistic state with stale
  // server data—when pending flips from true → false after a DB call.
  const pendingRef = useRef(false)

  function setpending(v: boolean) {
    pendingRef.current = v
    setPending(v)
  }

  // Sync incoming realtime updates from other users.
  // Only skipped if our own operation is in flight (pendingRef guards it
  // without adding `pending` to the dep array, which was the flicker cause).
  useEffect(() => {
    if (!pendingRef.current) setVibes(initialVibes)
  }, [initialVibes])                          // ← intentionally omits pending

  const myVibe = vibes.find((v) => v.user_id === currentUserId) ?? null

  const counts: VibeCounts = useMemo(() => {
    const map: VibeCounts = { serving: 0, morrei: 0, iconic: 0, cha: 0, hype: 0 }
    for (const v of vibes) map[v.type]++
    return map
  }, [vibes])

  async function react(type: VibeType) {
    if (!currentUserId || pendingRef.current) return

    setpending(true)
    const snapshot = vibes

    if (myVibe?.type === type) {
      // ── Remove ────────────────────────────────────────────
      setVibes((prev) => prev.filter((v) => v.user_id !== currentUserId))

      const { error } = await supabase
        .from('vibes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUserId)

      if (error) setVibes(snapshot)
    } else {
      // ── Add / switch ──────────────────────────────────────
      const optimistic: Vibe = {
        id:         `opt-${type}`,
        post_id:    postId,
        user_id:    currentUserId,
        type,
        created_at: new Date().toISOString(),
      }
      setVibes((prev) => [
        ...prev.filter((v) => v.user_id !== currentUserId),
        optimistic,
      ])

      const { error } = await supabase
        .from('vibes')
        .upsert(
          { post_id: postId, user_id: currentUserId, type },
          { onConflict: 'post_id,user_id' },
        )

      if (error) setVibes(snapshot)
    }

    setpending(false)
    // pendingRef is now false; the next initialVibes change (the realtime
    // echo confirming our write) will sync the real server id into state.
  }

  return { counts, myVibe, pending, react, total: vibes.length }
}
