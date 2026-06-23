'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { CommunityMemberRow, CommunityRole } from '@/types'
import { updateMemberRole, updateMemberCanPost, removeMember } from '@/app/(app)/communities/actions'

interface Props {
  communityId:    string
  members:        CommunityMemberRow[]
  currentUserId:  string | null
  viewerRole:     CommunityRole | null
  postPermission: string
}

const ROLE_LABEL: Record<CommunityRole, string> = {
  owner:     '👑 Dono',
  moderator: '🛡️ Mod',
  member:    'Membro',
}

export default function MembersTab({ communityId, members: initial, currentUserId, viewerRole, postPermission }: Props) {
  const [members, setMembers] = useState<CommunityMemberRow[]>(initial)
  const canManage       = viewerRole === 'owner' || viewerRole === 'moderator'
  const isOwner         = viewerRole === 'owner'
  const showCanPostCtrl = isOwner && postPermission === 'allowed_users'

  async function handleRoleChange(userId: string, role: CommunityRole) {
    await updateMemberRole(communityId, userId, role)
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role } : m))
  }

  async function handleCanPostToggle(userId: string, canPost: boolean) {
    await updateMemberCanPost(communityId, userId, canPost)
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, can_post: canPost } : m))
  }

  async function handleRemove(userId: string) {
    await removeMember(communityId, userId)
    setMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  if (members.length === 0) {
    return <p className="text-zinc-500 text-sm text-center py-10">Nenhum membro ainda.</p>
  }

  return (
    <div className="space-y-2">
      {members.map(m => {
        const profile = m.profiles
        if (!profile) return null
        const isMe = m.user_id === currentUserId

        return (
          <div key={m.user_id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <Link href={`/profile/${profile.username}`}>
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name ?? profile.username}
                  width={36} height={36}
                  className="rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#7F77DD] flex items-center justify-center text-white text-sm shrink-0">
                  {(profile.display_name ?? profile.username)[0].toUpperCase()}
                </div>
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/profile/${profile.username}`} className="text-sm font-semibold text-white hover:underline">
                {profile.display_name ?? profile.username}
              </Link>
              <p className="text-xs text-zinc-500">@{profile.username}</p>
            </div>

            <span className="text-xs text-zinc-400 shrink-0">{ROLE_LABEL[m.role]}</span>

            {canManage && !isMe && m.role !== 'owner' && (
              <div className="flex items-center gap-3 shrink-0">
                {/* Role selector — owner only */}
                {isOwner && (
                  <select
                    value={m.role}
                    onChange={e => handleRoleChange(m.user_id, e.target.value as CommunityRole)}
                    className="rounded bg-white/10 px-1 py-0.5 text-xs text-zinc-300"
                  >
                    <option value="member">Membro</option>
                    <option value="moderator">Moderador</option>
                  </select>
                )}

                {/* Can-post toggle — owner only, and only in 'allowed_users' mode */}
                {showCanPostCtrl && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500">Postar</span>
                    <button
                      role="switch"
                      aria-checked={m.can_post}
                      onClick={() => handleCanPostToggle(m.user_id, !m.can_post)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        m.can_post ? 'bg-[#D4537E]' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          m.can_post ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleRemove(m.user_id)}
                  className="text-xs text-zinc-600 hover:text-red-400"
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
