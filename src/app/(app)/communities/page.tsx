import { createClient } from '@/lib/supabase/server'
import CommunitiesClient from '@/components/communities/CommunitiesClient'
import type { Community, CommunityMemberRow } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CommunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [commRes, membRes] = await Promise.all([
    supabase
      .from('communities')
      .select('id, name, slug, description, avatar_url, banner_url, created_by, member_count, post_permission, created_at')
      .order('member_count', { ascending: false }),
    user
      ? supabase.from('community_members').select('community_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  const communities  = (commRes.data ?? []) as Community[]
  const myMemberships = ((membRes as { data: Pick<CommunityMemberRow, 'community_id'>[] | null }).data ?? [])

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <CommunitiesClient
        communities={communities}
        myMemberships={myMemberships}
        currentUserId={user?.id ?? null}
      />
    </main>
  )
}
