'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { acceptFollowRequest, declineFollowRequest } from '@/app/(app)/profile/actions'

type Requester = {
  id:           string
  username:     string
  display_name: string | null
  avatar_url:   string | null
}

type Request = {
  id:           string
  requester_id: string
  created_at:   string
  requester:    Requester | null
}

type Props = { profileId: string }

export default function FollowRequestsSection({ profileId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const router   = useRouter()
  const [requests, setRequests] = useState<Request[] | null>(null)
  const [acting,   setActing]   = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('follow_requests')
      .select('id, requester_id, created_at, requester:profiles!follow_requests_requester_id_fkey(id, username, display_name, avatar_url)')
      .eq('target_id', profileId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRequests((data as unknown as Request[]) ?? []))
  }, [supabase, profileId])

  if (requests === null || requests.length === 0) return null

  async function accept(requesterId: string) {
    setActing(requesterId)
    await acceptFollowRequest(requesterId)
    setRequests(prev => prev?.filter(r => r.requester_id !== requesterId) ?? [])
    router.refresh()
    setActing(null)
  }

  async function decline(requesterId: string) {
    setActing(requesterId)
    await declineFollowRequest(requesterId)
    setRequests(prev => prev?.filter(r => r.requester_id !== requesterId) ?? [])
    setActing(null)
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-sm font-bold text-zinc-200">
        🔒 Solicitações de seguir
        <span className="ml-2 rounded-full bg-[#D4537E] px-2 py-0.5 text-xs font-semibold text-white">
          {requests.length}
        </span>
      </h2>

      <ul className="divide-y divide-zinc-800">
        {requests.map(req => {
          const r    = req.requester
          if (!r) return null
          const name = r.display_name || r.username
          const busy = acting === req.requester_id

          return (
            <li key={req.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Link href={`/profile/${r.username}`} className="shrink-0">
                <Avatar src={r.avatar_url} name={name} size="md" />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${r.username}`}
                  className="block truncate text-sm font-semibold text-zinc-200 hover:underline"
                >
                  {name}
                </Link>
                <p className="truncate text-xs text-zinc-500">@{r.username}</p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => void accept(req.requester_id)}
                  disabled={busy}
                  className="rounded-lg bg-[#D4537E] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#c04470] disabled:opacity-50"
                >
                  {busy ? '…' : 'Aceitar'}
                </button>
                <button
                  type="button"
                  onClick={() => void decline(req.requester_id)}
                  disabled={busy}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-50"
                >
                  Recusar
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
