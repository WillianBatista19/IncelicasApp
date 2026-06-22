'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendFollowRequest(targetId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('[sendFollowRequest] Unauthenticated')

  const { error: reqErr } = await supabase
    .from('follow_requests')
    .insert({ requester_id: user.id, target_id: targetId })

  if (reqErr) {
    console.error('[sendFollowRequest] follow_requests insert error:', reqErr.message, reqErr.code)
    throw new Error(reqErr.message)
  }

  const { error: notifErr } = await supabase
    .from('notifications')
    .insert({
      user_id:      targetId,
      from_user_id: user.id,
      type:         'follow_request',
      post_id:      null,
      comment_id:   null,
      read:         false,
    })

  if (notifErr) {
    // Non-fatal — follow request was created; just log
    console.error('[sendFollowRequest] notifications insert error:', notifErr.message, notifErr.code)
  }
}

export async function cancelFollowRequest(targetId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('[cancelFollowRequest] Unauthenticated')

  const { error } = await supabase
    .from('follow_requests')
    .delete()
    .eq('requester_id', user.id)
    .eq('target_id', targetId)

  if (error) {
    console.error('[cancelFollowRequest] delete error:', error.message, error.code)
    throw new Error(error.message)
  }
}

export async function acceptFollowRequest(requesterId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('[acceptFollowRequest] Unauthenticated')

  // Requires policy:
  // CREATE POLICY "accept follow request" ON follows FOR INSERT WITH CHECK (
  //   auth.uid() = following_id OR
  //   EXISTS (
  //     SELECT 1 FROM follow_requests
  //     WHERE requester_id = follower_id
  //     AND target_id = following_id
  //     AND target_id = auth.uid()
  //   )
  // );
  const { error: followErr } = await supabase
    .from('follows')
    .upsert(
      { follower_id: requesterId, following_id: user.id },
      { onConflict: 'follower_id,following_id' },
    )

  if (followErr) {
    console.error('[acceptFollowRequest] follows upsert error:', followErr.message, followErr.code)
    throw new Error(followErr.message)
  }

  const { error: delErr } = await supabase
    .from('follow_requests')
    .delete()
    .eq('requester_id', requesterId)
    .eq('target_id', user.id)

  if (delErr) {
    console.error('[acceptFollowRequest] follow_requests delete error:', delErr.message, delErr.code)
  }

  const { error: notifErr } = await supabase
    .from('notifications')
    .insert({
      user_id:      requesterId,
      from_user_id: user.id,
      type:         'follow_accepted',
      post_id:      null,
      comment_id:   null,
      read:         false,
    })

  if (notifErr) {
    // Non-fatal — follow was already created; just log
    console.error('[acceptFollowRequest] notifications insert error:', notifErr.message, notifErr.code)
  }
}

export async function declineFollowRequest(requesterId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('[declineFollowRequest] Unauthenticated')

  const { error } = await supabase
    .from('follow_requests')
    .delete()
    .eq('requester_id', requesterId)
    .eq('target_id', user.id)

  if (error) {
    console.error('[declineFollowRequest] delete error:', error.message, error.code)
    throw new Error(error.message)
  }
}
