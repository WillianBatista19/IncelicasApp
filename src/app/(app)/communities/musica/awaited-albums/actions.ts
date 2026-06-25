'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireMember(communityId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Login necessário')

  const { data: member } = await supabase
    .from('community_members')
    .select('user_id')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) throw new Error('Você precisa ser membro da comunidade')
  return { supabase, userId: user.id }
}

export async function addAwaitedAlbum(
  communityId: string,
  albumData: {
    albumId:     string
    albumName:   string
    artistName:  string
    coverUrl:    string | null
    releaseDate: string | null
  },
): Promise<{ error?: string; alreadyExists?: boolean }> {
  try {
    const { supabase, userId } = await requireMember(communityId)

    const { data: inserted, error } = await supabase
      .from('community_awaited_albums')
      .insert({
        community_id: communityId,
        album_id:     albumData.albumId,
        album_name:   albumData.albumName,
        artist_name:  albumData.artistName,
        cover_url:    albumData.coverUrl,
        release_date: albumData.releaseDate,
        added_by:     userId,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') return { alreadyExists: true }
      return { error: error.message }
    }

    // Auto-vote for the album you added
    await supabase
      .from('community_album_votes')
      .upsert(
        { community_id: communityId, album_id: inserted.id, user_id: userId },
        { onConflict: 'community_id,user_id' },
      )

    revalidatePath('/communities/musica')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function toggleAlbumVote(
  communityId:    string,
  awaitedAlbumId: string,
): Promise<{ error?: string; voted: boolean }> {
  try {
    const { supabase, userId } = await requireMember(communityId)

    const { data: existing } = await supabase
      .from('community_album_votes')
      .select('album_id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing?.album_id === awaitedAlbumId) {
      // Unvote
      await supabase
        .from('community_album_votes')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId)
      revalidatePath('/communities/musica')
      return { voted: false }
    }

    // Switch or new vote — upsert handles both
    await supabase
      .from('community_album_votes')
      .upsert(
        { community_id: communityId, album_id: awaitedAlbumId, user_id: userId },
        { onConflict: 'community_id,user_id' },
      )

    revalidatePath('/communities/musica')
    return { voted: true }
  } catch (e) {
    return { error: (e as Error).message, voted: false }
  }
}
