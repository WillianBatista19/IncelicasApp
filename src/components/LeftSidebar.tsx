'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { createClient } from '@/lib/supabase/client'
import { useUnreadCount } from '@/hooks/useUnreadCount'

export default function LeftSidebar() {
  const { user }  = useUser()
  const pathname  = usePathname()
  const supabase  = useMemo(() => createClient(), [])
  const unread    = useUnreadCount(user?.id ?? null)

  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setUsername(null); return }
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setUsername(data.username) })
  }, [user, supabase])

  const profileHref = username ? `/profile/${username}` : '#'

  function isActive(href: string) {
    if (href === '#') return false
    if (href === '/feed') return pathname === '/feed'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const items = [
    { href: '/feed',          label: 'Feed',          icon: HomeIcon,    badge: 0 },
    { href: '/explore',       label: 'Explorar',      icon: CompassIcon, badge: 0 },
    { href: '/notifications', label: 'Notificações',  icon: BellIcon,    badge: unread },
    { href: profileHref,      label: 'Perfil',        icon: UserIcon,    badge: 0 },
  ]

  return (
    <aside className="hidden xl:flex xl:w-52 xl:shrink-0 xl:flex-col sticky top-20 self-start h-fit">
      <nav className="space-y-1">
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(href)
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#D4537E]/10 text-[#D4537E]'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              <span className="relative shrink-0">
                <Icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#D4537E] px-0.5 text-[8px] font-bold leading-none text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12L3 12L12 3L21 12L19 12" />
      <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      <path d="M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
    </svg>
  )
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
