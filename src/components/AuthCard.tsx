import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <main className="min-h-dvh bg-auth-radial flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold tracking-tight text-pink">
            zapli
          </span>
          <span className="ml-1 text-3xl">✦</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <h1 className="mb-1 text-xl font-bold text-zinc-100">{title}</h1>
          <p className="mb-6 text-sm text-zinc-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  )
}
