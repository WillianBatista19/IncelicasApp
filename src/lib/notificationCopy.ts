import type { NotificationType } from '@/types'

function excerpt(text: string, max = 60) {
  const trimmed = text.trim()
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max).trimEnd() + '…'
}

export function notificationText(
  type:           NotificationType,
  actorName:      string,
  commentContent: string | null = null,
): string {
  switch (type) {
    case 'vibe':
      return `${actorName} achou seu post uma vibe`
    case 'comment':
      return commentContent
        ? `${actorName} comentou no seu post: "${excerpt(commentContent)}"`
        : `${actorName} comentou no seu post`
    case 'follow':
      return `${actorName} te incelicou`
    case 'mention':
      return `${actorName} te marcou em um post`
    case 'repost':
      return `${actorName} incelicou seu post`
    case 'follow_back':
      return `${actorName} te seguiu de volta, incelica!`
    case 'comment_reply':
      return `${actorName} respondeu seu comentário`
    case 'comment_like':
      return `${actorName} curtiu seu comentário`
  }
}

export function notificationEmoji(type: NotificationType): string {
  switch (type) {
    case 'vibe':          return '🔥'
    case 'comment':       return '💬'
    case 'follow':        return '👑'
    case 'mention':       return '📣'
    case 'repost':        return '🔁'
    case 'follow_back':   return '💜'
    case 'comment_reply': return '↩️'
    case 'comment_like':  return '❤️'
  }
}

// Returns the href the notification should link to
export function notificationHref(
  type:     NotificationType,
  username: string,
  postId:   string | null,
): string {
  // All post-related notifications link to the actor's profile for now
  // (no dedicated /post/[id] page yet)
  switch (type) {
    case 'follow':
    case 'follow_back':
      return `/profile/${username}`
    default:
      return `/profile/${username}`
  }
}
