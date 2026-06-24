// Singleton embedding pipeline — shared across API routes in the same Node.js process

/* eslint-disable @typescript-eslint/no-explicit-any */
let pipelineCache: any = null
let pipelinePromise: Promise<any> | null = null

export async function getEmbeddingPipeline(): Promise<any> {
  if (pipelineCache) return pipelineCache
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import('@xenova/transformers')
      const p = await pipeline(
        'feature-extraction',
        'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
      )
      pipelineCache = p
      pipelinePromise = null
      return p
    })()
  }
  return pipelinePromise
}

export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na  += a[i] * a[i]
    nb  += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export function parseEmbedding(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw as number[]
  if (typeof raw === 'string') return JSON.parse(raw) as number[]
  throw new Error('Invalid embedding format')
}
