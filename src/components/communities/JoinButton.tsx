'use client'

import { useState } from 'react'
import { joinCommunity, leaveCommunity } from '@/app/(app)/communities/actions'

interface Props {
  communityId:  string
  isMember:     boolean
  isOwner?:     boolean
}

export default function JoinButton({ communityId, isMember, isOwner }: Props) {
  const [member, setMember] = useState(isMember)
  const [loading, setLoading] = useState(false)

  if (isOwner) return null

  async function toggle() {
    setLoading(true)
    try {
      if (member) {
        await leaveCommunity(communityId)
        setMember(false)
      } else {
        await joinCommunity(communityId)
        setMember(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50
        ${member
          ? 'bg-white/10 text-zinc-300 hover:bg-red-500/20 hover:text-red-400'
          : 'bg-[#D4537E] text-white hover:opacity-90'
        }`}
    >
      {loading ? '…' : member ? 'Sair' : 'Entrar'}
    </button>
  )
}
