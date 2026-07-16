/**
 * Embedding helper — Gemini text-embedding-004 (768-dim)
 */

const EMBEDDING_MODEL = 'text-embedding-004'
const EMBEDDING_DIM = 768

export function getExpectedEmbeddingDim(): number {
  return EMBEDDING_DIM
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
          }),
          signal: AbortSignal.timeout(30_000),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const values = data.embedding?.values as number[] | undefined
        if (values?.length) return values
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
          model: 'google/text-embedding-004',
          input: trimmed,
        }),
        signal: AbortSignal.timeout(30_000),
      })

      if (response.ok) {
        const data = await response.json()
        const values = data.data?.[0]?.embedding as number[] | undefined
        if (values?.length) return values
      }
    } catch (err) {
      console.warn('[embedding] OpenRouter failed:', err)
    }
  }

  return null
}
