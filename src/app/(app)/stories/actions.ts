'use server'

import { createClient } from '@/lib/supabase/server'

export async function createStoryLikeNotification(
  storyOwnerId: string,
  storyId: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id === storyOwnerId) return

  // Avoid duplicate unread story_like notifications for the same story
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', storyOwnerId)
    .eq('from_user_id', user.id)
    .eq('type', 'story_like')
    .eq('read', false)
    .maybeSingle()

  if (!existing) {
    await supabase.from('notifications').insert({
      user_id:      storyOwnerId,
      from_user_id: user.id,
      type:         'story_like',
    })
  }
}
