export const UI_THEMES = ['light', 'warm', 'dark'] as const
export type UiTheme = (typeof UI_THEMES)[number]

export const DEFAULT_UI_THEME: UiTheme = 'dark'

export const UI_THEME_LABELS: Record<UiTheme, string> = {
  light: 'روشن',
  warm: 'گرم',
  dark: 'تیره',
}

export function isUiTheme(value: unknown): value is UiTheme {
  return value === 'light' || value === 'warm' || value === 'dark'
}
