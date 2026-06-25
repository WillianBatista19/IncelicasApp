import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import BatalhaClient from '@/components/music/BatalhaClient'
import type { BatalhaEvent, BatalhaAlbum, BatalhaTrackVote, BatalhaCategoryVote } from '@/types'

export const dynamic = 'force-dynamic'

export interface PastBatalhaEvent {
  id:              string
  artist_name:     string
  ends_at:         string
  created_at:      string
  batalha_albums:  BatalhaAlbum[]
}

export default async function BatalhaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: community } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', 'musica')
    .single()

  const communityId = community?.id ?? ''

  let isOwner = false
  if (user && communityId) {
    const { data: member } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .maybeSingle()
    isOwner = member?.role === 'owner'
  }

  // Active event
  const { data: activeEventRaw } = await supabase
    .from('batalha_events')
    .select('*')
    .eq('community_id', communityId)
    .eq('status', 'voting')
    .maybeSingle()

  let activeEvent = activeEventRaw as BatalhaEvent | null

  // Auto-finish expired events (uses admin to bypass RLS for updates)
  if (activeEvent && new Date(activeEvent.ends_at) < new Date()) {
    const admin = createAdminClient()
    const { data: albums } = await admin
      .from('batalha_albums')
      .select('*')
      .eq('event_id', activeEvent.id)

    const { data: trackVotes } = await admin
      .from('batalha_track_votes')
      .select('album_id, track_position, rank')
      .eq('event_id', activeEvent.id)

    const { data: catVotes } = await admin
      .from('batalha_category_votes')
      .select('category, album_id')
      .eq('event_id', activeEvent.id)

    if (albums && albums.length > 0) {
      const RANK_POINTS: Record<number, number> = { 1: 10, 2: 7, 3: 5, 4: 3 }
      const CATS = ['favorite', 'best_cover', 'best_composition', 'best_production'] as const
      const minTracks = Math.min(...albums.map((a: Record<string, unknown>) => a.total_tracks as number))
      const scoreMap: Record<string, number> = {}
      for (const a of albums) scoreMap[(a as Record<string, unknown>).id as string] = 0

      for (const v of (trackVotes ?? []) as Array<Record<string, unknown>>) {
        if ((v.track_position as number) <= minTracks) {
          scoreMap[v.album_id as string] = (scoreMap[v.album_id as string] ?? 0) + (RANK_POINTS[v.rank as number] ?? 0)
        }
      }
      for (const cat of CATS) {
        const cv = (catVotes ?? []).filter((v: Record<string, unknown>) => v.category === cat) as Array<Record<string, unknown>>
        const tally: Record<string, number> = {}
        for (const v of cv) tally[v.album_id as string] = (tally[v.album_id as string] ?? 0) + 1
        const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0]
        if (winner) scoreMap[winner] = (scoreMap[winner] ?? 0) + 15
      }

      await Promise.all([
        ...albums.map((a: Record<string, unknown>) =>
          admin.from('batalha_albums').update({ total_score: scoreMap[a.id as string] ?? 0 }).eq('id', a.id as string),
        ),
        admin.from('batalha_events').update({ status: 'finished' }).eq('id', activeEvent!.id),
      ])
    }
    activeEvent = null
  }

  let albums: BatalhaAlbum[] = []
  let userTrackVotes: BatalhaTrackVote[] = []
  let userCategoryVotes: BatalhaCategoryVote[] = []
  let allTrackVotes: BatalhaTrackVote[] = []
  let allCategoryVotes: BatalhaCategoryVote[] = []

  if (activeEvent) {
    const [albumsRes, userTVRes, userCVRes, allTVRes, allCVRes] = await Promise.all([
      supabase.from('batalha_albums').select('*').eq('event_id', activeEvent.id).order('created_at'),
      user
        ? supabase.from('batalha_track_votes').select('*').eq('event_id', activeEvent.id).eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
      user
        ? supabase.from('batalha_category_votes').select('*').eq('event_id', activeEvent.id).eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
      supabase.from('batalha_track_votes').select('*').eq('event_id', activeEvent.id),
      supabase.from('batalha_category_votes').select('*').eq('event_id', activeEvent.id),
    ])
    albums            = (albumsRes.data       ?? []) as BatalhaAlbum[]
    userTrackVotes    = (userTVRes.data        ?? []) as BatalhaTrackVote[]
    userCategoryVotes = (userCVRes.data        ?? []) as BatalhaCategoryVote[]
    allTrackVotes     = (allTVRes.data         ?? []) as BatalhaTrackVote[]
    allCategoryVotes  = (allCVRes.data         ?? []) as BatalhaCategoryVote[]
  }

  // Past events
  const { data: pastRaw } = await supabase
    .from('batalha_events')
    .select('id, artist_name, ends_at, created_at, batalha_albums(*)')
    .eq('community_id', communityId)
    .eq('status', 'finished')
    .order('created_at', { ascending: false })
    .limit(10)

  const pastEvents = (pastRaw ?? []) as PastBatalhaEvent[]

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/communities/musica"
          className="text-zinc-400 hover:text-white transition-colors text-sm"
        >
          ← Música
        </Link>
      </div>

      <BatalhaClient
        activeEvent={activeEvent}
        albums={albums}
        userTrackVotes={userTrackVotes}
        userCategoryVotes={userCategoryVotes}
        allTrackVotes={allTrackVotes}
        allCategoryVotes={allCategoryVotes}
        pastEvents={pastEvents}
        isOwner={isOwner}
        currentUserId={user?.id ?? null}
        communityId={communityId}
      />
    </main>
  )
}
