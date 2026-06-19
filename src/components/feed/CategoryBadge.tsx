import type { Category } from '@/types'

const CONFIG: Record<Category, { label: string; className: string }> = {
  anime:  { label: '#anime',  className: 'bg-purple/20  text-purple  border-purple/30'  },
  bbb:    { label: '#bbb',    className: 'bg-pink/20    text-pink    border-pink/30'    },
  musica: { label: '#música', className: 'bg-teal/20    text-teal    border-teal/30'    },
  serie:  { label: '#série',  className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  filme:  { label: '#filme',  className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  livro:  { label: '#livro',  className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
}

export default function CategoryBadge({ category }: { category: Category }) {
  const { label, className } = CONFIG[category]
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
