'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthCard from '@/components/AuthCard'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const router   = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('As senhas não batem. Confere aí!')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Não foi possível atualizar a senha. Tenta pedir um novo link.')
      setLoading(false)
      return
    }

    router.push('/feed')
    router.refresh()
  }

  return (
    <AuthCard
      title="Nova senha"
      subtitle="Escolhe uma senha novinha pra sua conta."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-medium text-zinc-400">
            Nova senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirm" className="text-xs font-medium text-zinc-400">
            Confirmar nova senha
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Repete a senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={`input-base ${
              confirm && confirm !== password
                ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                : ''
            }`}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </AuthCard>
  )
}
