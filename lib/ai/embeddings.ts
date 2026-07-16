/**
 * Embedding helper — Gemini gemini-embedding-001 (768-dim)
 * text-embedding-004 دیگر در API رایگان در دسترس نیست.
 */

export const EMBEDDING_MODEL = 'gemini-embedding-001'
const EMBEDDING_DIM = 768

export function getExpectedEmbeddingDim(): number {
  return EMBEDDING_DIM
}

export function getEmbeddingModelName(): string {
  return EMBEDDING_MODEL
}

/** نرمال‌سازی L2 — برای gemini-embedding-001 در ابعاد غیر از 3072 لازم است */
function l2Normalize(values: number[]): number[] {
  let sumSq = 0
  for (const v of values) sumSq += v * v
  const norm = Math.sqrt(sumSq)
  if (!norm || !Number.isFinite(norm)) return values
  return values.map((v) => v / norm)
}

/**
 * تولید embedding از Gemini مستقیم، fallback به OpenRouter
 */
export async function getTextEmbedding(text: string): Promise<number[] | null> {
  const trimmed = text.trim().slice(0, 8000)
  if (!trimmed) return null

  const googleKey =
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_API_KEY_1 ||
    process.env.GEMINI_API_KEY_1

  if (googleKey) {
    try {
      const proxyBase =
        process.env.NEXT_PUBLIC_GEMINI_PROXY ||
        'https://generativelanguage.googleapis.com'
      const response = await fetch(
        `${proxyBase}/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text: trimmed }] },
            outputDimensionality: EMBEDDING_DIM,
          }),
          signal: AbortSignal.timeout(30_000),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const values = data.embedding?.values as number[] | undefined
        if (values?.length === EMBEDDING_DIM) {
          return l2Normalize(values)
        }
      } else {
        const errText = await response.text().catch(() => '')
        console.warn('[embedding] Gemini HTTP', response.status, errText.slice(0, 200))
      }
    } catch (err) {
      console.warn('[embedding] Gemini failed:', err)
    }
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY
  if (openrouterKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-embedding-001',
          input: trimmed,
          dimensions: EMBEDDING_DIM,
        }),
        signal: AbortSignal.timeout(30_000),
      })

      if (response.ok) {
        const data = await response.json()
        const values = data.data?.[0]?.embedding as number[] | undefined
        if (values?.length === EMBEDDING_DIM) {
          return l2Normalize(values)
        }
      }
    } catch (err) {
      console.warn('[embedding] OpenRouter failed:', err)
    }
  }

  return null
}
