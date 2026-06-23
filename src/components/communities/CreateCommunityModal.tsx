'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCommunity } from '@/app/(app)/communities/actions'
import { useModalLock } from '@/hooks/useModalLock'

interface Props {
  onClose: () => void
}

export default function CreateCommunityModal({ onClose }: Props) {
  const router = useRouter()

  useModalLock(true)

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [permission, setPermission]   = useState('all')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await createCommunity({ name: name.trim(), description: description.trim(), post_permission: permission })
      onClose()
      router.push(`/communities/${result.slug}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white">Criar comunidade</h2>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nome</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Animes da temporada"
              maxLength={60}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D4537E]"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Do que é essa comunidade?"
              rows={3}
              className="w-full resize-none rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D4537E]"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Quem pode postar?</label>
            <select
              value={permission}
              onChange={e => setPermission(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4537E]"
            >
              <option value="all">Todos os membros</option>
              <option value="owner_only">Só o dono</option>
              <option value="allowed_users">Membros autorizados</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:text-white">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="rounded-xl bg-[#D4537E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition"
            >
              {loading ? 'Criando…' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
