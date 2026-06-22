'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { createGroupConversation } from '@/app/(app)/messages/actions'

type Profile = {
  id:           string
  username:     string
  display_name: string | null
  avatar_url:   string | null
}

export default function NewGroupModal({ onClose }: { onClose: () => void }) {
  const router   = useRouter()
  const supabase = createClient()

  const [groupName,  setGroupName]  = useState('')
  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState<Profile[]>([])
  const [selected,   setSelected]   = useState<Profile[]>([])
  const [loading,    setLoading]    = useState(false)
  const [creating,   setCreating]   = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function search(q: string) {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${q.trim()}%,display_name.ilike.%${q.trim()}%`)
      .limit(8)
    setResults((data as Profile[] | null) ?? [])
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void search(q), 300)
  }

  function toggleSelect(profile: Profile) {
    setSelected(prev =>
      prev.some(p => p.id === profile.id)
        ? prev.filter(p => p.id !== profile.id)
        : [...prev, profile],
    )
  }

  async function handleCreate() {
    if (!groupName.trim() || selected.length === 0 || creating) return
    setCreating(true)
    setError(null)
    const result = await createGroupConversation(groupName, selected.map(p => p.id))
    if ('error' in result) {
      setError(result.error)
      setCreating(false)
    } else {
      router.push(`/messages/${result.conversationId}`)
      onClose()
    }
  }

  const canCreate = groupName.trim().length > 0 && selected.length >= 1 && !creating

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3.5">
          <h2 className="text-sm font-bold text-zinc-100">Novo grupo</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-4 w-4" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 p-4">
          {/* Group name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nome do grupo</label>
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Ex: Incelicas do BBB"
              maxLength={60}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-[#D4537E]"
            />
          </div>

          {/* Selected members chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleSelect(p)}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 transition-colors hover:border-red-700 hover:bg-red-950/30 hover:text-red-400"
                  title="Remover"
                >
                  <Avatar src={p.avatar_url} name={p.display_name || p.username} size="sm" className="!h-4 !w-4 text-[8px]" />
                  {p.display_name || p.username}
                  <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          )}

          {/* User search */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Adicionar membros</label>
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={handleChange}
                placeholder="Buscar pelo nome ou @username…"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-[#D4537E]"
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-48 overflow-y-auto -mx-1 px-1">
            {loading && <p className="px-2 py-2 text-xs text-zinc-500">Buscando…</p>}
            {!loading && query.trim() && results.length === 0 && (
              <p className="px-2 py-2 text-xs text-zinc-500">Nenhuma incelica encontrada.</p>
            )}
            {!query.trim() && results.length === 0 && (
              <p className="px-2 py-2 text-xs text-zinc-500">Digite um nome para buscar incelicas…</p>
            )}
            {results.map(p => {
              const isSelected = selected.some(s => s.id === p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleSelect(p)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                    isSelected ? 'bg-[#D4537E]/15' : 'hover:bg-zinc-800'
                  }`}
                >
                  <Avatar src={p.avatar_url} name={p.display_name || p.username} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">{p.display_name || p.username}</p>
                    <p className="truncate text-xs text-zinc-500">@{p.username}</p>
                  </div>
                  {isSelected && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#D4537E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-zinc-600">
              {selected.length === 0 ? 'Selecione pelo menos 1 membro' : `${selected.length} membro${selected.length > 1 ? 's' : ''} selecionado${selected.length > 1 ? 's' : ''}`}
            </p>
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!canCreate}
              className="rounded-xl bg-[#D4537E] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#c0476f] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? 'Criando…' : 'Criar grupo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
