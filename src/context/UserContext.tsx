'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type UserContextValue = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // useMemo keeps the same client instance across renders so the
  // useEffect dependency never changes and the effect only runs once.
  const supabase = useMemo(() => createClient(), [])

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

  const signOut = async () => { await supabase.auth.signOut() }

  return (
    <UserContext.Provider value={{ user, loading, signOut }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
