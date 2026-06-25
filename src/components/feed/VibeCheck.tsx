'use client'

import { useVibeCheck } from '@/hooks/useVibeCheck'
import type { Vibe, VibeType } from '@/types'

// ─── vibe config (active UI vibes — cha/hype are legacy, not shown) ───────────

type VibeDef = {
  type:        VibeType
  emoji:       string
  label:       string
  activeTitle: string
  addTitle:    string
}

const VIBES: VibeDef[] = [
  { type: 'serving',  emoji: '🔥',    label: 'Serving',   activeTitle: 'Você achou uma brasa — clique para remover',    addTitle: 'Esse post é uma brasa'   },
  { type: 'morrei',   emoji: '💀',    label: 'Morri',     activeTitle: 'Você morreu — clique para remover',             addTitle: 'Morri nesse post'        },
  { type: 'iconic',   emoji: '👑',    label: 'Iconic',    activeTitle: 'Você coroou — clique para remover',             addTitle: 'Esse post é iconic'      },
  { type: 'tomate',   emoji: '🍅',    label: 'Tomate',    activeTitle: 'Você jogou um tomate — clique para remover',    addTitle: 'Jogar um tomate'         },
  { type: 'coco',     emoji: '💩',    label: 'Cocô',      activeTitle: 'Você deixou um cocô — clique para remover',     addTitle: 'Deixar um cocô'          },
  { type: 'gag',      emoji: '🤯',    label: 'Gag',       activeTitle: 'Você ficou gag — clique para remover',          addTitle: 'Fiquei gag'              },
  { type: 'old',      emoji: '🦕',    label: 'Old',       activeTitle: 'Você achou old — clique para remover',          addTitle: 'Que old'                 },
  { type: 'sixseven', emoji: '6️⃣7️⃣', label: 'Six Seven', activeTitle: 'Você deu six seven — clique para remover',      addTitle: 'Dar six seven'           },
]

// ─── component ────────────────────────────────────────────────────────────────

type Props = {
  postId:         string
  initialVibes:   Vibe[]
  currentUserId:  string | null
  onShowVibes?:   () => void
}

export default function VibeCheck({ postId, initialVibes, currentUserId, onShowVibes }: Props) {
  const { counts, myVibe, pending, react, total } = useVibeCheck(
    postId,
    initialVibes,
    currentUserId,
  )

  const loggedIn = Boolean(currentUserId)

  return (
    <div className="space-y-1.5">
      {/* Mobile: 2×4 grid  |  Desktop: single flex row */}
      <div className="grid grid-cols-4 gap-1 md:flex md:flex-wrap md:gap-1.5">
        {VIBES.map(({ type, emoji, label, activeTitle, addTitle }) => {
          const active = myVibe?.type === type
          const count  = counts[type]
          return (
            <VibeButton
              key={type}
              emoji={emoji}
              label={label}
              count={count}
              active={active}
              disabled={pending || !loggedIn}
              title={
                !loggedIn
                  ? 'Entre para reagir'
                  : active
                    ? activeTitle
                    : addTitle
              }
              onClick={() => react(type)}
            />
          )
        })}
      </div>

      {total > 0 && (
        <button
          type="button"
          onClick={onShowVibes}
          className="text-xs tabular-nums text-zinc-600 transition-colors hover:text-zinc-300 disabled:pointer-events-none"
          disabled={!onShowVibes}
          title="Ver quem reagiu"
        >
          {total} {total === 1 ? 'vibe' : 'vibes'}
        </button>
      )}
    </div>
  )
}

// ─── VibeButton ───────────────────────────────────────────────────────────────

type ButtonProps = {
  emoji:    string
  label:    string
  count:    number
  active:   boolean
  disabled: boolean
  title:    string
  onClick:  () => void
}

function VibeButton({ emoji, label, count, active, disabled, title, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={[
        'flex w-full items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-xs font-medium transition-all duration-150',
        'md:w-auto md:justify-start md:gap-1.5 md:px-3',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900',
        'disabled:cursor-default active:scale-95',
        active
          ? 'border-pink bg-pink/15 text-pink shadow-[0_0_12px_-2px] shadow-pink/30 hover:bg-pink/20'
          : 'border-zinc-700/60 bg-zinc-800/50 text-zinc-400 hover:border-pink/50 hover:bg-pink/10 hover:text-zinc-200',
      ].join(' ')}
    >
      <span className={`text-base leading-none transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {emoji}
      </span>

      {/* Label hidden on mobile, visible on desktop */}
      <span className={`hidden md:inline ${active ? 'text-pink' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
        {label}
      </span>

      {count > 0 && (
        <span className={[
          'min-w-[1.1rem] rounded-full px-1 py-px text-center text-[10px] font-semibold tabular-nums leading-tight',
          active
            ? 'bg-pink/25 text-pink'
            : 'bg-zinc-700/60 text-zinc-500 group-hover:bg-pink/15 group-hover:text-pink/70',
        ].join(' ')}>
          {count > 999 ? '999+' : count}
        </span>
      )}
    </button>
  )
}
