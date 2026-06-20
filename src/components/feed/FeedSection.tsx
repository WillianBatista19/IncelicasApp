import StoriesBar from '@/components/stories/StoriesBar'
import PostComposer from '@/components/feed/PostComposer'
import FeedClient from '@/components/feed/FeedClient'
import type { Profile } from '@/types'

type Props = {
  currentUserId: string
  profile:       Profile
}

export default function FeedSection({ currentUserId, profile }: Props) {
  return (
    <div className="space-y-4">
      <StoriesBar currentUserId={currentUserId} />
      <PostComposer profile={profile} />
      <FeedClient currentUserId={currentUserId} />
    </div>
  )
}
