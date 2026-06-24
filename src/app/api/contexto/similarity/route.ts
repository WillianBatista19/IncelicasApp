import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmbeddingPipeline, cosineSimilarity, parseEmbedding } from '@/lib/transformers'

// Allow up to 5 min for cold model download on first request
export const maxDuration = 300

export async function POST(req: NextRequest) {
  let body: { guess?: unknown; playDate?: unknown }
  try {
    body = await req.json() as { guess?: unknown; playDate?: unknown }
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const guess    = typeof body.guess    === 'string' ? body.guess.trim().toLowerCase()    : null
  const playDate = typeof body.playDate === 'string' ? body.playDate.trim() : null
  if (!guess || !playDate) {
    return NextResponse.json({ error: 'guess e playDate são obrigatórios' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: row } = await supabase
    .from('contexto_words')
    .select('word, embedding')
    .eq('play_date', playDate)
    .single()

  if (!row?.embedding) {
    return NextResponse.json({ error: 'Nenhuma palavra disponível hoje.' }, { status: 404 })
  }

  // Exact match: reveal win without exposing the word
  if (guess === row.word.toLowerCase()) {
    return NextResponse.json({ similarity: 100, isCorrect: true })
  }

  const pipe      = await getEmbeddingPipeline()
  const output    = await pipe(guess, { pooling: 'mean', normalize: true })
  const guessEmb  = output.data as Float32Array
  const wordEmb   = parseEmbedding(row.embedding)

  const sim   = cosineSimilarity(guessEmb, wordEmb)
  // Cap at 99 so only exact string match returns 100
  const score = Math.max(0, Math.min(99, Math.round(sim * 100)))

  return NextResponse.json({ similarity: score, isCorrect: false })
}
