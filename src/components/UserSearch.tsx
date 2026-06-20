'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import FollowButton from '@/components/profile/FollowButton'

type Profile = {
  id:           string
  username:     string
  display_name: string | null
  avatar_url:   string | null
}

type Props = { currentUserId: string }

export default function UserSearch({ currentUserId }: Props) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<Profile[]>([])
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function search(q: string) {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${q.trim()}%,display_name.ilike.%${q.trim()}%`)
      .neq('id', currentUserId)
      .limit(10)
    setResults((data as Profile[] | null) ?? [])
    setSearched(true)
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(q), 350)
  }

  return (
    <div>
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="Buscar incelicas..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 py-3 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-[#D4537E] focus:ring-1 focus:ring-[#D4537E]"
        />
      </div>

      {/* States */}
      {loading && (
        <p className="mt-3 text-xs text-zinc-500">Buscando…</p>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="mt-3 text-xs text-zinc-500">
          Nenhuma incelica encontrada. Tenta outro nome.
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <ul className="mt-3 divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          {results.map((profile) => {
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
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
