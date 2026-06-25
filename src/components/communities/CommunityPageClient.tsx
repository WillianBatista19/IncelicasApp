'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Community, CommunityMemberRow, CommunityPost, CommunityRole } from '@/types'
import { useUser } from '@/context/UserContext'
import CommunityPostCard from './CommunityPostCard'
import CommunityPostComposer from './CommunityPostComposer'
import MembersTab from './MembersTab'
import JoinButton from './JoinButton'
import CommunityAvatarModal from './CommunityAvatarModal'
import AwaitedAlbumsTab from './AwaitedAlbumsTab'
import type { AwaitedAlbumGroup } from './AwaitedAlbumsTab'
import { toggleNotificationsMuted } from '@/app/(app)/communities/actions'

type Tab = 'posts' | 'members' | 'jogos' | 'aguardados'


const GAMES = [
  {
    href:        '/communities/musica/avaliar',
    slug:        'avaliar-album',
    name:        'Avaliar Álbum',
    icon:        '🎵',
    description: 'Dê nota para cada faixa, escolha seus favoritos e veja o ranking da comunidade',
    bg:          'bg-[#D4537E]/20',
  },
  {
    href:        '/communities/musica/survivor',
    slug:        'survivor',
    name:        'Survivor Musical',
    icon:        '🏆',
    description: null, // dynamic — uses activeSurvivorEvent
    bg:          'bg-[#7F77DD]/20',
  },
  {
    href:        '/communities/musica/grammy',
    slug:        'grammy',
    name:        'Grammy Predictions',
    icon:        '🎙️',
    description: 'Faça suas previsões e veja quem acertou mais',
    bg:          'bg-yellow-500/10',
  },
]

interface Props {
  community:          Community
  posts:              CommunityPost[]
  members:            CommunityMemberRow[]
  currentUserId:      string | null
  viewerRole:         CommunityRole | null
  canPost:            boolean
  notificationsMuted: boolean
  activeSurvivorEvent?:  { album_name: string; artist_name: string; current_round: number } | null
  awaitedAlbumGroups?:  AwaitedAlbumGroup[]
}

export default function CommunityPageClient({
  community, posts, members, currentUserId, viewerRole, canPost, notificationsMuted,
  activeSurvivorEvent, awaitedAlbumGroups = [],
}: Props) {
  const router = useRouter()
  const { isShortcutted, addShortcut, removeShortcut, shortcuts } = useUser()

  const [tab,            setTab]            = useState<Tab>('posts')
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [muted,          setMuted]          = useState(notificationsMuted)
  const [muteLoading,    setMuteLoading]    = useState(false)
  const [toast,          setToast]          = useState<string | null>(null)

  const isMember = !!viewerRole
  const isOwner  = viewerRole === 'owner'

  const communityUrl = `/communities/${community.slug}`
  const commPinned   = isShortcutted(communityUrl)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function handleNewPost() { router.refresh() }

  async function handleMuteToggle() {
    if (muteLoading) return
    const next = !muted
    setMuted(next)
    setMuteLoading(true)
    try {
      await toggleNotificationsMuted(community.id, next)
      setToast(next ? 'Notificações silenciadas' : 'Notificações ativadas')
    } catch {
      setMuted(!next)
    } finally {
      setMuteLoading(false)
    }
  }

  async function handleCommunityPin() {
    if (commPinned) {
      await removeShortcut(communityUrl)
    } else {
      const result = await addShortcut({
        type: 'community',
        slug: community.slug,
        name: community.name,
        icon: community.avatar_url ?? '🏘️',
        url:  communityUrl,
      })
      if (result.error) setToast(result.error)
    }
  }

  async function handleGamePin(game: { href: string; slug: string; name: string; icon: string }) {
    if (isShortcutted(game.href)) {
      await removeShortcut(game.href)
    } else {
      const result = await addShortcut({
        type: 'game',
        slug: game.slug,
        name: game.name,
        icon: game.icon,
        url:  game.href,
      })
      if (result.error) setToast(result.error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/communities"
        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeftIcon className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Comunidades</span>
      </Link>

      {/* Header */}
      <div className="rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800">
        {community.banner_url && (
          <div
            className="h-32 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${community.banner_url})` }}
          />
        )}
        <div className="p-4 flex items-start gap-3">
          {community.avatar_url ? (
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="shrink-0 rounded-xl transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4537E]"
              aria-label="Ver foto da comunidade"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={community.avatar_url}
                alt={community.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            </button>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#7F77DD]/30 flex items-center justify-center text-2xl shrink-0">
              🏘️
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-zinc-100">{community.name}</h1>
            {community.description && (
              <p className="text-sm text-zinc-400 mt-0.5">{community.description}</p>
            )}
            <p className="text-xs text-zinc-500 mt-1">{members.length} membros</p>
          </div>

          {currentUserId && (
            <div className="flex items-center gap-2 shrink-0">
              {isMember && (
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  disabled={muteLoading}
                  aria-label={muted ? 'Ativar notificações' : 'Silenciar notificações'}
                  title={muted ? 'Ativar notificações' : 'Silenciar notificações'}
                  className="rounded-xl bg-white/10 p-2 text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  {muted ? <BellMutedIcon className="h-4 w-4" /> : <BellIcon className="h-4 w-4" />}
                </button>
              )}

              {/* Pin button */}
              <button
                type="button"
                onClick={handleCommunityPin}
                title={commPinned ? 'Remover atalho' : 'Fixar no menu'}
                className={`rounded-xl bg-white/10 p-2 transition-colors ${
                  commPinned ? 'text-[#D4537E]' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <PinIcon className="h-4 w-4" filled={commPinned} />
              </button>

              {isOwner && (
                <a
                  href={`/communities/${community.slug}/settings`}
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm text-zinc-300 hover:text-white"
                >
                  ⚙️
                </a>
              )}

              <JoinButton communityId={community.id} isMember={isMember} isOwner={isOwner} />
            </div>
          )}
        </div>
      </div>

      {/* Mais aguardados — top 3, Música only */}
      {community.slug === 'musica' && awaitedAlbumGroups.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            ⏳ Mais aguardados pela comunidade
          </p>
          <div className="space-y-2">
            {awaitedAlbumGroups.slice(0, 3).map((a, i) => (
              <MaisAguardadoCard key={i} album={a} />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 overflow-x-auto scrollbar-none">
        {(
          ['posts', 'members', ...(community.slug === 'musica' ? ['jogos' as Tab, 'aguardados' as Tab] : [])] as Tab[]
        ).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-4 py-2 text-sm font-medium transition
              ${tab === t ? 'text-[#D4537E] border-b-2 border-[#D4537E]' : 'text-zinc-400 hover:text-white'}`}
          >
            {t === 'posts'
              ? 'Posts'
              : t === 'members'
              ? `Membros (${members.length})`
              : t === 'jogos'
              ? '🎮 Jogos'
              : '⏳ Aguardados'}
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <div className="space-y-4">
          {canPost && currentUserId && (
            <CommunityPostComposer communityId={community.id} currentUserId={currentUserId} onPost={handleNewPost} />
          )}
          {posts.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-10">
              Nenhum post ainda. Seja a primeira a postar!
            </p>
          ) : (
            posts.map(p => (
              <CommunityPostCard
                key={p.id}
                post={p}
                currentUserId={currentUserId}
                isOwnerOrMod={viewerRole === 'owner' || viewerRole === 'moderator'}
              />
            ))
          )}
        </div>
      )}

      {tab === 'jogos' && (
        <div className="space-y-4">
          {GAMES.map(game => {
            const pinned = isShortcutted(game.href)
            return (
              <div
                key={game.href}
                className="group relative rounded-xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/60 transition-colors"
              >
                <Link href={game.href} className="flex items-center gap-4 p-4">
                  <div className={`w-14 h-14 rounded-xl ${game.bg} flex items-center justify-center text-3xl shrink-0`}>
                    {game.icon}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="font-semibold text-zinc-100">{game.name}</p>
                    {game.href === '/communities/musica/survivor' ? (
                      activeSurvivorEvent ? (
                        <p className="text-sm text-[#7F77DD] mt-0.5 truncate">
                          {activeSurvivorEvent.album_name} · Rodada {activeSurvivorEvent.current_round}
                        </p>
                      ) : (
                        <p className="text-sm text-zinc-400 mt-0.5">Nenhum evento ativo</p>
                      )
                    ) : null}
                    {game.description && (
                      <p className="text-sm text-zinc-400 mt-0.5">{game.description}</p>
                    )}
                    {game.href === '/communities/musica/survivor' && (
                      <p className="text-xs text-zinc-500 mt-0.5">Vote para eliminar a pior faixa de cada rodada</p>
                    )}
                  </div>
                </Link>

                {currentUserId && (
                  <button
                    onClick={() => handleGamePin(game)}
                    title={pinned ? 'Remover atalho' : 'Fixar no menu'}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                      pinned
                        ? 'text-[#D4537E]'
                        : 'text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-300'
                    }`}
                  >
                    <PinIcon className="h-4 w-4" filled={pinned} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'aguardados' && (
        <AwaitedAlbumsTab
          groups={awaitedAlbumGroups}
          currentUserId={currentUserId}
        />
      )}

      {tab === 'members' && (
        <MembersTab
          communityId={community.id}
          members={members}
          currentUserId={currentUserId}
          viewerRole={viewerRole}
          postPermission={community.post_permission}
        />
      )}

      {showAvatarModal && community.avatar_url && (
        <CommunityAvatarModal
          src={community.avatar_url}
          name={community.name}
          onClose={() => setShowAvatarModal(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── MaisAguardadoCard ────────────────────────────────────────────────────────

function computeMaisAguardadoCd(dt: string) {
  const target = /^\d{4}-\d{2}-\d{2}$/.test(dt)
    ? new Date(dt + 'T00:00:00-03:00')
    : new Date(dt)
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  const s = Math.floor(diff / 1000)
  return {
    days:    Math.floor(s / 86400),
    hours:   Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

function MaisAguardadoCard({ album }: { album: AwaitedAlbumGroup }) {
  const [cd, setCd] = useState(() =>
    album.releaseDate ? computeMaisAguardadoCd(album.releaseDate) : null
  )

  useEffect(() => {
    if (!album.releaseDate) return
    const id = setInterval(() => setCd(computeMaisAguardadoCd(album.releaseDate!)), 1000)
    return () => clearInterval(id)
  }, [album.releaseDate])

  const p = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-3">
      {album.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={album.coverUrl}
          alt={album.albumName}
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-base">
          🎵
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{album.albumName}</p>
        <p className="truncate text-xs text-zinc-500">{album.artistName}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] text-zinc-600 mb-0.5">
          {album.memberCount} {album.memberCount === 1 ? 'membro' : 'membros'}
        </p>
        {cd ? (
          <p className="font-mono text-xs tabular-nums text-[#D4537E]">
            {cd.days > 0 ? `${cd.days}d ` : ''}{p(cd.hours)}:{p(cd.minutes)}:{p(cd.seconds)}
          </p>
        ) : (
          <p className="text-xs text-[#1D9E75]">🎉 Lançou!</p>
        )}
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PinIcon({ className, filled }: { className?: string; filled: boolean }) {
  return filled ? (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16 3a1 1 0 0 0-1 1v1H9V4a1 1 0 1 0-2 0v8.172l-2.536 2.536A1 1 0 0 0 5 16h6v4a1 1 0 1 0 2 0v-4h6a1 1 0 0 0 .707-1.707L17 12.172V4a1 1 0 0 0-1-1z" />
    </svg>
  ) : (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  )
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function BellMutedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18.63 13A17.9 17.9 0 0 1 18 8" />
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <path d="M18 8a6 6 0 0 0-9.33-5" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
