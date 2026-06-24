'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Community, CommunityMemberRow } from '@/types'
import CreateCommunityModal from './CreateCommunityModal'

interface Props {
  communities:      Community[]
  myMemberships:    Pick<CommunityMemberRow, 'community_id'>[]
  currentUserId:    string | null
}

export default function CommunitiesClient({ communities, myMemberships, currentUserId }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const myIds = new Set(myMemberships.map(m => m.community_id))

  const mine  = communities.filter(c => myIds.has(c.id))
  const other = communities.filter(c => !myIds.has(c.id))

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
            {mine.map(c => <CommunityCard key={c.id} community={c} isMember />)}
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">
            {mine.length > 0 ? 'Descobrir' : 'Todas as comunidades'}
          </h2>
          <div className="space-y-2">
            {other.map(c => <CommunityCard key={c.id} community={c} isMember={false} />)}
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

function CommunityCard({ community: c, isMember }: { community: Community; isMember: boolean }) {
  return (
    <Link
      href={`/communities/${c.slug}`}
      className="flex items-center gap-3 rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 hover:bg-zinc-800/60 transition"
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
  )
}
