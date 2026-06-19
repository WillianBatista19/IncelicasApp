import type { ReactNode } from 'react'
import AppNav from '@/components/AppNav'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppNav />
      <div className="mx-auto max-w-5xl px-4 pt-20 pb-12">
        {children}
      </div>
    </>
  )
}
