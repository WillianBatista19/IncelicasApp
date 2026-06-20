'use client'

import { useFeed } from '@/hooks/useFeed'
import PostCard from '@/components/feed/PostCard'

type Props = { currentUserId: string }

export default function FeedClient({ currentUserId }: Props) {
  const { posts, loading } = useFeed()

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-800" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-1/3 rounded bg-zinc-800" />
                <div className="h-3 w-2/3 rounded bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
        <p className="mb-2 text-2xl">✨</p>
        <p className="text-sm text-zinc-400">
          Nenhuma vibe por aqui ainda. Seja a primeira a postar, incelica!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
