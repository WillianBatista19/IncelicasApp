'use server'

import { createClient } from '@/lib/supabase/server'
import { createOfficialPost } from '@/lib/officialPost'

export async function postOfficialMessage(content: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (profile?.username !== 'incelicasappoficial') {
    return { error: 'Apenas a conta oficial pode criar posts oficiais' }
  }

  try {
    await createOfficialPost(content.trim())
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro ao criar post' }
  }
}
