'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createCommunityComment, deleteCommunityComment } from '@/app/(app)/communities/actions'

interface CommunityComment {
  id:           string
  post_id:      string
  user_id:      string
  parent_id:    string | null
  content:      string
  created_at:   string
  profiles: {
    id:           string
    username:     string
    display_name: string | null
    avatar_url:   string | null
  }
}

interface Props {
  postId:        string
  currentUserId: string | null
  initialComments?: CommunityComment[]
}

export default function CommunityComments({ postId, currentUserId, initialComments = [] }: Props) {
  const [comments, setComments] = useState<CommunityComment[]>(initialComments)
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(false)
  const textareaRef             = useRef<HTMLTextAreaElement>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || loading) return
    setLoading(true)
    try {
      await createCommunityComment(postId, text.trim())
      setText('')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(commentId: string) {
    await deleteCommunityComment(commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  return (
    <div className="space-y-3">
      {comments.map(c => (
        <div key={c.id} className="flex gap-2">
          <Link href={`/profile/${c.profiles.username}`}>
            {c.profiles.avatar_url ? (
              <Image
                src={c.profiles.avatar_url}
                alt={c.profiles.display_name ?? c.profiles.username}
                width={28} height={28}
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#7F77DD] flex items-center justify-center text-white text-xs shrink-0">
                {(c.profiles.display_name ?? c.profiles.username)[0].toUpperCase()}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <Link
                href={`/profile/${c.profiles.username}`}
                className="text-xs font-semibold text-white hover:underline"
              >
                {c.profiles.display_name ?? c.profiles.username}
              </Link>
              <span className="text-xs text-zinc-500">
                @{c.profiles.username}
              </span>
            </div>
            <p className="text-sm text-zinc-200 break-words">{c.content}</p>
          </div>
          {currentUserId === c.user_id && (
            <button
              onClick={() => handleDelete(c.id)}
              className="text-zinc-600 hover:text-red-400 text-xs shrink-0"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {currentUserId && (
        <form onSubmit={submit} className="flex gap-2 mt-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Comentar…"
            rows={1}
            className="flex-1 resize-none rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D4537E]"
          />
          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="rounded-lg bg-[#D4537E] px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? '…' : '→'}
          </button>
        </form>
      )}
    </div>
  )
}
