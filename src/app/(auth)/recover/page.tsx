'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthCard from '@/components/AuthCard'
import { createClient } from '@/lib/supabase/client'
import { translateAuthError } from '@/lib/auth-errors'

type Status = 'idle' | 'loading' | 'success'

export default function RecoverPage() {
  const [email,  setEmail]  = useState('')
  const [error,  setError]  = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatus('loading')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/update-password`,
    })

    if (error) {
      setError(translateAuthError(error.message))
      setStatus('idle')
      return
    }

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <AuthCard title="Email enviado!" subtitle="">
        <div className="space-y-4 text-center">
          <div className="text-5xl">✉️</div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Mandamos as instruções para{' '}
            <span className="font-semibold text-pink">{email}</span>.
            <br />
            Checa tua caixa de entrada e o spam também!
          </p>
          <Link href="/login" className="block text-sm text-zinc-500 hover:text-pink transition-colors">
            Voltar para o login
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Manda teu email que a gente te ajuda, zapli."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium text-zinc-400">
            Email da sua conta
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
          />
        </div>

        <button type="submit" disabled={status === 'loading'} className="btn-primary">
          {status === 'loading' ? 'Enviando…' : 'Enviar link de recuperação'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Lembrou a senha?{' '}
        <Link href="/login" className="font-medium text-pink hover:text-pink-hover transition-colors">
          Entrar
        </Link>
      </p>
    </AuthCard>
  )
}
