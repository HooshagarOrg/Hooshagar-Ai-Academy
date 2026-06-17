export type KnowledgeCategory = 'math' | 'science' | 'technology' | 'knowledge' | 'geometry'

export type KnowledgeSymbol = {
  id: string
  symbol: string
  category: KnowledgeCategory
  /** 0 = far, 1 = near */
  depth: number
  x: number
  y: number
  rotate?: number
  outlined?: boolean
}

const mathSymbols = ['π', '∫', 'Σ', 'Δ', 'θ', 'λ', 'Ω', 'x²', 'sin(x)', 'y=mx+b', 'cos(x)', 'tan(x)']
const scienceSymbols = ['E=mc²', 'F=ma', 'H₂O', 'CO₂', 'O₂', 'NaCl', 'CH₄', 'DNA', 'Atom']
const techSymbols = ['AI', 'ML', '{}', '</>', 'fn()', 'Python', 'TS', 'Algo', '101010', 'Neural']
const knowledgeSymbols = [
  'فارسی', 'ادبیات', 'ریاضی', 'فیزیک', 'شیمی', 'هندسه', 'یادگیری', 'دانش', 'آموزش',
  'Learning', 'Knowledge', 'Science', 'Future', 'Innovation', 'Education',
]
const geometrySymbols = ['△', '□', '◯', '∠', '⊥', '∥']

function seededPositions(
  symbols: string[],
  category: KnowledgeCategory,
  depth: number,
  opacityBase: number,
  startIdx: number,
): KnowledgeSymbol[] {
  return symbols.map((symbol, i) => {
    const t = (startIdx + i) * 0.618033988749895
    const x = 4 + ((t * 97) % 92)
    const y = 6 + (((t * 1.37) * 89) % 88)
    const rotate = category === 'geometry' ? ((t * 40) % 24) - 12 : ((t * 12) % 8) - 4
    return {
      id: `${category}-${i}`,
      symbol,
      category,
      depth,
      x,
      y,
      rotate,
      outlined: category === 'geometry',
    }
  })
}

export const KNOWLEDGE_UNIVERSE_SYMBOLS: KnowledgeSymbol[] = [
  ...seededPositions(mathSymbols, 'math', 0.15, 0.28, 0),
  ...seededPositions(scienceSymbols, 'science', 0.35, 0.42, 20),
  ...seededPositions(techSymbols, 'technology', 0.55, 0.55, 35),
  ...seededPositions(knowledgeSymbols, 'knowledge', 0.82, 0.72, 50),
  ...seededPositions(geometrySymbols, 'geometry', 0.25, 0.22, 70),
]

export function depthStyle(depth: number) {
  const scale = 0.55 + depth * 0.65
  const opacity = 0.18 + depth * 0.55
  const blur = (1 - depth) * 1.2
  return { scale, opacity, blur }
}

export function isPersianSymbol(symbol: string) {
  return /[\u0600-\u06FF]/.test(symbol)
}
