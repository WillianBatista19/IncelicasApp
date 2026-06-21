import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileInteractive from '@/components/profile/ProfileInteractive'
import PostGrid from '@/components/profile/PostGrid'
import LastfmWidget from '@/components/profile/LastfmWidget'
import MediaNowWidgets from '@/components/profile/MediaNowWidgets'
import SteamWidget from '@/components/profile/SteamWidget'
import GoodreadsWidget from '@/components/profile/GoodreadsWidget'
import type { WatchingNow, ReadingNow } from '@/types'

type Props = {
  params: { username: string }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { username } = params

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, created_at, lastfm_username, watching_now, reading_now, anime_title, anime_cover_url, steam_id, goodreads_book_title, goodreads_book_author, goodreads_cover_url, goodreads_rating')
    .eq('username', username)
    .single()

  if (profileError) {
    // PGRST116 = row not found (single() with no match) → genuine 404
    // Any other code = DB/column error → throw so it surfaces in logs
    if (profileError.code !== 'PGRST116') throw new Error(`[profile] DB error: ${profileError.message} (${profileError.code})`)
    notFound()
  }
  if (!profile) notFound()

  // watching_now and reading_now are stored as text JSON in Postgres;
  // parse them when Supabase returns a string instead of an object.
  function parseJson<T>(raw: unknown): T | null {
    if (!raw) return null
    if (typeof raw === 'string') { try { return JSON.parse(raw) as T } catch { return null } }
    return raw as T
  }

  const watching = parseJson<WatchingNow>(profile.watching_now)
  const reading  = parseJson<ReadingNow>(profile.reading_now)

  const isOwnProfile = user.id === profile.id

  const [postsRes, followersRes, followingRes] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id),
    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
  ])

  const postCount      = postsRes.count      ?? 0
  const followerCount  = followersRes.count  ?? 0
  const followingCount = followingRes.count  ?? 0

  return (
    <div className="space-y-4 pb-12">
      <ProfileInteractive
        profile={profile}
        currentUserId={user.id}
        isOwnProfile={isOwnProfile}
        postCount={postCount}
        initialFollowerCount={followerCount}
        followingCount={followingCount}
      />
      <MediaNowWidgets
        watching={watching}
        reading={reading}
        animeTitle={profile.anime_title    as string | null}
        animeCoverUrl={profile.anime_cover_url as string | null}
      />
      {profile.goodreads_book_title && (
        <GoodreadsWidget
          title={profile.goodreads_book_title  as string}
          author={profile.goodreads_book_author as string | null}
          coverUrl={profile.goodreads_cover_url  as string | null}
          rating={profile.goodreads_rating       as number | null}
        />
      )}
      {profile.steam_id && (
        <SteamWidget steamId={profile.steam_id} />
      )}
      {profile.lastfm_username && (
        <LastfmWidget username={profile.lastfm_username} />
      )}
      <PostGrid
        userId={profile.id}
        displayName={profile.display_name || profile.username}
        currentUserId={user.id}
      />
    </div>
  )
}
