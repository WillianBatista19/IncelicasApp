import { NextRequest, NextResponse } from 'next/server'
import { createClient }             from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HF_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
const HF_URL   = `https://api-inference.huggingface.co/models/${HF_MODEL}`

async function callHuggingFace(
  sourceWord: string,
  guess:      string,
  apiKey:     string,
  attempt = 1,
): Promise<number> {
  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), 15_000)

  let hfRes: Response
  try {
    hfRes = await fetch(HF_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body:   JSON.stringify({ inputs: { source_sentence: sourceWord, sentences: [guess] } }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }

  console.log(`[similarity] HF status: ${hfRes.status} (attempt ${attempt})`)

  // Model warming up — retry once after a short wait
  if (hfRes.status === 503 && attempt === 1) {
    const body = await hfRes.text()
    console.log('[similarity] HF 503 body:', body)
    await new Promise(r => setTimeout(r, 5_000))
    return callHuggingFace(sourceWord, guess, apiKey, 2)
  }

  if (!hfRes.ok) {
    const body = await hfRes.text()
    console.error(`[similarity] HF error ${hfRes.status}:`, body)
    throw new Error(`HF API ${hfRes.status}: ${body.slice(0, 200)}`)
  }

  const result = await hfRes.json() as unknown
  console.log('[similarity] HF result:', JSON.stringify(result))

  // Check for loading error in successful-status responses
  if (
    result !== null &&
    typeof result === 'object' &&
    'error' in result &&
    typeof (result as Record<string, unknown>).error === 'string' &&
    ((result as Record<string, unknown>).error as string).toLowerCase().includes('loading')
  ) {
    if (attempt === 1) {
      console.log('[similarity] model still loading, retrying in 5s...')
      await new Promise(r => setTimeout(r, 5_000))
      return callHuggingFace(sourceWord, guess, apiKey, 2)
    }
    throw new Error('Model still loading after retry')
  }

  const rawScore = Array.isArray(result) ? (result[0] as number) : 0
  return Math.max(0, Math.min(99, Math.round(rawScore * 100)))
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

    // Exact match — no API call needed
    if (guess === secretWord) {
      return NextResponse.json({ similarity: 100, isCorrect: true })
    }

    const apiKey = process.env.HUGGING_FACE_API_KEY
    if (!apiKey) {
      console.error('[similarity] HUGGING_FACE_API_KEY not set')
      return NextResponse.json({ error: 'Configuração de API ausente.' }, { status: 500 })
    }

    try {
      const similarity = await callHuggingFace(secretWord, guess, apiKey)
      console.log(`[similarity] "${guess}" vs "${secretWord}" → ${similarity}`)
      return NextResponse.json({ similarity, isCorrect: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[similarity] HF call failed:', message)
      return NextResponse.json({ error: `Erro na API de similaridade: ${message}` }, { status: 502 })
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[similarity] UNCAUGHT ERROR:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
