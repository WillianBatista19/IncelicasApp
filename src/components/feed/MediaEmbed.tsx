'use client'

import { parseSpotifyUrl, parseYouTubeUrl } from '@/lib/utils'

export default function MediaEmbed({
  spotifyUrl,
  youtubeUrl,
}: {
  spotifyUrl: string | null
  youtubeUrl: string | null
}) {
  const spotify = spotifyUrl ? parseSpotifyUrl(spotifyUrl) : null
  const youtube = youtubeUrl ? parseYouTubeUrl(youtubeUrl)  : null

  if (!spotify && !youtube) return null

  if (spotify) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl">
        <iframe
          src={spotify}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="border-0"
        />
      </div>
    )
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl aspect-video">
      <iframe
        src={youtube!}
        width="100%"
        height="100%"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="border-0 h-full w-full"
      />
    </div>
  )
}
