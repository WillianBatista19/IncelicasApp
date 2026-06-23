'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface TrackInput {
  track_id:     string
  track_name:   string
  track_number: number
  preview_url:  string | null
}

interface CreateEventInput {
  communityId: string
  albumId:     string
  albumName:   string
  artistName:  string
  coverUrl:    string | null
  tracks:      TrackInput[]
}

export async function castVote(
  eventId:    string,
  trackId:    string,
  round:      number,
  isTiebreak: boolean = false,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login necessário' }

  const { error } = await supabase
    .from('survivor_votes')
    .upsert(
      { event_id: eventId, track_id: trackId, user_id: user.id, round, is_tiebreak: isTiebreak },
      { onConflict: 'event_id,user_id,round,is_tiebreak' },
    )

  if (error) {
    if (error.code === '42501' || error.code === '23505') {
      return { error: isTiebreak
        ? 'Você já votou no desempate!'
        : 'Você já votou nessa rodada. Aguarde a próxima!' }
    }
    return { error: error.message }
  }

  revalidatePath('/communities/musica/survivor')
  return {}
}

export async function advanceRound(eventId: string): Promise<{ message?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Login necessário')

  console.log('[advanceRound] eventId:', eventId, '| userId:', user.id)

  // Query the event — separate error from data so we can diagnose RLS/column issues
  const { data: event, error: eventError } = await supabase
    .from('survivor_events')
    .select('community_id, current_round, status, album_name, tiebreak_active, tiebreak_track_ids, tiebreak_round')
    .eq('id', eventId)
    .maybeSingle()

  console.log('[advanceRound] event query →', { event, error: eventError })

  if (eventError) throw new Error(`Erro ao buscar evento: ${eventError.message}`)
  if (!event) throw new Error('Evento não encontrado (verifique as permissões RLS)')
  if (event.status !== 'active') throw new Error(`Evento não está ativo (status: ${event.status})`)

  const { data: memberRow } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', event.community_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (memberRow?.role !== 'owner') throw new Error('Sem permissão')

  const { data: surviving } = await supabase
    .from('survivor_tracks')
    .select('id, track_name, track_number')
    .eq('event_id', eventId)
    .is('eliminated_at_round', null)
    .order('track_number')
  if (!surviving || surviving.length < 2) throw new Error('Faixas insuficientes para avançar')

  const N = surviving.length

  // ─── helper: throw on Supabase update error ──────────────────────────────
  async function updateTracks(ids: string[], patch: Record<string, unknown>) {
    const { error } = await supabase.from('survivor_tracks').update(patch).in('id', ids)
    console.log('[advanceRound] updateTracks', ids, patch, '→ error:', error)
    if (error) throw new Error(`Erro ao atualizar faixas: ${error.message}`)
  }
  async function updateEvent(patch: Record<string, unknown>) {
    const { error } = await supabase.from('survivor_events').update(patch).eq('id', eventId)
    console.log('[advanceRound] updateEvent', patch, '→ error:', error)
    if (error) throw new Error(`Erro ao atualizar evento: ${error.message}`)
  }

  // ─── CASE A: Resolve final tiebreak (2 tracks, tiebreak_active) ────────────
  if (event.tiebreak_active && N === 2) {
    const { data: tbVotes } = await supabase
      .from('survivor_votes')
      .select('track_id')
      .eq('event_id', eventId)
      .eq('round', event.tiebreak_round)
      .eq('is_tiebreak', true)

    const tally = new Map<string, number>()
    for (const v of tbVotes ?? []) tally.set(v.track_id, (tally.get(v.track_id) ?? 0) + 1)

    const [t1, t2] = surviving
    const c1 = tally.get(t1.id) ?? 0
    const c2 = tally.get(t2.id) ?? 0

    console.log('[advanceRound] CASE A final tiebreak | tally:', Object.fromEntries(tally), c1, 'vs', c2)

    if (c1 === c2) {
      await updateTracks([t1.id, t2.id], { final_position: 1 })
      await updateEvent({ status: 'finished', tiebreak_active: false })
      revalidatePath('/communities/musica/survivor')
      return { message: `🏆🏆 EMPATE HISTÓRICO! "${t1.track_name}" e "${t2.track_name}" são co-campeãs!` }
    }

    const winner = c1 > c2 ? t1 : t2
    const loser  = c1 > c2 ? t2 : t1
    await updateTracks([winner.id], { final_position: 1 })
    await updateTracks([loser.id],  { eliminated_at_round: event.tiebreak_round, final_position: 2 })
    await updateEvent({ status: 'finished', tiebreak_active: false })
    revalidatePath('/communities/musica/survivor')
    return { message: `🏆 "${winner.track_name}" é a campeã do Survivor de ${event.album_name}!` }
  }

  // ─── CASE B: Resolve semifinal tiebreak (3 tracks, tiebreak_active) ────────
  if (event.tiebreak_active && N === 3) {
    const tieIds = event.tiebreak_track_ids ?? []
    const { data: tbVotes } = await supabase
      .from('survivor_votes')
      .select('track_id')
      .eq('event_id', eventId)
      .eq('round', event.tiebreak_round)
      .eq('is_tiebreak', true)

    const tally = new Map<string, number>()
    for (const v of tbVotes ?? []) {
      if (tieIds.includes(v.track_id)) {
        tally.set(v.track_id, (tally.get(v.track_id) ?? 0) + 1)
      }
    }

    const tieTracks = surviving.filter(t => tieIds.includes(t.id))
    const maxTb     = tieTracks.reduce((m, t) => Math.max(m, tally.get(t.id) ?? 0), 0)
    const stillTied = tieTracks.filter(t => (tally.get(t.id) ?? 0) === maxTb)
    const toElim    = stillTied.length > 1
      ? stillTied.reduce((a, b) => a.track_number > b.track_number ? a : b)
      : (stillTied[0] ?? tieTracks[0])

    console.log('[advanceRound] CASE B semifinal tiebreak | tally:', Object.fromEntries(tally), '| elim:', toElim?.track_name)

    const newRound  = event.current_round + 1
    const remaining = surviving.filter(t => t.id !== toElim.id)

    await updateTracks([toElim.id], { eliminated_at_round: event.current_round, final_position: 3 })
    await updateEvent({
      current_round:      newRound,
      tiebreak_active:    true,
      tiebreak_track_ids: remaining.map(t => t.id),
      tiebreak_round:     newRound,
    })
    revalidatePath('/communities/musica/survivor')
    return {
      message: stillTied.length > 1
        ? `💀 Empate de novo! "${toElim.track_name}" eliminada pelo número da faixa.`
        : `💀 "${toElim.track_name}" eliminada no desempate!`,
    }
  }

  // ─── CASE C: Normal advance (no tiebreak active) ───────────────────────────
  const { data: regularVotes } = await supabase
    .from('survivor_votes')
    .select('track_id')
    .eq('event_id', eventId)
    .eq('round', event.current_round)
    .eq('is_tiebreak', false)

  const tally = new Map<string, number>()
  for (const v of regularVotes ?? []) tally.set(v.track_id, (tally.get(v.track_id) ?? 0) + 1)

  const maxVotes = Math.max(0, ...surviving.map(t => tally.get(t.id) ?? 0))
  let topTracks  = surviving.filter(t => (tally.get(t.id) ?? 0) === maxVotes)

  // No votes: fall back to last track by track_number
  if (maxVotes === 0) topTracks = [surviving[surviving.length - 1]]

  console.log('[advanceRound] CASE C | votes:', regularVotes?.length ?? 0, '| tally:', Object.fromEntries(tally), '| topTracks:', topTracks.map(t => t.track_name))

  // Semifinal tie → activate tiebreak instead of eliminating
  if (N === 3 && topTracks.length > 1) {
    await updateEvent({
      tiebreak_active:    true,
      tiebreak_track_ids: topTracks.map(t => t.id),
      tiebreak_round:     event.current_round,
    })
    revalidatePath('/communities/musica/survivor')
    return { message: `⚔️ Empate! Desempate ativado entre ${topTracks.length} faixas!` }
  }

  // Safeguard: never eliminate every remaining track
  if (topTracks.length >= N) topTracks = [surviving[surviving.length - 1]]

  const eliminatedIds = topTracks.map(t => t.id)
  const newCount = N - topTracks.length
  const newRound = event.current_round + 1

  await updateTracks(eliminatedIds, { eliminated_at_round: event.current_round, final_position: newCount + 1 })

  if (newCount === 1) {
    const winner = surviving.find(t => !eliminatedIds.includes(t.id))!
    await updateTracks([winner.id], { final_position: 1 })
    await updateEvent({ status: 'finished' })
    revalidatePath('/communities/musica/survivor')
    return { message: `🏆 "${winner.track_name}" é a campeã!` }
  }

  if (newCount === 2) {
    const remaining = surviving.filter(t => !eliminatedIds.includes(t.id))
    await updateEvent({
      current_round:      newRound,
      tiebreak_active:    true,
      tiebreak_track_ids: remaining.map(t => t.id),
      tiebreak_round:     newRound,
    })
  } else {
    await updateEvent({ current_round: newRound })
  }

  revalidatePath('/communities/musica/survivor')
  return topTracks.length > 1
    ? { message: `💥 Empate! ${topTracks.length} faixas eliminadas!` }
    : {}
}

export async function createSurvivorEvent(input: CreateEventInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Login necessário')

  const { data: member } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', input.communityId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (member?.role !== 'owner') throw new Error('Sem permissão')

  const { data: existing } = await supabase
    .from('survivor_events')
    .select('id')
    .eq('community_id', input.communityId)
    .eq('status', 'active')
    .maybeSingle()
  if (existing) throw new Error('Já existe um Survivor ativo')

  console.log('[createSurvivorEvent] tracks received:', input.tracks.length, input.tracks.map(t => t.track_name))

  if (input.tracks.length === 0) throw new Error('Nenhuma faixa encontrada para criar o Survivor')

  const { data: event, error } = await supabase
    .from('survivor_events')
    .insert({
      community_id: input.communityId,
      created_by:   user.id,
      album_id:     input.albumId,
      album_name:   input.albumName,
      artist_name:  input.artistName,
      cover_url:    input.coverUrl,
    })
    .select('id')
    .single()
  if (error || !event) throw new Error(error?.message ?? 'Erro ao criar evento')

  console.log('[createSurvivorEvent] event created:', event.id, '— inserting', input.tracks.length, 'tracks')

  const { error: trackErr } = await supabase
    .from('survivor_tracks')
    .insert(input.tracks.map(t => ({
      event_id:     event.id,
      track_id:     t.track_id,
      track_name:   t.track_name,
      track_number: t.track_number,
      preview_url:  t.preview_url,
    })))

  console.log('[createSurvivorEvent] track insert error:', trackErr)
  if (trackErr) throw new Error(`Erro ao inserir faixas: ${trackErr.message}`)

  revalidatePath('/communities/musica/survivor')
  return { eventId: event.id }
}
