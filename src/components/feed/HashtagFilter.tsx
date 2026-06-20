import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Props = { activeTag?: string }

type TrendRow = { tag: string; post_count: number }

export default async function HashtagFilter({ activeTag }: Props) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('trending_hashtags', { hours: 24, max_results: 12 })
  const tags = (data as TrendRow[] | null) ?? []

  return (
    <div
      role="group"
      aria-label="Filtrar por hashtag"
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Link
        href="/feed"
        className={[
          'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
          activeTag === undefined
            ? 'border-zinc-300 bg-zinc-700 text-zinc-100'
            : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
        ].join(' ')}
      >
        Todos
      </Link>

      {tags.map(({ tag }) => (
        <Link
          key={tag}
          href={`/hashtag/${tag}`}
          className={[
            'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
            activeTag === tag
              ? 'border-[#D4537E]/60 bg-[#D4537E]/20 text-[#D4537E]'
              : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
          ].join(' ')}
        >
          #{tag}
        </Link>
      ))}

      {tags.length === 0 && (
        <span className="text-xs text-zinc-600 py-1.5">
          Nenhuma hashtag ainda — use #tags nos seus posts!
        </span>
      )}
    </div>
  )
}
