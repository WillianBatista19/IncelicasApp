import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'
import FollowButton from '@/components/profile/FollowButton'
import PostGrid from '@/components/profile/PostGrid'

type Props = {
  params: { username: string }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { username } = params

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, created_at')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const isOwnProfile = user.id === profile.id

  // Fetch counts + follow state in parallel
  const [postsRes, followersRes, followingRes, followCheck] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
    !isOwnProfile
      ? supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const postCount      = postsRes.count      ?? 0
  const followerCount  = followersRes.count  ?? 0
  const followingCount = followingRes.count  ?? 0
  const isFollowing    = !!followCheck.data

  const name = profile.display_name || profile.username

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12">

      {/* Profile header card */}
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
              initialIsFollowing={isFollowing}
              currentUserId={user.id}
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

      {/* Posts */}
      <PostGrid
        userId={profile.id}
        displayName={name}
        currentUserId={user.id}
      />
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
