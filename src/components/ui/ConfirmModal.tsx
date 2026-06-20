'use client'

import { useEffect } from 'react'

type Props = {
  message:      string
  confirmLabel: string
  onConfirm:    () => void
  onCancel:     () => void
  loading?:     boolean
}

export default function ConfirmModal({ message, confirmLabel, onConfirm, onCancel, loading = false }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm text-zinc-300">{message}</p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-[#D4537E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c0446e] disabled:opacity-50"
          >
            {loading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
