import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MessagesClient from '@/components/messages/MessagesClient'
import type { ConversationSummary, ConversationMessage } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mensagens — Incelicas' }

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const conversations = await fetchConversationList(user.id)

  return (
    <MessagesClient
      currentUserId={user.id}
      initialConversations={conversations}
      activeConversationId={null}
      initialMessages={[]}
    />
  )
}

export async function fetchConversationList(userId: string): Promise<ConversationSummary[]> {
  const userSupabase = await createClient()
  const admin = createAdminClient()

  const { data: myParts } = await userSupabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)

  const convIds = (myParts ?? []).map(p => p.conversation_id)
  if (convIds.length === 0) return []

  // Admin client bypasses RLS to read other participants' rows
  const { data: otherParts } = await admin
    .from('conversation_participants')
    .select('conversation_id, user_id, profiles(id, username, display_name, avatar_url)')
    .in('conversation_id', convIds)
    .neq('user_id', userId)

  const { data: msgs } = await admin
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })

  const lastMsgByConv: Record<string, ConversationMessage> = {}
  for (const msg of msgs ?? []) {
    if (!lastMsgByConv[msg.conversation_id]) {
      lastMsgByConv[msg.conversation_id] = msg as ConversationMessage
    }
  }

  type RawPart = {
    conversation_id: string
    user_id: string
    profiles: {
      id: string; username: string; display_name: string | null; avatar_url: string | null
    } | {
      id: string; username: string; display_name: string | null; avatar_url: string | null
    }[] | null
  }

  return convIds
    .flatMap(convId => {
      const part      = myParts?.find(p => p.conversation_id === convId)
      const otherPart = (otherParts as unknown as RawPart[] | undefined)?.find(p => p.conversation_id === convId)
      const raw       = otherPart?.profiles
      const prof      = Array.isArray(raw) ? raw[0] : raw
      if (!prof) return []
      const conv: ConversationSummary = {
        id:          convId,
        lastReadAt:  part?.last_read_at ?? null,
        otherUser: {
          id:           prof.id,
          username:     prof.username,
          display_name: prof.display_name,
          avatar_url:   prof.avatar_url,
        },
        lastMessage: lastMsgByConv[convId] ?? null,
      }
      return [conv]
    })
    .sort((a, b) => {
      const at = a.lastMessage?.created_at ?? ''
      const bt = b.lastMessage?.created_at ?? ''
      return bt.localeCompare(at)
    })
}
