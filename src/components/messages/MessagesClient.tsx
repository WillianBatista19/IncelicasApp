'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import { markConversationRead, createMessageNotification } from '@/app/(app)/messages/actions'
import type { ConversationMessage, ConversationSummary } from '@/types'

type Props = {
  currentUserId:        string
  initialConversations: ConversationSummary[]
  activeConversationId: string | null
  initialMessages:      ConversationMessage[]
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)  return 'agora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function MessagesClient({
  currentUserId,
  initialConversations,
  activeConversationId,
  initialMessages,
}: Props) {
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [conversations,  setConversations]  = useState<ConversationSummary[]>(initialConversations)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConversationId)
  const [messages,       setMessages]       = useState<ConversationMessage[]>(initialMessages)
  const [input,          setInput]          = useState('')
  const [sending,        setSending]        = useState(false)
  const [showThread,     setShowThread]     = useState(!!activeConversationId)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  const selectedConv = conversations.find(c => c.id === selectedConvId) ?? null

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load messages when selected conversation changes
  useEffect(() => {
    if (!selectedConvId) return

    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .eq('conversation_id', selectedConvId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data ?? []) as ConversationMessage[])
      })

    void markConversationRead(selectedConvId)

    setConversations(prev =>
      prev.map(c => c.id === selectedConvId ? { ...c, lastReadAt: new Date().toISOString() } : c),
    )
  }, [selectedConvId, supabase])

  // Realtime: subscribe to incoming messages in current conversation
  useEffect(() => {
    if (!selectedConvId) return

    const ch = supabase
      .channel(`thread-${selectedConvId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConvId}` },
        payload => {
          const newMsg = payload.new as ConversationMessage
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
          if (newMsg.sender_id !== currentUserId) {
            void markConversationRead(selectedConvId)
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [supabase, selectedConvId, currentUserId])

  // Realtime: update conversation list last message for all conversations
  useEffect(() => {
    const ch = supabase
      .channel('conv-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const newMsg = payload.new as ConversationMessage
          setConversations(prev =>
            prev
              .map(c => c.id === newMsg.conversation_id ? { ...c, lastMessage: newMsg } : c)
              .sort((a, b) => {
                const at = a.lastMessage?.created_at ?? ''
                const bt = b.lastMessage?.created_at ?? ''
                return bt.localeCompare(at)
              }),
          )
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [supabase])

  function selectConversation(convId: string) {
    setSelectedConvId(convId)
    setShowThread(true)
    setMessages([])
    router.push(`/messages/${convId}`)
  }

  const sendMessage = useCallback(async () => {
    if (!selectedConvId || !input.trim() || sending) return
    const content = input.trim()
    setSending(true)
    setInput('')

    const tempId = `temp-${Date.now()}`
    const tempMsg: ConversationMessage = {
      id:              tempId,
      conversation_id: selectedConvId,
      sender_id:       currentUserId,
      content,
      created_at:      new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: selectedConvId, sender_id: currentUserId, content })
      .select('id, conversation_id, sender_id, content, created_at')
      .single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(content)
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? (data as ConversationMessage) : m))
      if (selectedConv) void createMessageNotification(selectedConv.otherUser.id)
    }

    setSending(false)
    inputRef.current?.focus()
  }, [selectedConvId, input, sending, supabase, currentUserId])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  function isUnread(conv: ConversationSummary): boolean {
    if (!conv.lastMessage) return false
    if (conv.lastMessage.sender_id === currentUserId) return false
    if (!conv.lastReadAt) return true
    return conv.lastMessage.created_at > conv.lastReadAt
  }

  return (
    <div
      className="-mx-4 sm:mx-0 flex overflow-hidden sm:rounded-2xl border-y sm:border border-zinc-800 bg-zinc-950"
      style={{ height: 'calc(100dvh - 5rem)', minHeight: '480px' }}
    >
      {/* Left panel — conversation list */}
      <div className={`flex w-full flex-col border-r border-zinc-800 sm:w-72 sm:shrink-0 ${showThread ? 'hidden sm:flex' : 'flex'}`}>
        <div className="shrink-0 border-b border-zinc-800 px-4 py-3.5">
          <h1 className="text-base font-bold text-zinc-100">Mensagens</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <span className="text-3xl">💬</span>
              <p className="text-sm text-zinc-500 px-6">
                Nenhuma conversa ainda. Manda uma mensagem para alguém!
              </p>
            </div>
          ) : (
            conversations.map(conv => {
              const unread = isUnread(conv)
              const active = conv.id === selectedConvId
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    active
                      ? 'bg-[#D4537E]/10'
                      : 'hover:bg-zinc-900'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={conv.otherUser.avatar_url}
                      name={conv.otherUser.display_name || conv.otherUser.username}
                      size="sm"
                    />
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-[#D4537E]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`truncate text-sm ${unread ? 'font-bold text-zinc-100' : 'font-medium text-zinc-300'}`}>
                        {conv.otherUser.display_name || conv.otherUser.username}
                      </p>
                      {conv.lastMessage && (
                        <span className="shrink-0 text-[10px] text-zinc-600">
                          {relativeTime(conv.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className={`truncate text-xs ${unread ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {conv.lastMessage.sender_id === currentUserId ? 'Você: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right panel — thread */}
      <div className={`flex flex-1 flex-col overflow-hidden ${!showThread ? 'hidden sm:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Thread header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-4 py-3">
              <button
                type="button"
                onClick={() => setShowThread(false)}
                className="shrink-0 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 sm:hidden"
                aria-label="Voltar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-5 w-5" aria-hidden>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <Link
                href={`/profile/${selectedConv.otherUser.username}`}
                className="flex items-center gap-3 transition-opacity hover:opacity-75"
              >
                <Avatar
                  src={selectedConv.otherUser.avatar_url}
                  name={selectedConv.otherUser.display_name || selectedConv.otherUser.username}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-bold text-zinc-100 leading-none">
                    {selectedConv.otherUser.display_name || selectedConv.otherUser.username}
                  </p>
                  <p className="text-xs text-zinc-500">@{selectedConv.otherUser.username}</p>
                </div>
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <p className="py-8 text-center text-xs text-zinc-600">
                  Nenhuma mensagem ainda. Diz oi! 👋
                </p>
              )}
              {messages.map((msg, i) => {
                const mine  = msg.sender_id === currentUserId
                const prev  = messages[i - 1]
                const sameGroup = prev && prev.sender_id === msg.sender_id
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} ${sameGroup ? 'mt-0.5' : 'mt-3'}`}>
                    <div className={`group relative max-w-[75%]`}>
                      <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        mine
                          ? 'rounded-br-sm bg-[#D4537E] text-white'
                          : 'rounded-bl-sm bg-zinc-800 text-zinc-100'
                      } ${msg.id.startsWith('temp-') ? 'opacity-60' : ''}`}>
                        {msg.content}
                      </div>
                      <p className={`mt-0.5 hidden text-[10px] text-zinc-600 group-hover:block ${mine ? 'text-right' : 'text-left'}`}>
                        {relativeTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-zinc-800 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva uma mensagem…"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-[#D4537E]/60 focus:ring-1 focus:ring-[#D4537E]/30"
                  style={{ maxHeight: '120px' }}
                  onInput={e => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = `${el.scrollHeight}px`
                  }}
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || sending}
                  aria-label="Enviar mensagem"
                  className="shrink-0 rounded-xl bg-[#D4537E] p-2.5 text-white transition-all hover:bg-[#c0476f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-zinc-700">Enter para enviar · Shift+Enter para nova linha</p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <span className="text-5xl">💬</span>
            <p className="text-sm text-zinc-500 max-w-xs">
              Selecione uma conversa para começar
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
