'use server'

import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

// Deterministic UUID from sorted user-ID pair — same two users always get same conversation.
// SHA-256 hex sliced into 8-4-4-4-12 UUID format; Postgres accepts any valid hex UUID.
function pairConversationId(uid1: string, uid2: string): string {
  const [a, b] = [uid1, uid2].sort()
  const h = createHash('sha256').update(`${a}:${b}`).digest('hex')
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`
}

export async function getOrCreateConversation(
  otherUserId: string,
): Promise<{ conversationId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  if (user.id === otherUserId) return { error: 'Você não pode conversar consigo mesmo' }

  const conversationId = pairConversationId(user.id, otherUserId)

  // Plain insert — no .select() so PostgREST never runs the SELECT policy.
  // Duplicate-key error (23505) means the conversation already exists; treat as success.
  const { error: convErr } = await supabase
    .from('conversations')
    .insert({ id: conversationId })

  if (convErr && convErr.code !== '23505') return { error: convErr.message }

  // Same pattern for participants — plain insert, ignore duplicate-key errors.
  const { error: partErr } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: conversationId, user_id: user.id },
      { conversation_id: conversationId, user_id: otherUserId },
    ])

  if (partErr && partErr.code !== '23505') return { error: partErr.message }

  return { conversationId }
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
}

// recipientUserId is passed by the caller — MessagesClient already knows it
// from selectedConv.otherUser.id, so no participant lookup is needed here.
export async function createMessageNotification(
  recipientUserId: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Only create one notification per sender while previous ones are unread
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', recipientUserId)
    .eq('from_user_id', user.id)
    .eq('type', 'message')
    .eq('read', false)
    .maybeSingle()

  if (!existing) {
    await supabase.from('notifications').insert({
      user_id:      recipientUserId,
      from_user_id: user.id,
      type:         'message',
    })
  }
}
