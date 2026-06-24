import { NextRequest, NextResponse } from 'next/server'
import { createClient }       from '@/lib/supabase/server'
import { createAdminClient }  from '@/lib/supabase/admin'
import { getEmbeddingPipeline } from '@/lib/transformers'

export const maxDuration = 300

const ADMIN_USERNAME = 'incelicasappoficial'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()
  if (profile?.username !== ADMIN_USERNAME) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { word?: unknown; playDate?: unknown }
  try {
    body = await req.json() as { word?: unknown; playDate?: unknown }
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const word     = typeof body.word     === 'string' ? body.word.trim().toLowerCase() : null
  const playDate = typeof body.playDate === 'string' ? body.playDate.trim()           : null
  if (!word || !playDate) {
    return NextResponse.json({ error: 'word e playDate são obrigatórios' }, { status: 400 })
  }

  const pipe      = await getEmbeddingPipeline()
  const output    = await pipe(word, { pooling: 'mean', normalize: true })
  const embedding = Array.from(output.data as Float32Array) as number[]

  const admin = createAdminClient()
  const { error } = await admin
    .from('contexto_words')
    .upsert({ word, play_date: playDate, embedding }, { onConflict: 'play_date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, word, playDate })
}
