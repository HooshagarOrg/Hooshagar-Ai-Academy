/** مسیرهای برند و رسانه — لندینگ و auth سینمایی */

export const brandAssets = {
  logo: '/brand/logo.png?v=20260709',
  heroVideo: '/videos/hero.mp4',
  talentGarden: '/images/talent-garden.png',
} as const

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
  sms: '#A78BFA',
} as const

/** @deprecated Use luxColors */
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
  hero: 'linear-gradient(180deg, #12151C 0%, #0B0D12 100%)',
  heroDark: 'linear-gradient(180deg, #12151C 0%, #0B0D12 100%)',
  bodyLight: '#F4F7FC',
  soft: 'linear-gradient(135deg, rgba(255,77,166,0.12) 0%, rgba(84,210,255,0.08) 100%)',
  glass: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
} as const
