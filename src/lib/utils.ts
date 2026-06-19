export function relativeTime(dateStr: string): string {
  const diff    = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours   = Math.floor(minutes / 60)
  const days    = Math.floor(hours / 24)

  if (seconds < 60)  return 'agora'
  if (minutes < 60)  return `${minutes}min`
  if (hours < 24)    return `${hours}h`
  if (days < 7)      return `${days}d`

  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

export function parseSpotifyUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('spotify.com')) return null
    const match = u.pathname.match(/\/(track|album|playlist|artist)\/([A-Za-z0-9]+)/)
    if (!match) return null
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`
  } catch {
    return null
  }
}

export function parseYouTubeUrl(url: string): string | null {
  try {
    const u = new URL(url)
    let videoId: string | null = null

    if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v')
    } else if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.slice(1).split('?')[0]
    }

    if (!videoId) return null
    return `https://www.youtube.com/embed/${videoId}`
  } catch {
    return null
  }
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
