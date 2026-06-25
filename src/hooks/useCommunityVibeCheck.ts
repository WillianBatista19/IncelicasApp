'use client'

import { useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CommunityVibe, VibeType } from '@/types'

export type VibeCounts = Record<VibeType, number>

export function useCommunityVibeCheck(
  postId:        string,
  initialVibes:  CommunityVibe[],
  currentUserId: string | null,
) {
  const [vibes,   setVibes]   = useState<CommunityVibe[]>(initialVibes)
  const [pending, setPending] = useState(false)
  const pendingRef            = useRef(false)
  const supabase              = useMemo(() => createClient(), [])

  function setpending(v: boolean) {
    pendingRef.current = v
    setPending(v)
  }

  const myVibe = vibes.find(v => v.user_id === currentUserId) ?? null

  const counts: VibeCounts = useMemo(() => {
    const map: VibeCounts = {
      serving: 0, morrei: 0, iconic: 0, tomate: 0, coco: 0, gag: 0, old: 0, sixseven: 0,
      cha: 0, hype: 0,  // legacy
    }
    for (const v of vibes) {
      if (v.type in map) map[v.type]++
    }
    return map
  }, [vibes])

  async function react(type: VibeType) {
    if (!currentUserId || pendingRef.current) return
    setpending(true)
    const snapshot = vibes

    if (myVibe?.type === type) {
      setVibes(prev => prev.filter(v => v.user_id !== currentUserId))
      const { error } = await supabase
        .from('community_post_vibes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
      if (error) setVibes(snapshot)
    } else {
      const optimistic: CommunityVibe = {
        id:         `opt-${type}`,
        post_id:    postId,
        user_id:    currentUserId,
        type,
        created_at: new Date().toISOString(),
      }
      setVibes(prev => [...prev.filter(v => v.user_id !== currentUserId), optimistic])
      const { error } = await supabase
        .from('community_post_vibes')
        .upsert({ post_id: postId, user_id: currentUserId, type }, { onConflict: 'post_id,user_id' })
      if (error) setVibes(snapshot)
    }

    setpending(false)
  }

  return { counts, myVibe, pending, react, total: vibes.length }
}
