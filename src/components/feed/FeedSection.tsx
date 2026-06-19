'use client'

import { useState } from 'react'
import ComposerForm from '@/components/feed/ComposerForm'
import CategoryFilter from '@/components/feed/CategoryFilter'
import FeedClient from '@/components/feed/FeedClient'
import type { Category } from '@/types'

type Props = {
  currentUserId: string
  createPost:    (fd: FormData) => Promise<void>
}

export default function FeedSection({ currentUserId, createPost }: Props) {
  const [category, setCategory] = useState<Category | null>(null)

  return (
    <div className="space-y-4">
      <ComposerForm action={createPost} />
      <CategoryFilter selected={category} onSelect={setCategory} />
      <FeedClient currentUserId={currentUserId} category={category} />
    </div>
  )
}
