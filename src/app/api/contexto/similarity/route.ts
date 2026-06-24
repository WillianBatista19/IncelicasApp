import { NextRequest, NextResponse } from 'next/server'
import { createClient }             from '@/lib/supabase/server'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`

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

    const response = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Rate the semantic similarity between these two Portuguese words on a scale from 0 to 100. Consider meaning, context, and associations. Return ONLY a single integer number, nothing else.\nWord 1: "${secretWord}"\nWord 2: "${guess}"\nSimilarity score (0-100):`,
          }],
        }],
        generationConfig: { maxOutputTokens: 10, temperature: 0 },
      }),
    })

    const data = await response.json() as Record<string, unknown>
    console.log('[Gemini] status:', response.status, 'response:', JSON.stringify(data))

    if (!response.ok) {
      console.error('[similarity] Gemini error:', response.status, JSON.stringify(data))
      return NextResponse.json({ error: `Gemini API error: ${response.status}` }, { status: 502 })
    }

    const text = (
      (data?.candidates as { content?: { parts?: { text?: string }[] } }[])?.[0]
        ?.content?.parts?.[0]?.text ?? ''
    ).trim()

    // Extract first integer found — handles "85", "85.", "Score: 85", etc.
    const match = text.match(/\d+/)
    const similarity = Math.min(99, Math.max(0, match ? parseInt(match[0]) : 0))

    console.log(`[similarity] "${guess}" vs "${secretWord}" → raw: "${text}", score: ${similarity}`)
    return NextResponse.json({ similarity, isCorrect: false })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[similarity] UNCAUGHT ERROR:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
