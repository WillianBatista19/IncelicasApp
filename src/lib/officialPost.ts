import { createClient } from '@supabase/supabase-js'

// Creates a post from the incelicasappoficial account using the Supabase
// service role key (bypasses RLS so no user session is required).
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
export async function createOfficialPost(content: string): Promise<{ error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    const msg = '[officialPost] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    console.error(msg)
    return { error: 'Variáveis de ambiente não configuradas (SERVICE_ROLE_KEY)' }
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  })

  console.log('[officialPost] Looking up incelicasappoficial profile…')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', 'incelicasappoficial')
    .single()

  if (profileError || !profile) {
    const msg = `[officialPost] Profile "incelicasappoficial" not found: ${profileError?.message ?? 'no data'}`
    console.error(msg)
    return { error: `Perfil @incelicasappoficial não encontrado: ${profileError?.message ?? 'sem dados'}` }
  }

  console.log('[officialPost] Profile found, id =', profile.id, '— inserting post…')

  const { data: inserted, error: insertError } = await supabase
    .from('posts')
    .insert({ user_id: profile.id, content })
    .select('id')
    .single()

  if (insertError) {
    const msg = `[officialPost] Insert failed: ${insertError.message} (code: ${insertError.code})`
    console.error(msg)
    return { error: `Erro ao inserir post: ${insertError.message}` }
  }

  console.log('[officialPost] Post created successfully, id =', inserted?.id)
  return {}
}
