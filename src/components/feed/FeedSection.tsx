import ComposerForm from '@/components/feed/ComposerForm'
import HashtagFilter from '@/components/feed/HashtagFilter'
import FeedClient from '@/components/feed/FeedClient'

type Props = {
  currentUserId: string
  createPost:    (fd: FormData) => Promise<void>
}

// Server component — no client state needed now that category filtering is hashtag-page-based
export default function FeedSection({ currentUserId, createPost }: Props) {
  return (
    <div className="space-y-4">
      <ComposerForm action={createPost} />
      <HashtagFilter />
      <FeedClient currentUserId={currentUserId} />
    </div>
  )
}
