type Props = {
  title:    string
  author:   string | null
  coverUrl: string | null
  rating:   number | null
}

export default function GoodreadsWidget({ title, author, coverUrl, rating }: Props) {
  const searchUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(title)}`

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          className="h-20 w-14 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-20 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl">
          📚
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1D9E75]">
          Lendo no Goodreads 📚
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-zinc-100">{title}</p>
        {author && (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{author}</p>
        )}
        {rating !== null && rating > 0 && (
          <div className="mt-1.5 flex gap-0.5" aria-label={`${rating} de 5 estrelas`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`text-base leading-none ${i < rating ? 'text-[#D4537E]' : 'text-zinc-700'}`}
              >
                ★
              </span>
            ))}
          </div>
        )}
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          ver no Goodreads ↗
        </a>
      </div>
    </div>
  )
}
