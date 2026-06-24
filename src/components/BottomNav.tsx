'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { createClient } from '@/lib/supabase/client'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { useModalLock } from '@/hooks/useModalLock'
import { useTheme } from '@/components/ThemeProvider'

export default function BottomNav() {
  const { user, signOut, shortcuts, shortcutsLoading } = useUser()
  const { theme, toggle: toggleTheme } = useTheme()
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = useMemo(() => createClient(), [])
  const unread    = useUnreadCount(user?.id ?? null)
  const unreadMsg = useUnreadMessages(user?.id ?? null)

  const [username,   setUsername]   = useState<string | null>(null)
  const [sheetOpen,  setSheetOpen]  = useState(false)
  const [sheetReady, setSheetReady] = useState(false) // controls entry animation
  const [dragY,      setDragY]      = useState(0)

  const touchStartY  = useRef(0)
  const isDragging   = useRef(false)

  useModalLock(sheetOpen)

  useEffect(() => {
    if (!user) { setUsername(null); return }
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setUsername(data.username) })
  }, [user, supabase])

  // Close sheet on navigation
  useEffect(() => { closeSheet() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  function openSheet() {
    setSheetOpen(true)
    // Slight delay so browser renders the translateY(100%) before transitioning to 0
    setTimeout(() => setSheetReady(true), 16)
  }

  function closeSheet() {
    setSheetReady(false)
    setDragY(0)
    // Keep in DOM until transition completes, then unmount
    setTimeout(() => setSheetOpen(false), 300)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
    isDragging.current = true
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setDragY(delta)
  }

  function handleTouchEnd() {
    isDragging.current = false
    if (dragY > 100) {
      closeSheet()
    } else {
      setDragY(0)
    }
  }

  async function handleSignOut() {
    closeSheet()
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const sheetTransform = dragY > 0
    ? `translateY(${dragY}px)`
    : sheetReady ? 'translateY(0)' : 'translateY(100%)'

  const sheetTransition = dragY > 0 ? 'none' : 'transform 300ms ease-out'

  return (
    <>
      {/* ── Bottom nav bar ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950 sm:hidden"
        aria-label="Navegação principal"
      >
        <div className="flex h-16 items-stretch">

          <NavLink href="/feed" active={pathname === '/feed' || pathname.startsWith('/feed/')} label="Feed">
            <HomeIcon />
          </NavLink>

          <NavLink href="/explore" active={pathname.startsWith('/explore')} label="Explorar">
            <CompassIcon />
          </NavLink>

          <NavLink href="/notifications" active={pathname.startsWith('/notifications')} label="Notificações">
            <span className="relative">
              <BellIcon />
              {unread > 0 && (
                <span aria-hidden className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4537E] px-0.5 text-[9px] font-bold leading-none text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </span>
          </NavLink>

          <NavLink href="/messages" active={pathname.startsWith('/messages')} label="Mensagens">
            <span className="relative">
              <MessageIcon />
              {unreadMsg > 0 && (
                <span aria-hidden className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4537E] px-0.5 text-[9px] font-bold leading-none text-white">
                  {unreadMsg > 99 ? '99+' : unreadMsg}
                </span>
              )}
            </span>
          </NavLink>

          <button
            onClick={openSheet}
            aria-label="Mais opções"
            aria-expanded={sheetOpen}
            className={`flex flex-1 items-center justify-center transition-colors ${
              sheetOpen ? 'text-[#D4537E]' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <DotsIcon filled={sheetOpen} />
          </button>

        </div>
      </nav>

      {/* ── Bottom sheet ── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 sm:hidden"
            style={{ opacity: sheetReady ? 1 : 0, transition: 'opacity 300ms ease-out' }}
            onClick={closeSheet}
            aria-hidden
          />

          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mais opções"
            className="fixed inset-x-0 bottom-0 z-[70] rounded-t-2xl bg-zinc-900 sm:hidden"
            style={{ transform: sheetTransform, transition: sheetTransition }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-zinc-700" />
            </div>

            <div className="px-4 pb-10 space-y-5 max-h-[78vh] overflow-y-auto">

              {/* Quick actions — 4-up grid */}
              <section>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { href: '/jogar',                             emoji: '🎮', label: 'Jogar'         },
                    { href: '/communities',                       emoji: '🏘️', label: 'Comunidades'   },
                    { href: username ? `/profile/${username}` : '#', emoji: '👤', label: 'Perfil'    },
                    { href: '/profile/edit',                      emoji: '⚙️', label: 'Config.'       },
                  ].map(item => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={closeSheet}
                      className="flex flex-col items-center gap-1.5 rounded-2xl bg-zinc-800 py-3 px-1 transition-colors active:bg-zinc-700"
                    >
                      <span className="text-2xl leading-none">{item.emoji}</span>
                      <span className="text-[11px] text-zinc-300 text-center leading-tight">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* Theme toggle row */}
                <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between px-1">
                  <span className="text-sm text-zinc-300">
                    {theme === 'dark' ? '🌙 Modo escuro' : '☀️ Modo claro'}
                  </span>
                  <button
                    onClick={toggleTheme}
                    aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                      theme === 'dark' ? 'bg-[#7F77DD]' : 'bg-zinc-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        theme === 'dark' ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </section>

              {/* Shortcuts */}
              {user && !shortcutsLoading && shortcuts.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2 px-0.5">
                    Atalhos
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {shortcuts.slice(0, 6).map(s => (
                      <Link
                        key={s.id}
                        href={s.url}
                        onClick={closeSheet}
                        className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-zinc-800 px-3 py-2.5 transition-colors active:bg-zinc-700"
                      >
                        <ShortcutIcon icon={s.icon} name={s.name} />
                        <span className="text-[11px] text-zinc-300 max-w-[60px] truncate text-center">{s.name}</span>
                      </Link>
                    ))}
                    <Link
                      href="/communities"
                      onClick={closeSheet}
                      className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-zinc-700 px-3 py-2.5 text-zinc-500 transition-colors active:bg-zinc-800"
                    >
                      <span className="text-xl leading-none">📌</span>
                      <span className="text-[11px] text-center">Gerenciar</span>
                    </Link>
                  </div>
                </section>
              )}

              {/* Quick links */}
              <section className="border-t border-zinc-800 pt-4 space-y-0.5">
                <SheetLink href="/changelog" onClick={closeSheet} emoji="📋" label="Novidades" />
                <SheetLink href="/status"    onClick={closeSheet} emoji="🟢" label="Status"    />
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-red-950/40 active:bg-red-950/60 hover:text-red-400"
                >
                  <span className="text-base">🚪</span>
                  <span>Sair</span>
                </button>
              </section>

            </div>
          </div>
        </>
      )}
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLink({ href, active, label, children }: {
  href:     string
  active:   boolean
  label:    string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex flex-1 items-center justify-center transition-colors ${
        active ? 'text-[#D4537E]' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </Link>
  )
}

function SheetLink({ href, onClick, emoji, label }: {
  href:    string
  onClick: () => void
  emoji:   string
  label:   string
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 active:bg-zinc-700 hover:text-zinc-100"
    >
      <span className="text-base">{emoji}</span>
      <span>{label}</span>
    </Link>
  )
}

function ShortcutIcon({ icon, name }: { icon: string | null; name: string }) {
  const isUrl = !!icon && (icon.startsWith('http') || icon.startsWith('/'))
  if (isUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon!} alt={name} className="w-8 h-8 rounded-lg object-cover" />
  }
  return <span className="text-xl leading-none">{icon ?? '📌'}</span>
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12L3 12L12 3L21 12L19 12" />
      <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      <path d="M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
    </svg>
  )
}

function CompassIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function DotsIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5"  cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  ) : (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="5"  cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  )
}
