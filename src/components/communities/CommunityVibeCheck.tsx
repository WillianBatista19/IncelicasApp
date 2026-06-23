'use client'

import { useCommunityVibeCheck } from '@/hooks/useCommunityVibeCheck'
import type { CommunityVibe, VibeType } from '@/types'

const VIBES: { type: VibeType; emoji: string; label: string }[] = [
  { type: 'serving', emoji: '🔥', label: 'Serving' },
  { type: 'morrei',  emoji: '💀', label: 'Morrei'  },
  { type: 'iconic',  emoji: '👑', label: 'Iconic'  },
  { type: 'cha',     emoji: '☕', label: 'Chá'     },
  { type: 'hype',    emoji: '🌊', label: 'No Hype' },
]

interface Props {
  postId:         string
  initialVibes:   CommunityVibe[]
  currentUserId:  string | null
  onCountClick?:  () => void
}

export default function CommunityVibeCheck({ postId, initialVibes, currentUserId, onCountClick }: Props) {
  const { counts, myVibe, pending, react, total } = useCommunityVibeCheck(postId, initialVibes, currentUserId)

  return (
    <div className="flex flex-wrap gap-2">
      {VIBES.map(({ type, emoji, label }) => {
        const active = myVibe?.type === type
        return (
          <button
            key={type}
            onClick={() => react(type)}
            disabled={pending || !currentUserId}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors
              ${active
                ? 'bg-[#D4537E] text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              } disabled:opacity-50`}
            title={label}
          >
            <span>{emoji}</span>
            {counts[type] > 0 && <span className="text-xs">{counts[type]}</span>}
          </button>
        )
      })}
      {total > 0 && (
        <button
          type="button"
          onClick={onCountClick}
          className="flex items-center text-xs text-zinc-500 ml-1 hover:text-zinc-300 transition-colors"
        >
          {total} vibes
        </button>
      )}
    </div>
  )
}
