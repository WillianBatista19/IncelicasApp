import { createClient } from '@supabase/supabase-js'

// Creates a post from the incelicasappoficial account using the Supabase
// service role key (bypasses RLS so no user session is required).
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
export async function createOfficialPost(content: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('[officialPost] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  })

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', 'incelicasappoficial')
    .single()

  if (profileError || !profile) {
    console.error('[officialPost] Profile "incelicasappoficial" not found:', profileError?.message)
    return
  }

  const { error } = await supabase
    .from('posts')
    .insert({ user_id: profile.id, content })

  if (error) {
    console.error('[officialPost] Insert failed:', error.message)
  }
}
