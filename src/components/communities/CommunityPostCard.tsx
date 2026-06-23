'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { CommunityPost } from '@/types'
import CommunityVibeCheck from './CommunityVibeCheck'
import CommunityComments from './CommunityComments'
import { deleteCommunityPost } from '@/app/(app)/communities/actions'

interface Props {
  post:          CommunityPost
  currentUserId: string | null
  isOwnerOrMod?: boolean
}

export default function CommunityPostCard({ post, currentUserId, isOwnerOrMod }: Props) {
  const [showComments, setShowComments] = useState(false)
  const [deleted, setDeleted]           = useState(false)

  if (deleted) return null

  async function handleDelete() {
    await deleteCommunityPost(post.id)
    setDeleted(true)
  }

  const canDelete = currentUserId === post.user_id || isOwnerOrMod
  const profile   = post.profiles
  const timeAgo   = formatTimeAgo(post.created_at)

  return (
    <article className="rounded-xl bg-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${profile.username}`}>
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.username}
                width={36} height={36}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#7F77DD] flex items-center justify-center text-white text-sm">
                {(profile.display_name ?? profile.username)[0].toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <Link href={`/profile/${profile.username}`} className="text-sm font-semibold text-white hover:underline">
              {profile.display_name ?? profile.username}
            </Link>
            <p className="text-xs text-zinc-500">@{profile.username} · {timeAgo}</p>
          </div>
        </div>
        {canDelete && (
          <button onClick={handleDelete} className="text-zinc-600 hover:text-red-400 text-xs">
            Excluir
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{post.content}</p>

      {post.image_url && (
        <Image
          src={post.image_url}
          alt="post image"
          width={600} height={400}
          className="rounded-xl object-cover w-full max-h-80"
        />
      )}

      <div className="flex items-center gap-4">
        <CommunityVibeCheck
          postId={post.id}
          initialVibes={post.community_post_vibes}
          currentUserId={currentUserId}
        />
        <button
          onClick={() => setShowComments(v => !v)}
          className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
        >
          💬 {post.community_comments.length}
        </button>
      </div>

      {showComments && (
        <CommunityComments
          postId={post.id}
          currentUserId={currentUserId}
        />
      )}
    </article>
  )
}

function formatTimeAgo(isoString: string): string {
  const diff  = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)  return 'agora'
  if (mins < 60) return `${mins}min`
  const hrs   = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}
