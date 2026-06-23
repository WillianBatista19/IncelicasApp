'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Community, CommunityMemberRow, CommunityPost, CommunityRole } from '@/types'
import CommunityPostCard from './CommunityPostCard'
import CommunityPostComposer from './CommunityPostComposer'
import MembersTab from './MembersTab'
import JoinButton from './JoinButton'

type Tab = 'posts' | 'members'

interface Props {
  community:     Community
  posts:         CommunityPost[]
  members:       CommunityMemberRow[]
  currentUserId: string | null
  viewerRole:    CommunityRole | null
  canPost:       boolean
}

export default function CommunityPageClient({
  community, posts, members, currentUserId, viewerRole, canPost,
}: Props) {
  const router        = useRouter()
  const [tab, setTab] = useState<Tab>('posts')

  const isMember = !!viewerRole
  const isOwner  = viewerRole === 'owner'

  function handleNewPost() {
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl overflow-hidden bg-white/5">
        {community.banner_url && (
          <div
            className="h-32 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${community.banner_url})` }}
          />
        )}
        <div className="p-4 flex items-start gap-3">
          {community.avatar_url ? (
            <img
              src={community.avatar_url}
              alt={community.name}
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#7F77DD]/30 flex items-center justify-center text-2xl shrink-0">
              🏘️
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white">{community.name}</h1>
            {community.description && (
              <p className="text-sm text-zinc-400 mt-0.5">{community.description}</p>
            )}
            <p className="text-xs text-zinc-500 mt-1">{members.length} membros</p>
          </div>
          {currentUserId && (
            <div className="flex items-center gap-2 shrink-0">
              {isOwner && (
                <a
                  href={`/communities/${community.slug}/settings`}
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm text-zinc-300 hover:text-white"
                >
                  ⚙️
                </a>
              )}
              <JoinButton communityId={community.id} isMember={isMember} isOwner={isOwner} />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {(['posts', 'members'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition
              ${tab === t ? 'text-[#D4537E] border-b-2 border-[#D4537E]' : 'text-zinc-400 hover:text-white'}`}
          >
            {t === 'posts' ? 'Posts' : `Membros (${members.length})`}
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <div className="space-y-4">
          {canPost && (
            <CommunityPostComposer communityId={community.id} onPost={handleNewPost} />
          )}
          {posts.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-10">
              Nenhum post ainda. Seja a primeira a postar!
            </p>
          ) : (
            posts.map(p => (
              <CommunityPostCard
                key={p.id}
                post={p}
                currentUserId={currentUserId}
                isOwnerOrMod={viewerRole === 'owner' || viewerRole === 'moderator'}
              />
            ))
          )}
        </div>
      )}

      {tab === 'members' && (
        <MembersTab
          communityId={community.id}
          members={members}
          currentUserId={currentUserId}
          viewerRole={viewerRole}
          postPermission={community.post_permission}
        />
      )}
    </div>
  )
}
