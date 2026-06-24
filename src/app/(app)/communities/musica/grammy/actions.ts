'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface CategoryVote {
  categoryId:          string
  predictionNomineeId: string
  wishNomineeId:       string | null
}

// ─── Default categories for a new Grammy edition ──────────────────────────────

const GRAMMY_DEFAULT_CATEGORIES = [
  // PRINCIPAIS
  { name: 'Gravação do Ano',          display_order: 1  },
  { name: 'Álbum do Ano',             display_order: 2  },
  { name: 'Canção do Ano',            display_order: 3  },
  { name: 'Melhor Artista Revelação', display_order: 4  },
  // POP
  { name: 'Melhor Performance Pop Solo',                        display_order: 5  },
  { name: 'Melhor Performance de Duo/Grupo Pop',                display_order: 6  },
  { name: 'Melhor Performance Vocal de Pop Tradicional',        display_order: 7  },
  { name: 'Melhor Álbum Pop Vocal Tradicional',                 display_order: 8  },
  { name: 'Melhor Álbum Pop Vocal',                             display_order: 9  },
  { name: 'Melhor Performance de Música Pop Asiática',          display_order: 10 },
  // DANÇA/ELETRÔNICA
  { name: 'Melhor Performance de Dança/Eletrônica', display_order: 11 },
  { name: 'Melhor Álbum de Dança/Eletrônica',       display_order: 12 },
  // R&B
  { name: 'Melhor Performance Solo de R&B',                         display_order: 13 },
  { name: 'Melhor Colaboração ou Performance de Duo/Grupo de R&B',  display_order: 14 },
  { name: 'Melhor Performance de R&B Tradicional',                  display_order: 15 },
  { name: 'Melhor Performance de R&B Progressivo',                  display_order: 16 },
  { name: 'Melhor Canção de R&B',                                   display_order: 17 },
  { name: 'Melhor Álbum de R&B',                                    display_order: 18 },
  // RAP/HIP-HOP
  { name: 'Melhor Performance de Rap Melódico', display_order: 19 },
  { name: 'Melhor Performance de Rap',          display_order: 20 },
  { name: 'Melhor Canção de Rap',               display_order: 21 },
  { name: 'Melhor Álbum de Rap',                display_order: 22 },
  // COUNTRY
  { name: 'Melhor Performance de Country Solo',      display_order: 23 },
  { name: 'Melhor Performance de Duo/Grupo Country', display_order: 24 },
  { name: 'Melhor Canção Country',                   display_order: 25 },
  { name: 'Melhor Álbum Country',                    display_order: 26 },
  // ROCK
  { name: 'Melhor Performance de Rock',  display_order: 27 },
  { name: 'Melhor Performance de Metal', display_order: 28 },
  { name: 'Melhor Canção de Rock',       display_order: 29 },
  { name: 'Melhor Álbum de Rock',        display_order: 30 },
  // ALTERNATIVO
  { name: 'Melhor Performance de Música Alternativa', display_order: 31 },
  { name: 'Melhor Álbum de Música Alternativa',       display_order: 32 },
  // JAZZ
  { name: 'Melhor Performance de Jazz Instrumental', display_order: 33 },
  { name: 'Melhor Álbum de Jazz Instrumental',       display_order: 34 },
  { name: 'Melhor Álbum de Jazz Vocal',              display_order: 35 },
  // GOSPEL/CRISTÃO
  { name: 'Melhor Álbum de Gospel',                      display_order: 36 },
  { name: 'Melhor Álbum de Música Cristã Contemporânea', display_order: 37 },
  // LATINO
  { name: 'Melhor Performance Latina de Pop ou Urbana',       display_order: 38 },
  { name: 'Melhor Performance Latina de Rock ou Alternativa', display_order: 39 },
  { name: 'Melhor Álbum de Rock Latino ou Alternativo',       display_order: 40 },
  { name: 'Melhor Canção Latina',                             display_order: 41 },
  // FOLK
  { name: 'Melhor Álbum de Música Folclórica Tradicional', display_order: 42 },
  { name: 'Melhor Álbum de Folk Contemporâneo',            display_order: 43 },
  // WORLD/CLÁSSICO
  { name: 'Melhor Álbum de Música do Mundo', display_order: 44 },
  { name: 'Melhor Álbum de Música Clássica', display_order: 45 },
  // MÍDIA VISUAL
  { name: 'Melhor Trilha Sonora para Mídia Visual',       display_order: 46 },
  { name: 'Melhor Canção Escrita para Mídia Visual',      display_order: 47 },
  { name: 'Melhor Álbum de Compilação para Mídia Visual', display_order: 48 },
  { name: 'Melhor Videoclipe',                            display_order: 49 },
  { name: 'Melhor Filme Musical',                         display_order: 50 },
] as const

// ─── Voting ───────────────────────────────────────────────────────────────────

export async function saveGrammyVotes(
  editionId: string,
  votes: CategoryVote[],
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Login necessário' }

  const { data: edition } = await supabase
    .from('grammy_editions')
    .select('status')
    .eq('id', editionId)
    .single()

  if (!edition)                    return { error: 'Edição não encontrada' }
  if (edition.status !== 'voting') return { error: 'Votações encerradas' }

  const rows = votes.map(v => ({
    edition_id:            editionId,
    category_id:           v.categoryId,
    user_id:               user.id,
    prediction_nominee_id: v.predictionNomineeId,
    wish_nominee_id:       v.wishNomineeId ?? null,
  }))

  const { error } = await supabase
    .from('grammy_votes')
    .upsert(rows, { onConflict: 'category_id,user_id' })

  if (error) return { error: error.message }

  revalidatePath('/communities/musica/grammy')
  return {}
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Login necessário')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (profile?.username !== 'incelicasappoficial') throw new Error('Sem permissão')
  return { supabase, userId: user.id }
}

// ─── Admin — Edition ──────────────────────────────────────────────────────────

export async function createGrammyEditionWithCategories(
  year: number,
  ceremonyDate: string,
): Promise<{ error?: string; id?: string }> {
  try {
    const { supabase, userId } = await requireAdmin()

    const { data, error } = await supabase
      .from('grammy_editions')
      .insert({ year, ceremony_date: ceremonyDate, created_by: userId })
      .select('id')
      .single()

    if (error) return { error: error.message }

    const { error: catError } = await supabase
      .from('grammy_categories')
      .insert(
        GRAMMY_DEFAULT_CATEGORIES.map(cat => ({
          edition_id:    data.id,
          name:          cat.name,
          display_order: cat.display_order,
          is_active:     true,
        })),
      )

    if (catError) return { error: catError.message }

    revalidatePath('/communities/musica/grammy')
    return { id: data.id }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// kept for backwards compat — creates edition without categories
export async function createGrammyEdition(
  year: number,
  ceremonyDate: string,
): Promise<{ error?: string; id?: string }> {
  return createGrammyEditionWithCategories(year, ceremonyDate)
}

export async function closeGrammyVoting(editionId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('grammy_editions')
      .update({ status: 'closed' })
      .eq('id', editionId)
    if (error) return { error: error.message }
    revalidatePath('/communities/musica/grammy')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function revealGrammyWinners(
  editionId: string,
  winners: Array<{ categoryId: string; winnerId: string }>,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin()

    // Set winner per category
    for (const { categoryId, winnerId } of winners) {
      const { error } = await supabase
        .from('grammy_categories')
        .update({ winner_nominee_id: winnerId })
        .eq('id', categoryId)
        .eq('edition_id', editionId)
      if (error) throw new Error(error.message)
    }

    // Reveal edition
    const { error: edError } = await supabase
      .from('grammy_editions')
      .update({ status: 'revealed' })
      .eq('id', editionId)
    if (edError) throw new Error(edError.message)

    // Score each user: 10 pts per correct prediction
    const { data: allVotes } = await supabase
      .from('grammy_votes')
      .select('user_id, category_id, prediction_nominee_id')
      .eq('edition_id', editionId)

    if (allVotes && allVotes.length > 0) {
      const winnerMap: Record<string, string> = {}
      for (const w of winners) winnerMap[w.categoryId] = w.winnerId

      const userScores: Record<string, number> = {}
      for (const v of allVotes) {
        if (winnerMap[v.category_id] === v.prediction_nominee_id) {
          userScores[v.user_id] = (userScores[v.user_id] ?? 0) + 10
        }
      }

      await Promise.all(
        Object.entries(userScores).map(([userId, score]) =>
          supabase.rpc('add_game_score', { p_user_id: userId, p_game_type: 'grammy', p_score: score }),
        ),
      )
    }

    revalidatePath('/communities/musica/grammy')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ─── Admin — Categories ───────────────────────────────────────────────────────

export async function addGrammyCategory(
  editionId: string,
  name: string,
  displayOrder: number,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('grammy_categories')
      .insert({ edition_id: editionId, name, display_order: displayOrder, is_active: true })
    if (error) return { error: error.message }
    revalidatePath('/communities/musica/grammy')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function toggleCategoryActive(
  categoryId: string,
  isActive: boolean,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('grammy_categories')
      .update({ is_active: isActive })
      .eq('id', categoryId)
    if (error) return { error: error.message }
    revalidatePath('/communities/musica/grammy')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteGrammyCategory(categoryId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('grammy_categories')
      .delete()
      .eq('id', categoryId)
    if (error) return { error: error.message }
    revalidatePath('/communities/musica/grammy')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ─── Admin — Nominees ─────────────────────────────────────────────────────────

export async function addGrammyNominee(
  categoryId: string,
  name: string,
  artist: string | null,
  coverUrl: string | null,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('grammy_nominees')
      .insert({ category_id: categoryId, name, artist, cover_url: coverUrl })
    if (error) return { error: error.message }
    revalidatePath('/communities/musica/grammy')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteGrammyNominee(nomineeId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('grammy_nominees')
      .delete()
      .eq('id', nomineeId)
    if (error) return { error: error.message }
    revalidatePath('/communities/musica/grammy')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
