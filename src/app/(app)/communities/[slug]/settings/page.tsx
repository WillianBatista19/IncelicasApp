import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CommunitySettingsForm from '@/components/communities/CommunitySettingsForm'
import type { Community } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CommunitySettingsPage({ params }: Props) {
  const { slug }  = await params
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, description, avatar_url, banner_url, created_by, member_count, post_permission, created_at')
    .eq('slug', slug)
    .single()

  if (!community) notFound()

  const c = community as Community

  const { data: memberRow } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', c.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberRow?.role !== 'owner') redirect(`/communities/${slug}`)

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <a href={`/communities/${slug}`} className="text-zinc-400 hover:text-white">← Voltar</a>
        <h1 className="text-lg font-bold text-white">Configurações de {c.name}</h1>
      </div>
      <CommunitySettingsForm community={c} />
    </main>
  )
}
