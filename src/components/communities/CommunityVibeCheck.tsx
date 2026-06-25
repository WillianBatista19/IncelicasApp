'use client'

import { useCommunityVibeCheck } from '@/hooks/useCommunityVibeCheck'
import type { CommunityVibe, VibeType } from '@/types'

const VIBES: { type: VibeType; emoji: string; label: string }[] = [
  { type: 'serving',  emoji: '🔥',    label: 'Serving'   },
  { type: 'morrei',   emoji: '💀',    label: 'Morri'     },
  { type: 'iconic',   emoji: '👑',    label: 'Iconic'    },
  { type: 'tomate',   emoji: '🍅',    label: 'Tomate'    },
  { type: 'coco',     emoji: '💩',    label: 'Cocô'      },
  { type: 'gag',      emoji: '🤯',    label: 'Gag'       },
  { type: 'old',      emoji: '🦕',    label: 'Old'       },
  { type: 'sixseven', emoji: '6️⃣7️⃣', label: 'Six Seven' },
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
    <div className="space-y-1.5">
      {/* Mobile: 2×4 grid  |  Desktop: flex wrap */}
      <div className="grid grid-cols-4 gap-1 md:flex md:flex-wrap md:gap-1.5">
        {VIBES.map(({ type, emoji, label }) => {
          const active = myVibe?.type === type
          return (
            <button
              key={type}
              onClick={() => react(type)}
              disabled={pending || !currentUserId}
              title={label}
              className={[
                'flex w-full items-center justify-center gap-1 rounded-full px-2 py-1 text-sm transition-colors',
                'md:w-auto md:px-3',
                active
                  ? 'bg-[#D4537E] text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white',
                'disabled:opacity-50',
              ].join(' ')}
            >
              <span>{emoji}</span>
              {counts[type] > 0 && <span className="text-xs tabular-nums">{counts[type]}</span>}
            </button>
          )
        })}
      </div>

      {total > 0 && (
        <button
          type="button"
          onClick={onCountClick}
          className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          {total} vibes
        </button>
      )}
    </div>
  )
}
