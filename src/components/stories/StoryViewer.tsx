'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { relativeTime } from '@/lib/utils'
import type { StoryGroup } from '@/types'

const DURATION_MS = 5000

type Props = {
  groups:            StoryGroup[]
  initialGroupIndex: number
  currentUserId:     string
  viewedIds:         Set<string>
  onMarkViewed:      (storyId: string) => void
  onStoryDeleted:    (storyId: string) => void
  onClose:           () => void
}

export default function StoryViewer({
  groups: initialGroups,
  initialGroupIndex,
  currentUserId,
  viewedIds,
  onMarkViewed,
  onStoryDeleted,
  onClose,
}: Props) {
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  // Local mutable copy of groups so deletions can update it without a round-trip
  const [groups,    setGroups]    = useState(initialGroups)
  const [groupIdx,  setGroupIdx]  = useState(() => Math.min(initialGroupIndex, initialGroups.length - 1))
  const [storyIdx,  setStoryIdx]  = useState(() => {
    const g = initialGroups[Math.min(initialGroupIndex, initialGroups.length - 1)]
    const first = g?.stories.findIndex(s => !viewedIds.has(s.id)) ?? -1
    return first >= 0 ? first : 0
  })
  const [animating,        setAnimating]        = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting,         setDeleting]         = useState(false)

  // Refs so stable callbacks always read the latest values
  const groupIdxRef = useRef(groupIdx)
  const storyIdxRef = useRef(storyIdx)
  const groupsRef   = useRef(groups)
  useEffect(() => { groupIdxRef.current = groupIdx }, [groupIdx])
  useEffect(() => { storyIdxRef.current = storyIdx }, [storyIdx])
  useEffect(() => { groupsRef.current = groups },     [groups])

  const group = groups[groupIdx]
  const story = group?.stories[storyIdx]

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    const gi = groupIdxRef.current
    const si = storyIdxRef.current
    const gs = groupsRef.current
    const g  = gs[gi]
    if (!g) { onClose(); return }

    if (si < g.stories.length - 1) {
      // Next story in same group
      setStoryIdx(si + 1)
    } else if (gi < gs.length - 1) {
      // First story of next group
      setGroupIdx(gi + 1)
      setStoryIdx(0)
    } else {
      onClose()
    }
  }, [onClose])

  const goPrev = useCallback(() => {
    const gi = groupIdxRef.current
    const si = storyIdxRef.current
    const gs = groupsRef.current

    if (si > 0) {
      setStoryIdx(si - 1)
    } else if (gi > 0) {
      // Last story of previous group
      const prevGroup = gs[gi - 1]
      setGroupIdx(gi - 1)
      setStoryIdx(prevGroup.stories.length - 1)
    }
    // At very first story: do nothing
  }, [])

  // ── Progress bar animation + auto-advance ──────────────────────────────────

  useEffect(() => {
    setAnimating(false)
    setConfirmingDelete(false)
    const t1 = setTimeout(() => setAnimating(true), 50)
    const t2 = setTimeout(goNext, DURATION_MS)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [groupIdx, storyIdx, goNext])

  // ── Mark story as viewed ───────────────────────────────────────────────────

  useEffect(() => {
    if (!story) return
    onMarkViewed(story.id)
    void supabase
      .from('story_views')
      .upsert(
        { story_id: story.id, user_id: currentUserId },
        { onConflict: 'story_id,user_id', ignoreDuplicates: true },
      )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdx, storyIdx])

  // ── Keyboard navigation ────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')     { if (confirmingDelete) setConfirmingDelete(false); else onClose() }
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft')  goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goNext, goPrev, confirmingDelete])

  // ── Delete own story ───────────────────────────────────────────────────────

  async function handleDeleteStory() {
    if (!story) return
    setDeleting(true)

    const { error } = await supabase.from('stories').delete().eq('id', story.id)

    if (!error) {
      onStoryDeleted(story.id)

      const newStories = group.stories.filter(s => s.id !== story.id)

      if (newStories.length === 0) {
        // This group is now empty — remove it and navigate
        const newGroups = groups.filter((_, gi) => gi !== groupIdx)
        if (newGroups.length === 0) { onClose(); return }
        setGroups(newGroups)
        const nextGi = Math.min(groupIdx, newGroups.length - 1)
        setGroupIdx(nextGi)
        setStoryIdx(0)
      } else {
        // Stay in this group, clamp storyIdx
        const newGroups = groups.map((g, gi) =>
          gi === groupIdx ? { ...g, stories: newStories } : g,
        )
        setGroups(newGroups)
        setStoryIdx(Math.min(storyIdx, newStories.length - 1))
      }
    }

    setDeleting(false)
    setConfirmingDelete(false)
  }

  if (!story || !group) return null

  const profile        = story.profiles
  const name           = profile.display_name || profile.username
  const isOwnStory     = story.user_id === currentUserId
  const groupStories   = group.stories

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black"
      role="dialog"
      aria-modal
      aria-label={`História de ${name}`}
    >
      {/* Story container — full screen on mobile, max 420px on desktop */}
      <div className="relative h-full w-full max-w-[420px] overflow-hidden">

        {/* ── Story image ─────────────────────────────────────────── */}
        <img
          key={story.id}
          src={story.media_url}
          alt={`História de ${name}`}
          className="h-full w-full object-contain"
          draggable={false}
        />

        {/* Top gradient for UI legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/80 to-transparent" />

        {/* Bottom gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />

        {/* ── Progress bars — one per story in this group (z-30) ── */}
        <div key={`${groupIdx}-${storyIdx}`} className="absolute inset-x-0 top-0 z-30 flex gap-[3px] px-2 pt-2">
          {groupStories.map((_, i) => (
            <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: i < storyIdx ? '100%' : '0%',
                  ...(i === storyIdx && {
                    width:      animating ? '100%' : '0%',
                    transition: animating ? `width ${DURATION_MS}ms linear` : 'none',
                  }),
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Author info + close (z-30) ──────────────────────────── */}
        <div className="absolute inset-x-0 top-6 z-30 flex items-center gap-2 px-3 pt-1">
          <Avatar src={profile.avatar_url} name={name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-white">{name}</p>
            <p className="text-[10px] text-white/60">{relativeTime(story.created_at)}</p>
          </div>

          {/* Trash — only on own stories */}
          {isOwnStory && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true) }}
              aria-label="Deletar história"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Tap zones: left = prev, right = next (z-20, below UI) ── */}
        <div className="absolute inset-0 z-20 flex" aria-hidden>
          <div className="flex-1 cursor-pointer" onClick={goPrev} />
          <div className="flex-1 cursor-pointer" onClick={goNext} />
        </div>

        {/* ── Inline delete confirmation (z-40, above tap zones) ── */}
        {confirmingDelete && (
          <div
            className="absolute inset-0 z-40 flex items-end justify-center pb-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-4 w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900/95 p-5 text-center shadow-2xl backdrop-blur-sm">
              <p className="mb-4 text-sm text-zinc-200">Deletar esta história?</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-zinc-800 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStory}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-[#D4537E] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c0446e] disabled:opacity-50"
                >
                  {deleting ? '…' : 'Deletar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Black bars on either side on wide screens */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 -z-10 bg-black" />
    </div>,
    document.body,
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
