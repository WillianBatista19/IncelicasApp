'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { useModalLock } from '@/hooks/useModalLock'

type Viewer = {
  display_name: string | null
  username:     string
  avatar_url:   string | null
}

type Props = {
  storyId:      string
  storyOwnerId: string
  onClose:      () => void
}

export default function StoryViewersModal({ storyId, storyOwnerId, onClose }: Props) {
  const supabase              = useMemo(() => createClient(), [])
  const [viewers, setViewers] = useState<Viewer[]>([])
  const [loading, setLoading] = useState(true)

  useModalLock(true)

  useEffect(() => {
    async function load() {
      // Step 1: get viewer user_ids ordered by most recent view.
      // Avoids PostgREST FK-join so it works regardless of FK setup.
      const { data: views, error: viewsErr } = await supabase
        .from('story_views')
        .select('user_id, created_at')
        .eq('story_id', storyId)
        .neq('user_id', storyOwnerId)
        .order('created_at', { ascending: false })

      if (viewsErr) {
        console.error('[StoryViewersModal] views error:', viewsErr.message)
        setLoading(false)
        return
      }

      if (!views || views.length === 0) {
        setViewers([])
        setLoading(false)
        return
      }

      // Step 2: fetch profiles for those user_ids
      const userIds = views.map(v => v.user_id as string)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', userIds)

      const profileMap = Object.fromEntries(
        (profiles ?? []).map(p => [p.id as string, p as Viewer]),
      )

      // Preserve view order (most recent first)
      setViewers(
        userIds.map(id => profileMap[id]).filter((p): p is Viewer => Boolean(p)),
      )
      setLoading(false)
    }

    void load()
  }, [supabase, storyId, storyOwnerId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            {loading
              ? 'Visualizações'
              : `${viewers.length} ${viewers.length === 1 ? 'visualização' : 'visualizações'}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-4 w-4" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto">
          {loading ? (
            <p className="py-10 text-center text-xs text-zinc-600">Carregando…</p>
          ) : viewers.length === 0 ? (
            <p className="py-10 text-center text-xs text-zinc-600">Nenhuma visualização ainda.</p>
          ) : (
            viewers.map((v, i) => (
              <Link
                key={i}
                href={`/profile/${v.username}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-800/60"
              >
                <Avatar src={v.avatar_url} name={v.display_name || v.username} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-100">{v.display_name || v.username}</p>
                  <p className="truncate text-xs text-zinc-500">@{v.username}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
