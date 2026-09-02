/**
 * HALLOWMARSH DESIGN TOKENS — single source of truth.
 * Rule: components never hardcode values; they consume CSS custom properties
 * mirrored in src/styles/base.css (kept in sync with this file; a codegen
 * step may replace the manual mirror later).
 *
 * Contrast ratios below are pre-verified against WCAG 2.1 AA
 * (>= 4.5:1 text, >= 3:1 UI components) and enforced by unit test
 * (src/__tests__/tokens.test.ts).
 */

export const colorTokens = {
  bg: '#0b0f0d',
  surface: '#121816',
  surfaceRaised: '#1a2320',
  accent: '#6fe3b2',
  accentStrong: '#8ff0c4',
  accentDim: '#3fae82',
  accentAlt: '#b39ddb',
  text: '#e6efea',
  textMuted: '#9db4aa',
  textFaint: '#7a9187',
  border: '#243230',
  borderStrong: '#33473f',
  danger: '#ff8a80',
  success: '#7bdc9a',
  warning: '#ffd479',
} as const

export type ColorTokenKey = keyof typeof colorTokens

/** fg/bg pairs that must meet WCAG AA; ratio is the minimum required. */
export type ContrastPair = {
  fg: ColorTokenKey
  bg: ColorTokenKey
  min: number
  label: string
}

export const contrastPairs: readonly ContrastPair[] = [
  { fg: 'text', bg: 'bg', min: 4.5, label: 'body text on page background' },
  { fg: 'text', bg: 'surface', min: 4.5, label: 'body text on surface' },
  { fg: 'text', bg: 'surfaceRaised', min: 4.5, label: 'body text on raised surface' },
  { fg: 'textMuted', bg: 'bg', min: 4.5, label: 'secondary text on background' },
  { fg: 'textMuted', bg: 'surface', min: 4.5, label: 'secondary text on surface' },
  { fg: 'textFaint', bg: 'bg', min: 4.5, label: 'faint text on background' },
  { fg: 'accent', bg: 'bg', min: 3, label: 'accent UI component on background' },
  { fg: 'accentDim', bg: 'surface', min: 3, label: 'accent-dim component on surface' },
  { fg: 'bg', bg: 'accent', min: 4.5, label: 'text on accent-filled button' },
  { fg: 'bg', bg: 'accentAlt', min: 4.5, label: 'text on alt-accent-filled button' },
] as const

export const motionTokens = {
  durationFast: 120,
  durationBase: 180,
  durationSlow: 250,
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const

export const spacingScale = [0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96] as const
export const radiusScale = { sm: 6, md: 10, lg: 16, full: 9999 } as const
export const zIndexScale = {
  base: 0,
  raised: 10,
  stickyNav: 100,
  dropdown: 200,
  modal: 300,
  toast: 400,
} as const
