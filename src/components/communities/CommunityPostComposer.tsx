'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { createCommunityPost } from '@/app/(app)/communities/actions'

interface Props {
  communityId:   string
  currentUserId: string
  onPost?:       () => void
}

export default function CommunityPostComposer({ communityId, currentUserId, onPost }: Props) {
  const supabase = createClient()

  const [text,      setText]      = useState('')
  const [mediaUrl,  setMediaUrl]  = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fileInputRef   = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if ((!text.trim() && !imageFile && !mediaUrl.trim()) || loading) return
    setLoading(true)
    setError(null)

    try {
      let uploadedImageUrl: string | null = null

      if (imageFile) {
        const ext  = imageFile.name.split('.').pop() || 'bin'
        const path = `community/${communityId}/${currentUserId}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('post-images')
          .upload(path, imageFile, { contentType: imageFile.type })

        if (uploadErr) {
          setError('Erro ao enviar imagem. Tenta de novo.')
          setLoading(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
        uploadedImageUrl = publicUrl
      }

      await createCommunityPost(
        communityId,
        text.trim(),
        uploadedImageUrl,
        mediaUrl.trim() || null,
      )

      setText('')
      setMediaUrl('')
      removeImage()
      onPost?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao postar')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = (text.trim().length > 0 || !!imageFile || mediaUrl.trim().length > 0) && !loading

  return (
    <form onSubmit={submit} className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Posta algo na comunidade…"
        rows={3}
        className="w-full resize-none rounded-lg bg-zinc-800/60 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D4537E]"
      />

      {imagePreview && (
        <div className="relative w-full max-h-60 overflow-hidden rounded-xl">
          <Image
            src={imagePreview}
            alt="preview"
            width={600} height={400}
            className="w-full object-cover rounded-xl"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white hover:bg-black/90"
            aria-label="Remover imagem"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="space-y-2">
        <input
          type="text"
          value={mediaUrl}
          onChange={e => setMediaUrl(e.target.value)}
          placeholder="Link do Spotify ou YouTube (opcional)"
          className="w-full rounded-lg bg-zinc-800/60 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D4537E]"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Adicionar foto"
            title="Foto da galeria"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Tirar foto"
            title="Câmera"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-[#D4537E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition"
        >
          {loading ? 'Postando…' : 'Postar'}
        </button>
      </div>
    </form>
  )
}
