'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Community } from '@/types'
import { updateCommunitySettings, deleteCommunity } from '@/app/(app)/communities/actions'

interface Props {
  community: Community
}

export default function CommunitySettingsForm({ community }: Props) {
  const router = useRouter()
  const [name, setName]               = useState(community.name)
  const [description, setDescription] = useState(community.description ?? '')
  const [permission, setPermission]   = useState(community.post_permission)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await updateCommunitySettings(community.id, {
        name:            name.trim(),
        description:     description.trim() || null,
        post_permission: permission,
      })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteCommunity(community.id)
      router.push('/communities')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="space-y-4">
        <h2 className="text-base font-semibold text-white">Configurações</h2>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Nome</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4537E]"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4537E]"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Quem pode postar?</label>
          <select
            value={permission}
            onChange={e => setPermission(e.target.value as Community['post_permission'])}
            className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#D4537E]"
          >
            <option value="all">Todos os membros</option>
            <option value="owner_only">Só o dono</option>
            <option value="allowed_users">Membros autorizados</option>
          </select>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-green-400">Salvo!</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#D4537E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </form>

      <div className="border-t border-white/10 pt-6">
        <h3 className="text-sm font-semibold text-red-400 mb-2">Zona de perigo</h3>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-xl bg-red-700/20 px-4 py-2 text-sm text-red-400 hover:bg-red-700/40 transition"
          >
            Excluir comunidade
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-400">Tem certeza? Isso não pode ser desfeito.</p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {deleting ? '…' : 'Excluir'}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-sm text-zinc-400 hover:text-white">
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
