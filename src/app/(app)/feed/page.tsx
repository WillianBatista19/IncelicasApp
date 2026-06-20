import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FeedSection from '@/components/feed/FeedSection'
import TrendingSidebar from '@/components/sidebar/TrendingSidebar'
import WhoToFollow from '@/components/sidebar/WhoToFollow'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">

      {/* ── Main feed column ── */}
      <FeedSection currentUserId={user.id} profile={profile} />

      {/* ── Right sidebar (wide desktop only, xl+) ── */}
      <aside className="hidden xl:flex xl:flex-col xl:gap-4 xl:sticky xl:top-[72px]">
        <TrendingSidebar />
        <WhoToFollow currentUserId={user.id} />
      </aside>

    </div>
  )
}
