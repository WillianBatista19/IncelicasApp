import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type TrendRow = { tag: string; post_count: number }

export default async function TrendingSidebar() {
  const supabase = await createClient()

  const { data } = await supabase.rpc('trending_hashtags', { hours: 24, max_results: 10 })
  const trending = (data as TrendRow[] | null) ?? []

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
        🔥 Trending hoje
      </h2>

      {trending.length === 0 ? (
        <p className="text-xs text-zinc-600">
          Nada em alta por aqui ainda. Posta algo com #hashtags!
        </p>
      ) : (
        <ul className="space-y-2.5">
          {trending.map(({ tag, post_count }, i) => (
            <li key={tag} className="flex items-center gap-2.5">
              <span className="w-4 text-center text-xs font-bold text-zinc-600">
                {i + 1}
              </span>
              <Link
                href={`/hashtag/${tag}`}
                className="inline-flex items-center rounded-full border border-[#D4537E]/30 bg-[#D4537E]/10 px-2.5 py-0.5 text-xs font-semibold text-[#D4537E] transition-colors hover:bg-[#D4537E]/20"
              >
                #{tag}
              </Link>
              <span className="ml-auto text-xs tabular-nums text-zinc-600">
                {post_count} post{Number(post_count) !== 1 ? 's' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
