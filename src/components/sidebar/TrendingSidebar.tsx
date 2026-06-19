import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types'

type TrendEntry = { category: Category; count: number }

const BADGE: Record<Category, { label: string; className: string }> = {
  anime:  { label: '#anime',  className: 'bg-purple/20  text-purple  border-purple/30'  },
  bbb:    { label: '#bbb',    className: 'bg-pink/20    text-pink    border-pink/30'    },
  musica: { label: '#música', className: 'bg-teal/20    text-teal    border-teal/30'    },
  serie:  { label: '#série',  className: 'bg-blue-500/20  text-blue-400  border-blue-500/30'  },
  filme:  { label: '#filme',  className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  livro:  { label: '#livro',  className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
}

const EMOJI: Record<Category, string> = {
  anime: '🎌', bbb: '🏠', musica: '🎵', serie: '📺', filme: '🎬', livro: '📚',
}

export default async function TrendingSidebar() {
  const supabase = await createClient()

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('posts')
    .select('category')
    .not('category', 'is', null)
    .gte('created_at', since)

  // Count per category client-side — fast for small friend groups
  const counts: Partial<Record<Category, number>> = {}
  for (const row of data ?? []) {
    const cat = row.category as Category
    counts[cat] = (counts[cat] ?? 0) + 1
  }

  const trending: TrendEntry[] = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cat, count]) => ({ category: cat as Category, count }))

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
        🔥 Trending hoje
      </h2>

      {trending.length === 0 ? (
        <p className="text-xs text-zinc-600">
          Nada em alta por aqui ainda. Posta algo!
        </p>
      ) : (
        <ul className="space-y-2.5">
          {trending.map(({ category, count }, i) => {
            const { label, className } = BADGE[category]
            return (
              <li key={category} className="flex items-center gap-2.5">
                <span className="w-4 text-center text-xs font-bold text-zinc-600">
                  {i + 1}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
                >
                  {EMOJI[category]} {label}
                </span>
                <span className="ml-auto text-xs tabular-nums text-zinc-600">
                  {count} post{count > 1 ? 's' : ''}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
