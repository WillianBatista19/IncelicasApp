import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import FeedSection from '@/components/feed/FeedSection'
import TrendingSidebar from '@/components/sidebar/TrendingSidebar'
import WhoToFollow from '@/components/sidebar/WhoToFollow'

async function createPost(formData: FormData) {
  'use server'

  const content = (formData.get('content') as string | null)?.trim()
  if (!content) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const mediaUrl = (formData.get('media_url') as string | null)?.trim() || null

  let spotify_url: string | null = null
  let youtube_url: string | null = null
  if (mediaUrl) {
    if (mediaUrl.includes('spotify.com'))                                   spotify_url = mediaUrl
    else if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) youtube_url = mediaUrl
  }

  await supabase.from('posts').insert({
    user_id: user.id,
    content,
    spotify_url,
    youtube_url,
  })

  revalidatePath('/feed')
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">

      {/* ── Main feed column ── */}
      <FeedSection currentUserId={user.id} createPost={createPost} />

      {/* ── Right sidebar (wide desktop only, xl+) ── */}
      <aside className="hidden xl:flex xl:flex-col xl:gap-4 xl:sticky xl:top-[72px]">
        <TrendingSidebar />
        <WhoToFollow currentUserId={user.id} />
      </aside>

    </div>
  )
}
