'use client'

import Link from 'next/link'
import { useUser } from '@/context/UserContext'
import { useUnreadCount } from '@/hooks/useUnreadCount'

export default function NotificationBell() {
  const { user } = useUser()
  const count    = useUnreadCount(user?.id ?? null)
  const label    = count > 0 ? `${count} notificaç${count === 1 ? 'ão' : 'ões'} não lida${count === 1 ? '' : 's'}` : 'Notificações'

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
    >
      {/* Bell SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {/* Unread badge */}
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink px-0.5 text-[10px] font-bold leading-none text-white"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
