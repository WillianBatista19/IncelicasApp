'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getOrCreateConversation } from '@/app/(app)/messages/actions'
import Avatar from '@/components/Avatar'
import FollowButton from '@/components/profile/FollowButton'
import FollowListModal from '@/components/profile/FollowListModal'
import StoryViewer from '@/components/stories/StoryViewer'
import VerifiedBadge from '@/components/VerifiedBadge'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import { isVerified } from '@/lib/verified'
import type { Story, StoryGroup } from '@/types'

type Profile = {
  id:           string
  username:     string
  display_name: string | null
  avatar_url:   string | null
  bio:          string | null
}

type Props = {
  profile:               Profile
  currentUserId:         string
  currentUserUsername?:  string | null
  isOwnProfile:          boolean
  isPrivate?:            boolean
  contentBlocked?:       boolean
  pendingRequestId?:     string | null
  postCount:             number
  initialFollowerCount:  number
  followingCount:        number
  openStory?:            boolean
  awaitedAlbumName?:     string | null
}

export default function ProfileInteractive({
  profile,
  currentUserId,
  currentUserUsername,
  isOwnProfile,
  isPrivate = false,
  contentBlocked = false,
  pendingRequestId = null,
  postCount,
  initialFollowerCount,
  followingCount,
  openStory = false,
  awaitedAlbumName = null,
}: Props) {
  const router = useRouter()
  const { signOut } = useUser()
  const [msgLoading,     setMsgLoading]     = useState(false)
  const [followerCount,  setFollowerCount]  = useState(initialFollowerCount)
  const [activeModal,    setActiveModal]    = useState<'followers' | 'following' | null>(null)
  const [storyGroup,     setStoryGroup]     = useState<StoryGroup | null>(null)
  const [viewerOpen,     setViewerOpen]     = useState(false)
  const [viewedIds,      setViewedIds]      = useState<Set<string>>(new Set())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mobileMenuOpen) return
    function handleOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [mobileMenuOpen])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('stories')
      .select('id, user_id, media_url, created_at, expires_at, profiles!stories_user_id_fkey(id, username, display_name, avatar_url)')
      .eq('user_id', profile.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setStoryGroup({
            user: {
              id:           profile.id,
              username:     profile.username,
              display_name: profile.display_name ?? null,
              avatar_url:   profile.avatar_url   ?? null,
            },
            stories: data as unknown as Story[],
          })
        }
      })
  }, [profile.id, profile.username, profile.display_name, profile.avatar_url])

  useEffect(() => {
    if (openStory && storyGroup) setViewerOpen(true)
  }, [openStory, storyGroup])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  function handleFollowChange(isNowFollowing: boolean) {
    setFollowerCount(c => (isNowFollowing ? c + 1 : c - 1))
  }

  const name = profile.display_name || profile.username

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">

      {/* Avatar row */}
      <div className="flex items-start justify-between gap-4">
        {storyGroup ? (
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            aria-label={`Ver história de ${name}`}
            className="shrink-0 rounded-full bg-gradient-to-tr from-[#D4537E] to-[#7F77DD] p-[3px]"
          >
            <div className="rounded-full bg-zinc-900 p-[2px]">
              <Avatar src={profile.avatar_url} name={name} size="lg" />
            </div>
          </button>
        ) : (
          <div className="shrink-0">
            <Avatar src={profile.avatar_url} name={name} size="lg" />
          </div>
        )}

        {isOwnProfile ? (
          <>
            {/* Mobile: three-dots dropdown (md:hidden) */}
            <div className="relative md:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label="Mais opções"
                className="rounded-xl border border-zinc-700 p-2 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
              {mobileMenuOpen && (
                <div className="absolute right-0 top-full z-20 mt-1.5 w-44 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                  <Link
                    href="/profile/edit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    ✏️ Editar perfil
                  </Link>
                  <Link
                    href={`/profile/${profile.username}/saved`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    🔖 Posts salvos
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); void handleSignOut() }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-zinc-800"
                  >
                    🚪 Sair
                  </button>
                </div>
              )}
            </div>

            {/* Desktop: original buttons (hidden on mobile) */}
            <div className="hidden md:flex md:items-center md:gap-2">
              <Link
                href="/profile/edit"
                className="rounded-xl border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-400 hover:text-zinc-100"
              >
                Editar perfil
              </Link>
              <Link
                href={`/profile/${profile.username}/saved`}
                className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
              >
                🔖 Salvos
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sair"
                className="xl:hidden rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:border-red-800 hover:bg-red-950/40 hover:text-red-400"
              >
                Sair
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <FollowButton
              targetUserId={profile.id}
              currentUserId={currentUserId}
              isPrivate={isPrivate}
              pendingRequestId={pendingRequestId}
              onFollowChange={handleFollowChange}
            />
            <button
              type="button"
              disabled={msgLoading}
              onClick={async () => {
                setMsgLoading(true)
                try {
                  const result = await getOrCreateConversation(profile.id)
                  console.log('[Mensagem] result:', result)
                  if ('conversationId' in result) {
                    router.push(`/messages/${result.conversationId}`)
                  }
                } finally {
                  setMsgLoading(false)
                }
              }}
              className="rounded-xl border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-400 hover:text-zinc-100 disabled:opacity-50"
            >
              {msgLoading ? '…' : '💬 Mensagem'}
            </button>
          </div>
        )}
      </div>

      {/* Name + username */}
      <div className="mt-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
          {name}
          {isVerified(profile.username) && <VerifiedBadge className="h-5 w-5" />}
          {isPrivate && <span className="text-base text-zinc-500" title="Perfil privado">🔒</span>}
        </h1>
        <p className="text-sm text-zinc-500">@{profile.username}</p>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{profile.bio}</p>
      )}

      {/* Awaited album badge */}
      {awaitedAlbumName && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#D4537E]/30 bg-[#D4537E]/10 px-3 py-1 text-xs text-[#D4537E]">
          ⏳ Aguardando: {awaitedAlbumName}
        </div>
      )}

      {/* Stats — followers and following are clickable unless content is blocked */}
      <div className="mt-5 flex gap-6 border-t border-zinc-800 pt-4">
        <Stat value={postCount} label="Posts" />

        {contentBlocked ? (
          <Stat value={followerCount} label="Seguidores" />
        ) : (
          <button
            type="button"
            onClick={() => setActiveModal('followers')}
            className="text-left transition-opacity hover:opacity-70"
          >
            <Stat value={followerCount} label="Seguidores" />
          </button>
        )}

        {contentBlocked ? (
          <Stat value={followingCount} label="Seguindo" />
        ) : (
          <button
            type="button"
            onClick={() => setActiveModal('following')}
            className="text-left transition-opacity hover:opacity-70"
          >
            <Stat value={followingCount} label="Seguindo" />
          </button>
        )}
      </div>

      {activeModal && (
        <FollowListModal
          type={activeModal}
          profileId={profile.id}
          currentUserId={currentUserId}
          isOwnProfile={isOwnProfile}
          onFollowerRemoved={() => setFollowerCount(c => c - 1)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {viewerOpen && storyGroup && (
        <StoryViewer
          groups={[storyGroup]}
          initialGroupIndex={0}
          currentUserId={currentUserId}
          currentUserUsername={currentUserUsername}
          viewedIds={viewedIds}
          onMarkViewed={(storyId) => {
            setViewedIds(prev => { const n = new Set(prev); n.add(storyId); return n })
          }}
          onStoryDeleted={(storyId) => {
            setStoryGroup(prev => {
              if (!prev) return null
              const remaining = prev.stories.filter(s => s.id !== storyId)
              return remaining.length > 0 ? { ...prev, stories: remaining } : null
            })
            setViewerOpen(false)
          }}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-zinc-100">{value.toLocaleString('pt-BR')}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  )
}
