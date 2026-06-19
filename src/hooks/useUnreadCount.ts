'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount(userId: string | null) {
  const [count,  setCount]  = useState(0)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!userId) { setCount(0); return }

    async function fetchCount() {
      const { count: n } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('read', false)
      setCount(n ?? 0)
    }

    fetchCount()

    const channel = supabase
      .channel(`unread-${userId}`)
      // New notification → bump count immediately
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => setCount((c) => c + 1),
      )
      // Any update (e.g. mark-as-read batch) → re-count from DB
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        fetchCount,
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  return count
}
