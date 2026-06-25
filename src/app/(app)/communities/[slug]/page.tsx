import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CommunityPageClient from '@/components/communities/CommunityPageClient'
import type { AwaitedAlbumGroup, WaiterProfile } from '@/components/communities/AwaitedAlbumsTab'
import type { Community, CommunityMemberRow, CommunityPost, CommunityRole } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CommunityPage({ params }: Props) {
  const { slug }  = await params
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, description, avatar_url, banner_url, created_by, member_count, post_permission, created_at')
    .eq('slug', slug)
    .single()

  if (!community) notFound()

  const c = community as Community

  const [postsRes, membersRes, viewerMemberRes, survivorRes, memberAlbumsRes] = await Promise.all([
    supabase
      .from('community_posts')
      .select(`
        id, community_id, user_id, content, image_url, media_url, created_at,
        profiles!community_posts_user_id_fkey (id, username, display_name, avatar_url),
        community_post_vibes!community_post_vibes_post_id_fkey (id, user_id, type),
        community_comments (id)
      `)
      .eq('community_id', c.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('community_members')
      .select('community_id, user_id, role, can_post, notifications_muted, joined_at, profiles!community_members_user_id_fkey (id, username, display_name, avatar_url)')
      .eq('community_id', c.id)
      .order('joined_at'),
    user
      ? supabase
          .from('community_members')
          .select('role, can_post, notifications_muted')
          .eq('community_id', c.id)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    slug === 'musica'
      ? supabase
          .from('survivor_events')
          .select('album_name, artist_name, current_round')
          .eq('community_id', c.id)
          .eq('status', 'active')
          .maybeSingle()
      : Promise.resolve({ data: null }),
    slug === 'musica'
      ? supabase
          .from('community_members')
          .select(`
            profiles!community_members_user_id_fkey(
              id, username, display_name, avatar_url,
              awaited_album_name, awaited_album_artist, awaited_album_cover, awaited_album_release_datetime
            )
          `)
          .eq('community_id', c.id)
      : Promise.resolve({ data: null }),
  ])

  const { data: postsData,   error: postsError   } = postsRes
  const { data: membersData, error: membersError } = membersRes

  console.log('[Community] posts:', postsData?.length ?? 0, postsError)
  console.log('[Community] members:', membersData?.length ?? 0, membersError)

  const posts   = (postsData   ?? []) as unknown as CommunityPost[]
  const members = (membersData ?? []) as unknown as CommunityMemberRow[]

  const viewerMemberData = (viewerMemberRes as {
    data: { role: CommunityRole; can_post: boolean; notifications_muted: boolean } | null
  }).data

  const activeSurvivorEvent = (survivorRes as {
    data: { album_name: string; artist_name: string; current_round: number } | null
  }).data
  const viewerRole         = viewerMemberData?.role ?? null
  const canPost            = viewerMemberData?.can_post ?? false
  const notificationsMuted = viewerMemberData?.notifications_muted ?? false

  type RawMemberProfile = {
    profiles: {
      id:                             string
      username:                       string
      display_name:                   string | null
      avatar_url:                     string | null
      awaited_album_name:             string | null
      awaited_album_artist:           string | null
      awaited_album_cover:            string | null
      awaited_album_release_datetime: string | null
    } | null
  }

  const GRACE_MS   = 24 * 60 * 60 * 1000
  const serverNow  = Date.now()
  const rawMembers = (memberAlbumsRes as { data: RawMemberProfile[] | null }).data ?? []
  const groupMap   = new Map<string, { meta: Omit<AwaitedAlbumGroup, 'memberCount' | 'members'>; members: WaiterProfile[] }>()

  for (const row of rawMembers) {
    const p = row.profiles
    if (!p?.awaited_album_name || !p.awaited_album_release_datetime) continue
    const dt     = p.awaited_album_release_datetime
    const target = /^\d{4}-\d{2}-\d{2}$/.test(dt)
      ? new Date(dt + 'T00:00:00-03:00')
      : new Date(dt)
    if (isNaN(target.getTime()) || serverNow - target.getTime() > GRACE_MS) continue

    const key      = `${p.awaited_album_name.toLowerCase()}|||${(p.awaited_album_artist ?? '').toLowerCase()}`
    const existing = groupMap.get(key)
    const member: WaiterProfile = {
      id:           p.id,
      username:     p.username,
      display_name: p.display_name,
      avatar_url:   p.avatar_url,
    }
    if (existing) {
      existing.members.push(member)
    } else {
      groupMap.set(key, {
        meta: {
          albumName:   p.awaited_album_name,
          artistName:  p.awaited_album_artist ?? '',
          coverUrl:    p.awaited_album_cover  ?? null,
          releaseDate: p.awaited_album_release_datetime,
        },
        members: [member],
      })
    }
  }

  const awaitedAlbumGroups: AwaitedAlbumGroup[] = Array.from(groupMap.values())
    .map(({ meta, members }) => ({ ...meta, memberCount: members.length, members }))
    .sort((a, b) => b.memberCount - a.memberCount || (a.releaseDate ?? '').localeCompare(b.releaseDate ?? ''))

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <CommunityPageClient
        community={c}
        posts={posts}
        members={members}
        currentUserId={user?.id ?? null}
        viewerRole={viewerRole}
        canPost={canPost}
        notificationsMuted={notificationsMuted}
        activeSurvivorEvent={activeSurvivorEvent}
        awaitedAlbumGroups={awaitedAlbumGroups}
      />
    </main>
  )
}
