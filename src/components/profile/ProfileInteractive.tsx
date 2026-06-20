'use client'

import { useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import FollowButton from '@/components/profile/FollowButton'

type Profile = {
  id:           string
  username:     string
  display_name: string | null
  avatar_url:   string | null
  bio:          string | null
}

type Props = {
  profile:              Profile
  currentUserId:        string
  isOwnProfile:         boolean
  postCount:            number
  initialFollowerCount: number
  followingCount:       number
}

export default function ProfileInteractive({
  profile,
  currentUserId,
  isOwnProfile,
  postCount,
  initialFollowerCount,
  followingCount,
}: Props) {
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)

  function handleFollowChange(isNowFollowing: boolean) {
    setFollowerCount(c => (isNowFollowing ? c + 1 : c - 1))
  }

  const name = profile.display_name || profile.username

  return (
    <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">

      {/* Avatar row */}
      <div className="flex items-start justify-between gap-4">
        <Avatar src={profile.avatar_url} name={name} size="lg" />

        {isOwnProfile ? (
          <Link
            href="/profile/edit"
            className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-400 hover:text-zinc-100"
          >
            Editar perfil
          </Link>
        ) : (
          <FollowButton
            targetUserId={profile.id}
            currentUserId={currentUserId}
            onFollowChange={handleFollowChange}
          />
        )}
      </div>

      {/* Name + username */}
      <div className="mt-4">
        <h1 className="text-xl font-bold text-zinc-100">{name}</h1>
        <p className="text-sm text-zinc-500">@{profile.username}</p>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{profile.bio}</p>
      )}

      {/* Stats */}
      <div className="mt-5 flex gap-6 border-t border-zinc-800 pt-4">
        <Stat value={postCount}      label="Posts"      />
        <Stat value={followerCount}  label="Seguidores" />
        <Stat value={followingCount} label="Seguindo"   />
      </div>
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
