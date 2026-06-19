'use client'

import type { Category } from '@/types'

type FilterItem =
  | { value: null;     label: string; activeClass: string }
  | { value: Category; label: string; activeClass: string }

const ITEMS: FilterItem[] = [
  { value: null,     label: 'Todos',   activeClass: 'border-zinc-300  bg-zinc-700  text-zinc-100' },
  { value: 'anime',  label: '🎌 Anime',  activeClass: 'border-purple/60 bg-purple/20 text-purple'  },
  { value: 'bbb',    label: '🏠 BBB',    activeClass: 'border-pink/60   bg-pink/20   text-pink'    },
  { value: 'musica', label: '🎵 Música', activeClass: 'border-teal/60   bg-teal/20   text-teal'    },
  { value: 'serie',  label: '📺 Série',  activeClass: 'border-blue-500/60  bg-blue-500/20  text-blue-400'   },
  { value: 'filme',  label: '🎬 Filme',  activeClass: 'border-orange-500/60 bg-orange-500/20 text-orange-400' },
  { value: 'livro',  label: '📚 Livro',  activeClass: 'border-yellow-500/60 bg-yellow-500/20 text-yellow-400' },
]

type Props = {
  selected: Category | null
  onSelect: (c: Category | null) => void
}

export default function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <div
      role="group"
      aria-label="Filtrar por categoria"
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ITEMS.map(({ value, label, activeClass }) => {
        const active = selected === value
        return (
          <button
            key={value ?? 'all'}
            type="button"
            onClick={() => onSelect(value)}
            className={[
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95',
              active
                ? activeClass
                : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
