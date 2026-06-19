'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthCard from '@/components/AuthCard'
import { createClient } from '@/lib/supabase/client'
import { translateAuthError } from '@/lib/auth-errors'

type Status = 'idle' | 'loading' | 'success'

export default function SignupPage() {
  const [username,  setUsername]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [status,    setStatus]    = useState<Status>('idle')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('As senhas não batem. Confere aí!')
      return
    }
    if (username.trim().length < 3) {
      setError('Username precisa ter pelo menos 3 caracteres.')
      return
    }

    setStatus('loading')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username:     username.trim().toLowerCase(),
          display_name: username.trim(),
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
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
      <AuthCard title="Quase lá!" subtitle="">
        <div className="space-y-4 text-center">
          <div className="text-5xl">📬</div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Mandamos um link de confirmação para{' '}
            <span className="font-semibold text-pink">{email}</span>.
            <br />
            Checa tua caixa de entrada e clica no link para ativar sua conta!
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
      title="Cria sua conta"
      subtitle="Bora entrar nessa vibe, incelica!"
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="username" className="text-xs font-medium text-zinc-400">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 select-none">
              @
            </span>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              placeholder="seunome"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              className="input-base pl-8"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium text-zinc-400">
            Email
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

        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-medium text-zinc-400">
            Senha
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
            Confirmar senha
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
          {confirm && confirm !== password && (
            <p className="text-xs text-red-400 mt-1">As senhas não batem.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary mt-2"
        >
          {status === 'loading' ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Já tem conta?{' '}
        <Link href="/login" className="font-medium text-pink hover:text-pink-hover transition-colors">
          Entrar
        </Link>
      </p>
    </AuthCard>
  )
}
