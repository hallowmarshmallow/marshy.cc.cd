import { describe, it, expect } from 'vitest'
import { contrastPairs, colorTokens, motionTokens, spacingScale } from '../styles/tokens'
import { ERROR_CODES } from '../services/errors'

/** WCAG relative-luminance + contrast ratio (the real math, not an approximation). */
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(fgHex: string, bgHex: string): number {
  const l1 = luminance(fgHex)
  const l2 = luminance(bgHex)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

describe('design tokens', () => {
  it('all declared contrast pairs meet WCAG AA minimums', () => {
    for (const pair of contrastPairs) {
      const ratio = contrast(colorTokens[pair.fg], colorTokens[pair.bg])
      expect(ratio, `${pair.label}: ${pair.fg} on ${pair.bg}`).toBeGreaterThanOrEqual(pair.min)
    }
  })

  it('motion durations stay within the 120–250ms band (§1.6)', () => {
    expect(motionTokens.durationFast).toBeGreaterThanOrEqual(120)
    expect(motionTokens.durationSlow).toBeLessThanOrEqual(250)
    expect(spacingScale.length).toBeGreaterThan(0)
  })

  it('error code taxonomy is closed and matches §3.3', () => {
    expect(ERROR_CODES).toEqual([
      'auth_required',
      'auth_invalid',
      'forbidden',
      'not_found',
      'validation_failed',
      'rate_limited',
      'conflict',
      'quota_exceeded',
      'provider_error',
      'server_error',
    ])
  })
})
