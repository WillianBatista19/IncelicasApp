'use server'

import { createClient } from '@/lib/supabase/server'
import { createOfficialPost } from '@/lib/officialPost'

export async function submitChangelogEntry(
  version: string,
  title: string,
  items: string[],
  entryDate: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (profile?.username !== 'incelicasappoficial') {
    return { error: 'Apenas a conta oficial pode adicionar entradas no changelog' }
  }

  const { error: dbError } = await supabase.from('changelog_entries').insert({
    version: version.trim(),
    title:   title.trim(),
    items,
    entry_date: entryDate,
  })

  if (dbError) return { error: dbError.message }

  const body = `🆕 ${version.trim()} — ${title.trim()}\n\n${items.map(i => `• ${i}`).join('\n')}\n\n#incelicas #update`
  try { await createOfficialPost(body) } catch { /* non-fatal */ }

  return {}
}

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
