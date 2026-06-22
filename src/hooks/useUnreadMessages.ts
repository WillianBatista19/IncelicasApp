import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadMessages(userId: string | null): number {
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    if (!userId) { setCount(0); return }
    const supabase = createClient()

    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)

    if (!parts || parts.length === 0) { setCount(0); return }

    const convIds = parts.map(p => p.conversation_id)

    const { data: msgs } = await supabase
      .from('messages')
      .select('conversation_id, created_at, sender_id')
      .in('conversation_id', convIds)
      .neq('sender_id', userId)
      .order('created_at', { ascending: false })

    if (!msgs) { setCount(0); return }

    const latestByConv: Record<string, string> = {}
    for (const msg of msgs) {
      if (!latestByConv[msg.conversation_id]) {
        latestByConv[msg.conversation_id] = msg.created_at
      }
    }

    let unread = 0
    for (const part of parts) {
      const latest = latestByConv[part.conversation_id]
      if (!latest) continue
      if (!part.last_read_at || latest > part.last_read_at) unread++
    }

    setCount(unread)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    void fetchCount()
    const interval = setInterval(() => void fetchCount(), 20000)
    // Re-fetch immediately when MessagesClient marks a conversation as read
    window.addEventListener('messages:read', fetchCount)
    return () => {
      clearInterval(interval)
      window.removeEventListener('messages:read', fetchCount)
    }
  }, [userId, fetchCount])

  return count
}
