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

  const category = (formData.get('category')  as string | null) || null
  const mediaUrl = (formData.get('media_url') as string | null)?.trim() || null

  let spotify_url: string | null = null
  let youtube_url: string | null = null
  if (mediaUrl) {
    if (mediaUrl.includes('spotify.com')) {
      spotify_url = mediaUrl
    } else if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
      youtube_url = mediaUrl
    }
  }

  await supabase.from('posts').insert({
    user_id: user.id,
    content,
    category,
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
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">

      {/* ── Main feed column ── */}
      <FeedSection currentUserId={user.id} createPost={createPost} />

      {/* ── Right sidebar (desktop only) ── */}
      <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-[72px]">
        <TrendingSidebar />
        <WhoToFollow currentUserId={user.id} />
      </aside>

    </div>
  )
}
