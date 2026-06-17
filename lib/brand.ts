/** مسیرهای رسمی لوگو و آیکون */
export const brandAssets = {
  logo: '/logo.png',
  logoFull: '/brand/logo-full.png',
  favicon: '/favicon.ico',
  appleTouchIcon: '/apple-touch-icon.png',
  icon192: '/icons/icon-192x192.png',
  icon512: '/icons/icon-512x512.png',
} as const

/** پالت برند هوشاگر — Soft Futurism / Smart Soft Dark */
export const brandColors = {
  space: '#161C25',
  surface: '#1C222C',
  elevated: '#222936',
  pink: '#FF4DA6',
  gold: '#C9A962',
  goldLight: '#DFC98A',
  champagne: '#E8DCC0',
  teal: '#2A6B6B',
  orange: '#FF9B54',
  purple: '#8B7CFF',
  cyan: '#54D2FF',
  green: '#39D98A',
  yellow: '#FFD166',
  textPrimary: '#F5F7FA',
  textSecondary: '#B5BED1',
  /* legacy */
  magenta: '#FF4DA6',
  magentaDark: '#E03D8F',
  orangeLight: '#FFB07A',
  blue: '#54D2FF',
  blueDeep: '#3BB8E8',
  coral: '#FF9B54',
  slate: '#10131A',
} as const

export const brandGradient = {
  primary: 'linear-gradient(135deg, #C9A962 0%, #DFC98A 50%, #8B7CFF 100%)',
  warm: 'linear-gradient(135deg, #C9A962 0%, #FF9B54 55%, #FFD166 100%)',
  hero:
    'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(255,77,166,0.25), transparent 50%), radial-gradient(ellipse 80% 60% at 100% 50%, rgba(139,124,255,0.15), transparent 45%), #161C25',
  soft: 'linear-gradient(135deg, rgba(255,77,166,0.12) 0%, rgba(84,210,255,0.08) 100%)',
  glass:
    'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
} as const
