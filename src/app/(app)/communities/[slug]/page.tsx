import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CommunityPageClient from '@/components/communities/CommunityPageClient'
import type { MaisAguardado } from '@/components/communities/CommunityPageClient'
import type { AwaitedAlbum } from '@/components/communities/AwaitedAlbumsTab'
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

  const [postsRes, membersRes, viewerMemberRes, survivorRes, awaitedAlbumsRes, memberAlbumsRes] = await Promise.all([
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
          .from('community_awaited_albums')
          .select('id, album_id, album_name, artist_name, cover_url, release_date, community_album_votes(id, user_id)')
          .eq('community_id', c.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: null }),
    slug === 'musica'
      ? supabase
          .from('community_members')
          .select('profiles!community_members_user_id_fkey(awaited_album_name, awaited_album_artist, awaited_album_cover, awaited_album_release_datetime)')
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

  type RawAwaitedAlbum = {
    id:           string
    album_id:     string
    album_name:   string
    artist_name:  string
    cover_url:    string | null
    release_date: string | null
    community_album_votes: { id: string; user_id: string }[]
  }

  const rawAwaitedAlbums = (awaitedAlbumsRes as { data: RawAwaitedAlbum[] | null }).data ?? []
  const awaitedAlbums: AwaitedAlbum[] = rawAwaitedAlbums.map(a => ({
    id:           a.id,
    album_id:     a.album_id,
    album_name:   a.album_name,
    artist_name:  a.artist_name,
    cover_url:    a.cover_url,
    release_date: a.release_date,
    vote_count:   a.community_album_votes.length,
    user_voted:   user ? a.community_album_votes.some(v => v.user_id === user.id) : false,
  }))

  type RawMemberProfile = {
    profiles: {
      awaited_album_name:         string | null
      awaited_album_artist:       string | null
      awaited_album_cover:        string | null
      awaited_album_release_datetime: string | null
    } | null
  }

  const rawMemberAlbums = (memberAlbumsRes as { data: RawMemberProfile[] | null }).data ?? []
  const now = new Date()
  const maisMap = new Map<string, MaisAguardado>()

  for (const row of rawMemberAlbums) {
    const p = row.profiles
    if (!p?.awaited_album_name || !p.awaited_album_release_datetime) continue
    const releaseDate = new Date(p.awaited_album_release_datetime)
    if (isNaN(releaseDate.getTime()) || releaseDate <= now) continue
    const key = `${p.awaited_album_name.toLowerCase()}|||${(p.awaited_album_artist ?? '').toLowerCase()}`
    const ex = maisMap.get(key)
    if (ex) {
      ex.memberCount++
    } else {
      maisMap.set(key, {
        albumName:   p.awaited_album_name,
        artistName:  p.awaited_album_artist ?? '',
        coverUrl:    p.awaited_album_cover ?? null,
        releaseDate: p.awaited_album_release_datetime,
        memberCount: 1,
      })
    }
  }

  const maisAguardados: MaisAguardado[] = Array.from(maisMap.values())
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 3)

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
        awaitedAlbums={awaitedAlbums}
        maisAguardados={maisAguardados}
      />
    </main>
  )
}
