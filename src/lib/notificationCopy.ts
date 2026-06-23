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
    case 'message':
      return `${actorName} te mandou uma mensagem`
    case 'group_message':
      return `${actorName} enviou uma mensagem em grupo`
    case 'story_like':
      return `${actorName} curtiu seu story`
    case 'follow_request':
      return `${actorName} quer te seguir`
    case 'follow_accepted':
      return `${actorName} aceitou seu pedido de seguir`
    case 'community_post':
      return commentContent
        ? `${actorName} postou em ${commentContent}`
        : `${actorName} postou em uma comunidade`
    case 'community_comment':
      return commentContent
        ? `${actorName} comentou no seu post em ${commentContent}`
        : `${actorName} comentou no seu post`
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
    case 'comment_like':   return '❤️'
    case 'message':        return '💬'
    case 'group_message':  return '💬'
    case 'story_like':       return '❤️'
    case 'follow_request':   return '🔒'
    case 'follow_accepted':    return '✅'
    case 'community_post':     return '🏘️'
    case 'community_comment':  return '💬'
  }
}

// Returns the href the notification should link to
export function notificationHref(
  type:      NotificationType,
  username:  string,
  postId:    string | null,
  commentId: string | null = null,
): string {
  switch (type) {
    case 'follow':
    case 'follow_back':
      return `/profile/${username}`
    case 'comment':
    case 'comment_reply':
    case 'comment_like':
      if (postId) {
        return commentId ? `/post/${postId}?comment=${commentId}` : `/post/${postId}`
      }
      return `/profile/${username}`
    case 'message':
    case 'group_message':
      return '/messages'
    case 'repost':
      return postId ? `/post/${postId}` : `/profile/${username}`
    case 'story_like':
    case 'follow_request':
      return `/profile/${username}`
    case 'follow_accepted':
      return `/profile/${username}`
    case 'community_post':
    case 'community_comment':
      return '/communities'
    default:
      // vibe, mention
      return postId ? `/post/${postId}` : `/profile/${username}`
  }
}
