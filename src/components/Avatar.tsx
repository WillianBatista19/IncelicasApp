import Image from 'next/image'
import { initials } from '@/lib/utils'

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
} as const

type Props = {
  src?: string | null
  name?: string | null
  size?: keyof typeof SIZES
  className?: string
}

export default function Avatar({ src, name, size = 'md', className = '' }: Props) {
  const ring    = SIZES[size]
  const safeName = name?.trim() || '?'

  if (src) {
    return (
      <div className={`relative flex-shrink-0 overflow-hidden rounded-full ${ring} ${className}`}>
        <Image src={src} alt={safeName} fill className="object-cover" sizes="56px" />
      </div>
    )
  }

  return (
    <div
      aria-label={safeName}
      className={`flex flex-shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-pink to-purple font-bold text-white ${ring} ${className}`}
    >
      {initials(safeName)}
    </div>
  )
}
