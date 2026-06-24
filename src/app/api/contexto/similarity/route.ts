import { NextRequest, NextResponse } from 'next/server'
import { createClient }             from '@/lib/supabase/server'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30

const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(GEMINI_EMBED_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:   'models/gemini-embedding-001',
      content: { parts: [{ text }] },
    }),
  })
  const data = await response.json() as Record<string, unknown>
  console.log('[Gemini Embed] status:', response.status, 'error:', (data as { error?: unknown }).error ?? 'none')
  if (!response.ok) throw new Error(`Gemini embed error ${response.status}: ${JSON.stringify(data)}`)
  return (data.embedding as { values: number[] }).values
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

export async function POST(req: NextRequest) {
  try {
    let body: { guess?: unknown; playDate?: unknown }
    try {
      body = await req.json() as { guess?: unknown; playDate?: unknown }
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const guess    = typeof body.guess    === 'string' ? body.guess.trim().toLowerCase() : null
    const playDate = typeof body.playDate === 'string' ? body.playDate.trim()            : null
    if (!guess || !playDate) {
      return NextResponse.json({ error: 'guess e playDate são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: wordData, error: dbErr } = await supabase
      .from('contexto_words')
      .select('word')
      .eq('play_date', playDate)
      .maybeSingle()

    if (dbErr) {
      console.error('[similarity] db error:', dbErr.message)
      return NextResponse.json({ error: dbErr.message }, { status: 500 })
    }

    if (!wordData) {
      return NextResponse.json(
        { error: 'Nenhuma palavra cadastrada para hoje. O admin precisa adicionar uma palavra em /jogar/admin' },
        { status: 404 },
      )
    }

    const secretWord = wordData.word.toLowerCase().trim()

    if (guess === secretWord) {
      return NextResponse.json({ similarity: 100, isCorrect: true })
    }

    const [secretEmbed, guessEmbed] = await Promise.all([
      getEmbedding(secretWord),
      getEmbedding(guess),
    ])

    const raw        = cosineSimilarity(secretEmbed, guessEmbed)
    const similarity = Math.min(99, Math.max(0, Math.round(raw * 100)))

    console.log(`[similarity] "${guess}" vs "${secretWord}" → cosine: ${raw.toFixed(4)}, score: ${similarity}`)
    return NextResponse.json({ similarity, isCorrect: false })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[similarity] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
