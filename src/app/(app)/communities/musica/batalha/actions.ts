'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { BatalhaCategory } from '@/types'

const PATH = '/communities/musica/batalha'

const RANK_POINTS: Record<number, number> = { 1: 10, 2: 7, 3: 5, 4: 3 }
const CATEGORY_BONUS = 15
const ALL_CATEGORIES: BatalhaCategory[] = [
  'favorite', 'best_cover', 'best_composition', 'best_production',
]

// ─── Create event ────────────────────────────────────────────────────────────

interface AlbumInput {
  album_id:     string
  album_name:   string
  cover_url:    string
  release_year: string | null
  total_tracks: number
}

export async function createBatalhaEvent(input: {
  communityId:  string
  artistName:   string
  artistId:     string
  albums:       AlbumInput[]
  durationDays: 3 | 7 | 14
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login necessário' }

  if (input.albums.length < 2) return { error: 'Mínimo de 2 álbuns' }
  if (input.albums.length > 8) return { error: 'Máximo de 8 álbuns' }

  const { data: member } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', input.communityId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (member?.role !== 'owner') return { error: 'Sem permissão' }

  const { data: existing } = await supabase
    .from('batalha_events')
    .select('id')
    .eq('community_id', input.communityId)
    .eq('status', 'voting')
    .maybeSingle()
  if (existing) return { error: 'Já existe uma Batalha ativa' }

  const endsAt = new Date()
  endsAt.setDate(endsAt.getDate() + input.durationDays)

  const { data: event, error: eventErr } = await supabase
    .from('batalha_events')
    .insert({
      community_id: input.communityId,
      created_by:   user.id,
      artist_name:  input.artistName,
      artist_id:    input.artistId,
      status:       'voting',
      ends_at:      endsAt.toISOString(),
    })
    .select('id')
    .single()

  if (eventErr || !event) return { error: eventErr?.message ?? 'Erro ao criar batalha' }

  const { error: albumsErr } = await supabase
    .from('batalha_albums')
    .insert(input.albums.map(a => ({
      event_id:     event.id,
      album_id:     a.album_id,
      album_name:   a.album_name,
      cover_url:    a.cover_url,
      release_year: a.release_year,
      total_tracks: a.total_tracks,
    })))

  if (albumsErr) return { error: albumsErr.message }

  // Notify community members
  try {
    const { data: members } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', input.communityId)

    const targets = (members ?? []).filter(m => m.user_id !== user.id)
    if (targets.length > 0) {
      await supabase.from('notifications').insert(
        targets.map(m => ({
          user_id:        m.user_id,
          from_user_id:   user.id,
          type:           'community_post',
          read:           false,
          community_name: `🎵 Nova Batalha de Álbuns: ${input.artistName} — Vote agora!`,
        })),
      )
    }
  } catch { /* non-fatal */ }

  revalidatePath(PATH)
  return {}
}

// ─── Track votes ─────────────────────────────────────────────────────────────

interface TrackVoteInput {
  albumId:       string
  trackPosition: number
  trackName:     string
  rank:          number
}

export async function submitTrackVotes(
  eventId: string,
  votes:   TrackVoteInput[],
): Promise<{ error?: string }> {
  if (votes.length === 0) return {}

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login necessário' }

  // Delete existing votes for these positions so re-rankings replace cleanly
  const positions = Array.from(new Set(votes.map(v => v.trackPosition)))
  await supabase
    .from('batalha_track_votes')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .in('track_position', positions)

  const { error } = await supabase
    .from('batalha_track_votes')
    .insert(votes.map(v => ({
      event_id:       eventId,
      album_id:       v.albumId,
      track_position: v.trackPosition,
      track_name:     v.trackName,
      user_id:        user.id,
      rank:           v.rank,
    })))

  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

// ─── Category votes ───────────────────────────────────────────────────────────

export async function submitCategoryVote(
  eventId:  string,
  category: BatalhaCategory,
  albumId:  string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login necessário' }

  const { error } = await supabase
    .from('batalha_category_votes')
    .upsert(
      { event_id: eventId, category, album_id: albumId, user_id: user.id },
      { onConflict: 'event_id,category,user_id' },
    )

  if (error) return { error: error.message }
  revalidatePath(PATH)
  return {}
}

// ─── Finish event (owner or auto) ────────────────────────────────────────────

export async function finishBatalhaEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('batalha_events')
    .select('community_id, status, artist_name, created_by')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) return { error: 'Evento não encontrado' }
  if (event.status === 'finished') return {}

  const [{ data: albums }, { data: trackVotes }, { data: catVotes }] = await Promise.all([
    supabase.from('batalha_albums').select('*').eq('event_id', eventId),
    supabase.from('batalha_track_votes').select('album_id, track_position, rank').eq('event_id', eventId),
    supabase.from('batalha_category_votes').select('category, album_id').eq('event_id', eventId),
  ])

  if (!albums || albums.length === 0) return { error: 'Sem álbuns' }

  // Positions ≤ shortest album count for the final ranking
  const minTracks = Math.min(...albums.map((a: Record<string, unknown>) => a.total_tracks as number))

  const scoreMap: Record<string, number> = {}
  for (const a of albums) scoreMap[(a as Record<string, unknown>).id as string] = 0

  // Track points
  for (const vote of (trackVotes ?? []) as Array<Record<string, unknown>>) {
    if ((vote.track_position as number) <= minTracks) {
      const pts = RANK_POINTS[vote.rank as number] ?? 0
      scoreMap[vote.album_id as string] = (scoreMap[vote.album_id as string] ?? 0) + pts
    }
  }

  // Category bonus — 15 pts to album with most votes per category
  for (const cat of ALL_CATEGORIES) {
    const catVotesForCat = (catVotes ?? []).filter((v: Record<string, unknown>) => v.category === cat)
    if (catVotesForCat.length === 0) continue
    const tally: Record<string, number> = {}
    for (const v of catVotesForCat as Array<Record<string, unknown>>) {
      tally[v.album_id as string] = (tally[v.album_id as string] ?? 0) + 1
    }
    const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (winner) scoreMap[winner] = (scoreMap[winner] ?? 0) + CATEGORY_BONUS
  }

  console.log('[Batalha] Finalizando evento', eventId, '| Scores:', JSON.stringify(scoreMap))

  const updateResults = await Promise.all([
    ...albums.map((a: Record<string, unknown>) =>
      supabase
        .from('batalha_albums')
        .update({ total_score: scoreMap[a.id as string] ?? 0 })
        .eq('id', a.id as string),
    ),
    supabase.from('batalha_events').update({ status: 'finished' }).eq('id', eventId),
  ])

  const updateErrors = updateResults.filter(r => r.error)
  if (updateErrors.length > 0) {
    console.error('[Batalha] Erros ao salvar scores (verifique RLS UPDATE policies):', updateErrors.map(r => r.error?.message))
  }

  // Notify: winner album
  try {
    const winner = albums.reduce((best: Record<string, unknown>, a: Record<string, unknown>) =>
      (scoreMap[a.id as string] ?? 0) > (scoreMap[best.id as string] ?? 0) ? a : best,
    )

    const { data: members } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', event.community_id)

    if (members && members.length > 0) {
      await supabase.from('notifications').insert(
        (members as Array<{ user_id: string }>).map(m => ({
          user_id:        m.user_id,
          from_user_id:   event.created_by,
          type:           'community_post',
          read:           false,
          community_name: `🏆 ${(winner as Record<string, unknown>).album_name} venceu a Batalha de Álbuns de ${event.artist_name}!`,
        })),
      )
    }
  } catch { /* non-fatal */ }

  revalidatePath(PATH)
  return {}
}
