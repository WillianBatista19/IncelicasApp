'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Community, CommunityMemberRow } from '@/types'
import CreateCommunityModal from './CreateCommunityModal'
import { useUser } from '@/context/UserContext'

interface Props {
  communities:      Community[]
  myMemberships:    Pick<CommunityMemberRow, 'community_id'>[]
  currentUserId:    string | null
}

export default function CommunitiesClient({ communities, myMemberships, currentUserId }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const { isShortcutted, addShortcut, removeShortcut } = useUser()
  const myIds = new Set(myMemberships.map(m => m.community_id))

  const mine  = communities.filter(c => myIds.has(c.id))
  const other = communities.filter(c => !myIds.has(c.id))

  async function handlePin(c: Community) {
    const url = `/communities/${c.slug}`
    if (isShortcutted(url)) {
      await removeShortcut(url)
    } else {
      await addShortcut({
        type: 'community',
        slug: c.slug,
        name: c.name,
        icon: c.avatar_url ?? '🏘️',
        url,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">🏘️ Comunidades</h1>
        {currentUserId && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-[#D4537E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            + Criar
          </button>
        )}
      </div>

      {mine.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">Minhas comunidades</h2>
          <div className="space-y-2">
            {mine.map(c => (
              <CommunityCard
                key={c.id}
                community={c}
                isMember
                pinned={isShortcutted(`/communities/${c.slug}`)}
                showPin={!!currentUserId}
                onPin={() => handlePin(c)}
              />
            ))}
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">
            {mine.length > 0 ? 'Descobrir' : 'Todas as comunidades'}
          </h2>
          <div className="space-y-2">
            {other.map(c => (
              <CommunityCard
                key={c.id}
                community={c}
                isMember={false}
                pinned={isShortcutted(`/communities/${c.slug}`)}
                showPin={!!currentUserId}
                onPin={() => handlePin(c)}
              />
            ))}
          </div>
        </section>
      )}

      {communities.length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-12">
          Nenhuma comunidade ainda. Cria a primeira, incelica!
        </p>
      )}

      {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}

function CommunityCard({
  community: c,
  isMember,
  pinned,
  showPin,
  onPin,
}: {
  community: Community
  isMember:  boolean
  pinned:    boolean
  showPin:   boolean
  onPin:     () => void
}) {
  return (
    <div className="group relative rounded-xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/60 transition">
      <Link
        href={`/communities/${c.slug}`}
        className="flex items-center gap-3 p-3 pr-10"
      >
        {c.avatar_url ? (
          <Image
            src={c.avatar_url}
            alt={c.name}
            width={44} height={44}
            className="rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-[#7F77DD]/30 flex items-center justify-center text-xl shrink-0">
            🏘️
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{c.name}</p>
          {c.description && (
            <p className="text-xs text-zinc-500 truncate">{c.description}</p>
          )}
          <p className="text-xs text-zinc-600 mt-0.5">{c.member_count} membros</p>
        </div>
        {isMember && (
          <span className="shrink-0 rounded-full bg-[#D4537E]/20 px-2 py-0.5 text-xs text-[#D4537E]">Membro</span>
        )}
      </Link>

      {showPin && (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onPin() }}
          title={pinned ? 'Remover atalho' : 'Fixar no menu'}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
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
}

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
