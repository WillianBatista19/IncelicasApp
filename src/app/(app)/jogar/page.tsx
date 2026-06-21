import { createClient } from '@/lib/supabase/server'
import JogarClient from '@/components/games/JogarClient'

const ADMIN_USERNAME = 'incelicasappoficial'

export default async function JogarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    isAdmin = data?.username === ADMIN_USERNAME
  }

  return <JogarClient currentUserId={user?.id ?? null} isAdmin={isAdmin} />
}
