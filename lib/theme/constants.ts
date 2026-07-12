export const UI_THEMES = ['light', 'dark'] as const
export type UiTheme = (typeof UI_THEMES)[number]

export const DEFAULT_UI_THEME: UiTheme = 'dark'

export function isUiTheme(value: unknown): value is UiTheme {
  return value === 'light' || value === 'dark'
}
