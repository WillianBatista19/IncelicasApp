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
