'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Shortcut } from '@/types'

export type AddShortcutData = {
  type: 'community' | 'game'
  slug: string
  name: string
  icon: string | null
  url:  string
}

type UserContextValue = {
  user:             User | null
  loading:          boolean
  signOut:          () => Promise<void>
  shortcuts:        Shortcut[]
  shortcutsLoading: boolean
  isShortcutted:    (url: string) => boolean
  addShortcut:      (data: AddShortcutData) => Promise<{ error?: string }>
  removeShortcut:   (url: string) => Promise<{ error?: string }>
  reorderShortcuts: (orderedIds: string[]) => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  user:             null,
  loading:          true,
  signOut:          async () => {},
  shortcuts:        [],
  shortcutsLoading: false,
  isShortcutted:    () => false,
  addShortcut:      async () => ({}),
  removeShortcut:   async () => ({}),
  reorderShortcuts: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user,             setUser]             = useState<User | null>(null)
  const [loading,          setLoading]          = useState(true)
  const [shortcuts,        setShortcuts]        = useState<Shortcut[]>([])
  const [shortcutsLoading, setShortcutsLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // Auth listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      },
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // Load shortcuts when user changes
  useEffect(() => {
    if (!user) { setShortcuts([]); return }
    setShortcutsLoading(true)
    supabase
      .from('user_shortcuts')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order')
      .then(({ data }) => {
        setShortcuts((data ?? []) as Shortcut[])
        setShortcutsLoading(false)
      })
  }, [user, supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const isShortcutted = useCallback((url: string) => {
    return shortcuts.some(s => s.url === url)
  }, [shortcuts])

  const addShortcut = useCallback(async (data: AddShortcutData): Promise<{ error?: string }> => {
    if (!user) return { error: 'Login necessário' }
    if (shortcuts.length >= 8) {
      return { error: 'Limite de atalhos atingido. Remova um antes de adicionar.' }
    }

    const row = {
      user_id:       user.id,
      type:          data.type,
      slug:          data.slug,
      name:          data.name,
      icon:          data.icon,
      url:           data.url,
      display_order: shortcuts.length,
    }

    const { data: inserted, error } = await supabase
      .from('user_shortcuts')
      .insert(row)
      .select()
      .single()

    if (error) return { error: error.message }
    setShortcuts(prev => [...prev, inserted as Shortcut])
    return {}
  }, [user, shortcuts, supabase])

  const removeShortcut = useCallback(async (url: string): Promise<{ error?: string }> => {
    if (!user) return { error: 'Login necessário' }
    // Optimistic
    setShortcuts(prev => prev.filter(s => s.url !== url))
    const { error } = await supabase
      .from('user_shortcuts')
      .delete()
      .eq('user_id', user.id)
      .eq('url', url)
    if (error) {
      console.error('removeShortcut failed:', error.message)
      return { error: error.message }
    }
    return {}
  }, [user, supabase])

  const reorderShortcuts = useCallback(async (orderedIds: string[]) => {
    // Optimistic reorder
    const reordered = orderedIds
      .map((id, i) => {
        const s = shortcuts.find(s => s.id === id)
        return s ? { ...s, display_order: i } : null
      })
      .filter((s): s is Shortcut => s !== null)
    setShortcuts(reordered)

    // Persist all display_order updates in parallel
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase.from('user_shortcuts').update({ display_order: i }).eq('id', id),
      ),
    )
  }, [shortcuts, supabase])

  return (
    <UserContext.Provider value={{
      user, loading, signOut,
      shortcuts, shortcutsLoading,
      isShortcutted, addShortcut, removeShortcut, reorderShortcuts,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
