import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UserSearch from '@/components/UserSearch'
import TrendingSidebar from '@/components/sidebar/TrendingSidebar'
import WhoToFollow from '@/components/sidebar/WhoToFollow'

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-zinc-100">Explorar</h1>
      <UserSearch currentUserId={user.id} currentUserUsername={profile?.username ?? null} />
      <TrendingSidebar />
      <WhoToFollow currentUserId={user.id} />
    </div>
  )
}
