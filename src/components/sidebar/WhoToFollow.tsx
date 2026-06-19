import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'
import FollowButton from '@/components/profile/FollowButton'
import type { Profile } from '@/types'

type Props = { currentUserId: string }

export default async function WhoToFollow({ currentUserId }: Props) {
  const supabase = await createClient()

  // Get IDs the current user already follows
  const { data: followList } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId)

  const followedIds = new Set(followList?.map((f) => f.following_id) ?? [])

  // Fetch a batch of other profiles, then filter client-side
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .neq('id', currentUserId)
    .order('created_at', { ascending: false })
    .limit(30)

  const suggestions = (profiles as Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>[] | null)
    ?.filter((p) => !followedIds.has(p.id))
    .slice(0, 5) ?? []

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
        👑 Quem seguir
      </h2>

      {suggestions.length === 0 ? (
        <p className="text-xs text-zinc-600">
          Você já segue todo mundo por aqui!
        </p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((profile) => {
            const name = profile.display_name || profile.username
            return (
              <li key={profile.id} className="flex items-center gap-2.5">
                <Link href={`/profile/${profile.username}`} className="shrink-0">
                  <Avatar src={profile.avatar_url} name={name} size="sm" />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${profile.username}`}
                    className="block truncate text-sm font-semibold text-zinc-200 hover:text-zinc-100 transition-colors"
                  >
                    {name}
                  </Link>
                  <p className="truncate text-xs text-zinc-500">@{profile.username}</p>
                </div>

                <FollowButton
                  targetUserId={profile.id}
                  initialIsFollowing={false}
                  currentUserId={currentUserId}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
