'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { createClient } from '@/lib/supabase/client'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import type { Shortcut } from '@/types'

export default function LeftSidebar() {
  const { user, signOut, shortcuts, shortcutsLoading, removeShortcut, reorderShortcuts } = useUser()
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = useMemo(() => createClient(), [])
  const unread    = useUnreadCount(user?.id ?? null)
  const unreadMsg = useUnreadMessages(user?.id ?? null)

  const [username, setUsername] = useState<string | null>(null)
  const [dragId,     setDragId]     = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

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

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '#') return false
    if (href === '/feed') return pathname === '/feed'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const items = [
    { href: '/feed',          label: 'Feed',          icon: HomeIcon,        badge: 0 },
    { href: '/explore',       label: 'Explorar',      icon: CompassIcon,     badge: 0 },
    { href: '/notifications', label: 'Notificações',  icon: BellIcon,        badge: unread },
    { href: '/messages',      label: 'Mensagens',     icon: MessageIcon,     badge: unreadMsg },
    { href: '/jogar',         label: 'Jogar',         icon: GameIcon,        badge: 0 },
    { href: '/communities',   label: 'Comunidades',   icon: CommunitiesIcon, badge: 0 },
    { href: profileHref,      label: 'Perfil',        icon: UserIcon,        badge: 0 },
  ]

  // Visual order during drag (computed, not state)
  const displayShortcuts: Shortcut[] = useMemo(() => {
    if (!dragId || !dragOverId || dragId === dragOverId) return shortcuts
    const from = shortcuts.findIndex(s => s.id === dragId)
    const to   = shortcuts.findIndex(s => s.id === dragOverId)
    if (from === -1 || to === -1) return shortcuts
    const arr = [...shortcuts]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    return arr
  }, [shortcuts, dragId, dragOverId])

  function handleDragStart(id: string) { setDragId(id) }
  function handleDragOver(e: React.DragEvent, id: string) { e.preventDefault(); setDragOverId(id) }
  function handleDragEnd() { setDragId(null); setDragOverId(null) }

  function handleDrop(targetId: string) {
    if (dragId && dragId !== targetId) {
      const from = shortcuts.findIndex(s => s.id === dragId)
      const to   = shortcuts.findIndex(s => s.id === targetId)
      if (from !== -1 && to !== -1) {
        const arr = [...shortcuts]
        const [moved] = arr.splice(from, 1)
        arr.splice(to, 0, moved)
        reorderShortcuts(arr.map(s => s.id))
      }
    }
    setDragId(null)
    setDragOverId(null)
  }

  return (
    <aside className="hidden xl:flex xl:w-52 xl:shrink-0 xl:flex-col sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
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

      {/* Shortcuts section */}
      {user && (
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Atalhos
          </p>

          {shortcutsLoading ? null : shortcuts.length === 0 ? (
            <p className="px-3 text-xs text-zinc-600 leading-relaxed">
              📌 Fixe comunidades e jogos favoritos
            </p>
          ) : (
            <div className="space-y-0.5">
              {displayShortcuts.map(shortcut => {
                const isDragging = shortcut.id === dragId
                const isDragOver = shortcut.id === dragOverId && dragId !== dragOverId

                return (
                  <div
                    key={shortcut.id}
                    draggable
                    onDragStart={() => handleDragStart(shortcut.id)}
                    onDragOver={e => handleDragOver(e, shortcut.id)}
                    onDrop={() => handleDrop(shortcut.id)}
                    onDragEnd={handleDragEnd}
                    className={`group relative flex items-center rounded-xl transition-all cursor-grab active:cursor-grabbing ${
                      isDragging ? 'opacity-40' : ''
                    } ${isDragOver ? 'ring-1 ring-[#D4537E]/50 bg-[#D4537E]/5' : ''}`}
                  >
                    <Link
                      href={shortcut.url}
                      className="flex flex-1 items-center gap-2 px-3 py-1.5 min-w-0 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      <ShortcutIcon icon={shortcut.icon} name={shortcut.name} />
                      <span className="truncate">{shortcut.name}</span>
                    </Link>
                    <button
                      onClick={e => { e.preventDefault(); removeShortcut(shortcut.url) }}
                      title="Remover atalho"
                      className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-600 hover:text-[#D4537E]"
                    >
                      <PinSolidIcon className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-zinc-800 pt-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-red-950/40 hover:text-red-400"
        >
          <LogOutIcon className="h-5 w-5 shrink-0" />
          Sair
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-0.5">
        <Link
          href="/status"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <StatusDotIcon className="h-3.5 w-3.5 shrink-0" />
          Status
        </Link>
        <Link
          href="/changelog"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
          Novidades
        </Link>
      </div>
    </aside>
  )
}

// ─── ShortcutIcon ─────────────────────────────────────────────────────────────

function ShortcutIcon({ icon, name }: { icon: string | null; name: string }) {
  const isUrl = !!icon && (icon.startsWith('http') || icon.startsWith('/'))
  if (isUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon!} alt={name} className="w-4 h-4 rounded object-cover shrink-0" />
    )
  }
  return (
    <span className="text-sm shrink-0 leading-none">{icon ?? '📌'}</span>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function PinSolidIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16 3a1 1 0 0 0-1 1v1H9V4a1 1 0 1 0-2 0v8.172l-2.536 2.536A1 1 0 0 0 5 16h6v4a1 1 0 1 0 2 0v-4h6a1 1 0 0 0 .707-1.707L17 12.172V4a1 1 0 0 0-1-1z"/>
    </svg>
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

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function GameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="M6 12h4M8 10v4" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CommunitiesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function StatusDotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z" />
      <path d="M12 4a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z" />
      <path d="M3 14a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z" />
      <path d="M12 14a2 2 0 0 0 -2 2" />
      <path d="M14 6a2 2 0 0 0 2 2" />
      <path d="M5 16a2 2 0 0 0 2 -2" />
      <path d="M9 12l2 2" />
      <path d="M14 8l2 2" />
    </svg>
  )
}
