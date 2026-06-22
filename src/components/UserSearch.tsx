'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import FollowButton from '@/components/profile/FollowButton'
import PostCard from '@/components/feed/PostCard'
import type { Post } from '@/types'

type Profile = {
  id:           string
  username:     string
  display_name: string | null
  avatar_url:   string | null
}

type Tab = 'pessoas' | 'posts'

type Props = {
  currentUserId:        string
  currentUserUsername?: string | null
}

const POST_SELECT = `
  id, user_id, content, image_url, spotify_url, youtube_url, category, created_at,
  repost_comment, repost_count,
  profiles!posts_user_id_fkey (id, username, display_name, avatar_url, bio, created_at),
  vibes (id, post_id, user_id, type, created_at),
  original_post:repost_of (
    id, user_id, content, image_url, spotify_url, youtube_url, category, created_at,
    profiles!posts_user_id_fkey (id, username, display_name, avatar_url, bio, created_at)
  )
`.trim()

export default function UserSearch({ currentUserId, currentUserUsername }: Props) {
  const [query,          setQuery]          = useState('')
  const [tab,            setTab]            = useState<Tab>('pessoas')
  const [profileResults, setProfileResults] = useState<Profile[]>([])
  const [postResults,    setPostResults]    = useState<Post[]>([])
  const [loading,        setLoading]        = useState(false)
  const [searched,       setSearched]       = useState(false)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeTab  = useRef<Tab>('pessoas')

  async function searchPessoas(q: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq('id', currentUserId)
      .limit(10)
    setProfileResults((data as Profile[] | null) ?? [])
  }

  async function searchPosts(q: string) {
    const supabase = createClient()

    if (q.startsWith('#')) {
      const tag = q.slice(1).toLowerCase()
      const { data: hashRows } = await supabase
        .from('hashtags')
        .select('post_id')
        .eq('tag', tag)
        .order('created_at', { ascending: false })
        .limit(20)

      const postIds = (hashRows ?? []).map(r => (r as { post_id: string }).post_id)
      if (postIds.length === 0) { setPostResults([]); return }

      const { data } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .in('id', postIds)
        .order('created_at', { ascending: false })
      setPostResults((data as unknown as Post[]) ?? [])
    } else {
      const { data } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .textSearch('content', q, { type: 'websearch', config: 'portuguese' })
        .order('created_at', { ascending: false })
        .limit(20)
      setPostResults((data as unknown as Post[]) ?? [])
    }
  }

  async function runSearch(q: string, t: Tab) {
    const trimmed = q.trim()
    if (!trimmed) {
      setProfileResults([])
      setPostResults([])
      setSearched(false)
      setLoading(false)
      return
    }
    setLoading(true)
    if (t === 'pessoas') {
      await searchPessoas(trimmed)
    } else {
      await searchPosts(trimmed)
    }
    setSearched(true)
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void runSearch(q, activeTab.current), 500)
  }

  function handleTabChange(newTab: Tab) {
    activeTab.current = newTab
    setTab(newTab)
    if (query.trim()) {
      if (timerRef.current) clearTimeout(timerRef.current)
      void runSearch(query, newTab)
    }
  }

  const noResults =
    searched && !loading &&
    (tab === 'pessoas' ? profileResults.length === 0 : postResults.length === 0)

  return (
    <div>
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="Buscar incelicas ou posts..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 py-3 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-[#D4537E] focus:ring-1 focus:ring-[#D4537E]"
        />
      </div>

      {/* Tabs */}
      <div className="mt-3 flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/40 p-1">
        {(['pessoas', 'posts'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => handleTabChange(t)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-[#D4537E] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t === 'pessoas' ? '👤 Pessoas' : '📝 Posts'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <p className="mt-3 text-xs text-zinc-500">Buscando…</p>
      )}

      {/* Empty state */}
      {noResults && (
        <p className="mt-3 text-xs text-zinc-500">
          {tab === 'pessoas'
            ? 'Nenhuma incelica encontrada. Tenta outro nome.'
            : `Nenhum post encontrado para '${query.trim()}'.`}
        </p>
      )}

      {/* Pessoas results */}
      {!loading && tab === 'pessoas' && profileResults.length > 0 && (
        <ul className="mt-3 overflow-hidden divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900/60">
          {profileResults.map((profile) => {
            const name = profile.display_name || profile.username
            return (
              <li key={profile.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/profile/${profile.username}`} className="shrink-0">
                  <Avatar src={profile.avatar_url} name={name} size="md" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${profile.username}`}
                    className="block truncate text-sm font-semibold text-zinc-200 transition-colors hover:text-zinc-100"
                  >
                    {name}
                  </Link>
                  <p className="truncate text-xs text-zinc-500">@{profile.username}</p>
                </div>
                <FollowButton targetUserId={profile.id} currentUserId={currentUserId} />
              </li>
            )
          })}
        </ul>
      )}

      {/* Posts results */}
      {!loading && tab === 'posts' && postResults.length > 0 && (
        <div className="mt-3 space-y-4">
          {postResults.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              currentUserUsername={currentUserUsername ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
