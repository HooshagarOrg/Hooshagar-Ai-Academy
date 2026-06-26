/** مسیرهای رسمی لوگو و آیکون */
export const brandAssets = {
  logo: '/brand/hooshagaar-logo-2026.png',
  logoFull: '/brand/logo-full.png',
  heroVideo: '/videos/ai-processor-reveal.mp4',
  heroVideoLegacy: '/videos/hero.mp4',
  favicon: '/favicon.ico',
  appleTouchIcon: '/apple-touch-icon.png',
  icon192: '/icons/icon-192x192.png',
  icon512: '/icons/icon-512x512.png',
} as const

/** پالت Luxury AI Futurism */
export const luxColors = {
  primary: '#8B7CFF',
  secondary: '#54D2FF',
  accent: '#FF4DA6',
  gold: '#C9A962',
  success: '#39D98A',
  void: '#0B0D12',
  hero: '#12151C',
  elevated: '#161B26',
  body: '#1A1F2E',
  text: '#F1F5F9',
  textMuted: '#8B9AB0',
} as const

export const arcColors = {
  parent: '#F59E0B',
  teacher: '#10B981',
  admin: '#EC4899',
  counselor: '#EF4444',
  student: '#8B7CFF',
} as const

/** @deprecated Use luxColors — kept for legacy imports */
export const brandColors = {
  space: '#E6EBF4',
  surface: '#F5F8FD',
  elevated: '#DCE6F5',
  pink: '#FF4DA6',
  gold: '#FFB347',
  goldLight: '#FFD18A',
  champagne: '#FFF3D8',
  teal: '#54D2FF',
  orange: '#FFB347',
  purple: '#8B7CFF',
  cyan: '#54D2FF',
  green: '#39D98A',
  yellow: '#FFB347',
  textPrimary: '#111827',
  textSecondary: '#64748B',
  magenta: '#FF4DA6',
  magentaDark: '#E03D8F',
  orangeLight: '#FFB07A',
  blue: '#54D2FF',
  blueDeep: '#3BB8E8',
  coral: '#FF9B54',
  slate: '#111827',
} as const

export const brandGradient = {
  primary: 'linear-gradient(135deg, #C9A962 0%, #DFC98A 50%, #8B7CFF 100%)',
  warm: 'linear-gradient(135deg, #C9A962 0%, #FF9B54 55%, #FFD166 100%)',
  hero:
    'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(255,77,166,0.25), transparent 50%), radial-gradient(ellipse 80% 60% at 100% 50%, rgba(139,124,255,0.15), transparent 45%), #161C25',
  heroDark:
    'radial-gradient(ellipse 80% 60% at 15% 0%, rgba(139,124,255,0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 10%, rgba(84,210,255,0.16), transparent 52%), #12151C',
  bodyLight:
    'radial-gradient(ellipse 60% 42% at 12% 10%, rgba(139,124,255,0.12), transparent 58%), radial-gradient(ellipse 54% 40% at 88% 6%, rgba(84,210,255,0.1), transparent 60%), #D8DEE8',
  soft: 'linear-gradient(135deg, rgba(255,77,166,0.12) 0%, rgba(84,210,255,0.08) 100%)',
  glass:
    'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
} as const
