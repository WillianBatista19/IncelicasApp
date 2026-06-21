import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClient from '@/components/games/AdminClient'

const ADMIN_USERNAME = 'incelicasappoficial'

export default async function JogarAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (data?.username !== ADMIN_USERNAME) redirect('/jogar')

  return <AdminClient />
}
