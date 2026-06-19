'use client'

import { useState } from 'react'
import Avatar from '@/components/Avatar'
import CategoryBadge from '@/components/feed/CategoryBadge'
import MediaEmbed from '@/components/feed/MediaEmbed'
import VibeCheck from '@/components/feed/VibeCheck'
import CommentsSection from '@/components/feed/CommentsSection'
import { relativeTime } from '@/lib/utils'
import type { Post } from '@/types'

type Props = {
  post:          Post
  currentUserId: string | null
}

export default function PostCard({ post, currentUserId }: Props) {
  const [showComments, setShowComments] = useState(false)
  const profile = post.profiles

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar
          src={profile.avatar_url}
          name={profile.display_name}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-semibold leading-tight text-zinc-100 truncate">
              {profile.display_name}
            </span>
            <span className="text-xs text-zinc-500 truncate">
              @{profile.username}
            </span>
            <span className="text-xs text-zinc-700">·</span>
            <time
              dateTime={post.created_at}
              className="shrink-0 text-xs text-zinc-500"
            >
              {relativeTime(post.created_at)}
            </time>
          </div>

          {post.category && (
            <div className="mt-1">
              <CategoryBadge category={post.category} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">
        {post.content}
      </p>

      {/* Media */}
      <MediaEmbed spotifyUrl={post.spotify_url} youtubeUrl={post.youtube_url} />

      {/* Vibe Check + Comments toggle */}
      <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
        <VibeCheck
          postId={post.id}
          initialVibes={post.vibes}
          currentUserId={currentUserId}
        />

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="ml-3 shrink-0 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          💬 {showComments ? 'Fechar' : 'Comentários'}
        </button>
      </div>

      {/* Expandable comments */}
      {showComments && (
        <CommentsSection
          postId={post.id}
          currentUserId={currentUserId}
        />
      )}

    </article>
  )
}
