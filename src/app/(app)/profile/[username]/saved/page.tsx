import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/feed/PostCard'
import type { Post } from '@/types'

const POST_SELECT = `
  id, user_id, content, image_url, spotify_url, youtube_url, category, created_at,
  repost_comment, repost_count,
  profiles!posts_user_id_fkey (id, username, display_name, avatar_url, bio, created_at),
  vibes    (id, post_id, user_id, type, created_at),
  original_post:repost_of (
    id, user_id, content, image_url, spotify_url, youtube_url, category, created_at,
    profiles!posts_user_id_fkey (id, username, display_name, avatar_url, bio, created_at)
  )
`.trim()

export default async function SavedPostsPage({ params }: { params: { username: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()
  if (profile.id !== user.id) notFound()

  const [{ data: savedRows }, { data: currentProfile }] = await Promise.all([
    supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })
      .limit(100),
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single(),
  ])

  const currentUserUsername = (currentProfile as { username: string } | null)?.username ?? null
  const postIds = (savedRows ?? []).map(r => r.post_id as string)

  const posts: Post[] = []

  if (postIds.length > 0) {
    const { data: postsData } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .in('id', postIds)

    const byId = new Map((postsData as unknown as Post[] ?? []).map(p => [p.id, p]))
    for (const id of postIds) {
      const p = byId.get(id)
      if (p) posts.push(p)
    }
  }

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${params.username}`}
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Voltar
        </Link>
        <h1 className="text-lg font-black text-zinc-100">🔖 Posts salvos</h1>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-14 text-center">
          <p className="mb-2 text-2xl">🔖</p>
          <p className="text-sm text-zinc-400">
            Você ainda não salvou nenhum post. Toca no marcador para salvar!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user.id}
              currentUserUsername={currentUserUsername}
            />
          ))}
        </div>
      )}
    </div>
  )
}
