/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Parses the real theme tokens out of src/index.css and asserts WCAG 2.1 AA
 * contrast (4.5:1 for text) for every foreground/background combination the UI
 * actually renders — badges, soft alerts, buttons, tinted chips, placeholders.
 */

type Tokens = Record<string, string>

const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8')

function tokensAt(marker: RegExp): Tokens {
  const m = marker.exec(css)
  expect(m, `selector ${marker} not found in index.css (loaded ${css.length} chars: ${css.slice(0, 80)})`).toBeTruthy()
  const open = css.indexOf('{', m!.index)
  const close = css.indexOf('}', open)
  const tokens: Tokens = {}
  for (const decl of css.slice(open + 1, close).split(';')) {
    const m = /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/.exec(decl)
    if (m) tokens[m[1]!] = m[2]!
  }
  return tokens
}

function channels(hex: string): [number, number, number] {
  const s = hex.slice(1)
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ]
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** CSS alpha compositing in sRGB space (what the browser paints). */
function blend(fg: string, bg: string, alpha: number): string {
  const f = channels(fg)
  const b = channels(bg)
  const mix = f.map((v, i) => Math.round(v * alpha + b[i]! * (1 - alpha)))
  return `#${mix.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

interface Check {
  name: string
  fg: string
  bg: string
  min?: number
}

function checks(t: Tokens, theme: 'light' | 'dark'): Check[] {
  const light = theme === 'light'
  const card = t['--card']!
  const page = t['--background']!
  const pop = t['--popover']!
  const onSoft50 = (soft: string) => blend(t[soft]!, card, 0.5)

  return [
    { name: 'foreground on card', fg: t['--foreground']!, bg: card },
    { name: 'foreground on background', fg: t['--foreground']!, bg: page },
    { name: 'popover-foreground on popover', fg: t['--popover-foreground']!, bg: pop },
    { name: 'muted-foreground on card (body copy)', fg: t['--muted-foreground']!, bg: card },
    { name: 'muted-foreground on background', fg: t['--muted-foreground']!, bg: page },
    { name: 'muted-foreground on muted badge', fg: t['--muted-foreground']!, bg: t['--muted']! },
    { name: 'muted-foreground on accent hover row', fg: t['--muted-foreground']!, bg: t['--accent']! },
    { name: 'accent-foreground on accent', fg: t['--accent-foreground']!, bg: t['--accent']! },

    { name: 'primary on card (links, labels)', fg: t['--primary']!, bg: card },
    { name: 'primary on background', fg: t['--primary']!, bg: page },
    { name: 'primary-foreground on primary button', fg: t['--primary-foreground']!, bg: t['--primary']! },
    {
      name: 'primary-soft-foreground on primary-soft',
      fg: t['--primary-soft-foreground']!,
      bg: t['--primary-soft']!,
    },
    {
      name: 'primary-soft-foreground on primary-soft/40 chip',
      fg: t['--primary-soft-foreground']!,
      bg: blend(t['--primary-soft']!, card, 0.4),
    },

    { name: 'xp on card', fg: t['--xp']!, bg: card },
    { name: 'xp on background', fg: t['--xp']!, bg: page },
    { name: 'xp badge (xp/15 on card)', fg: t['--xp']!, bg: blend(t['--xp']!, card, 0.15) },
    { name: 'xp badge (xp/15 on background)', fg: t['--xp']!, bg: blend(t['--xp']!, page, 0.15) },
    { name: 'xp chip (xp/10 on card)', fg: t['--xp']!, bg: blend(t['--xp']!, card, 0.1) },
    { name: 'xp hint panel (xp/5 on card)', fg: t['--xp']!, bg: blend(t['--xp']!, card, 0.05) },
    { name: 'xp toast (xp/20 on popover)', fg: t['--xp']!, bg: blend(t['--xp']!, pop, 0.2) },
    {
      name: 'xp celebration chip on success-soft/50',
      fg: t['--xp']!,
      bg: blend(t['--xp']!, onSoft50('--success-soft'), 0.1),
    },
    { name: 'xp button text', fg: light ? '#ffffff' : '#000000', bg: t['--xp']! },

    { name: 'success on success-soft', fg: t['--success']!, bg: t['--success-soft']! },
    { name: 'success on success-soft/50 (celebration)', fg: t['--success']!, bg: onSoft50('--success-soft') },
    { name: 'success on card', fg: t['--success']!, bg: card },
    { name: 'success trophy text', fg: light ? '#ffffff' : '#000000', bg: t['--success']! },

    { name: 'warning on warning-soft', fg: t['--warning']!, bg: t['--warning-soft']! },
    { name: 'warning on card', fg: t['--warning']!, bg: card },

    { name: 'danger on danger-soft', fg: t['--danger']!, bg: t['--danger-soft']! },
    { name: 'danger on card (error text)', fg: t['--danger']!, bg: card },
    { name: 'danger button text', fg: light ? '#ffffff' : '#000000', bg: t['--danger']! },

    { name: 'info on info-soft', fg: t['--info']!, bg: t['--info-soft']! },
    { name: 'info on card', fg: t['--info']!, bg: card },
  ]
}

describe('WCAG AA contrast of theme tokens', () => {
  const themes = [
    { theme: 'light' as const, marker: /:root\s*\{/ },
    { theme: 'dark' as const, marker: /\.dark\s*\{/ },
  ]

  for (const { theme, marker } of themes) {
    const tokens = tokensAt(marker)
    describe(`${theme} mode`, () => {
      for (const c of checks(tokens, theme)) {
        const min = c.min ?? 4.5
        it(`${c.name} ≥ ${min}:1`, () => {
          const ratio = contrast(c.fg, c.bg)
          expect(
            Number(ratio.toFixed(2)),
            `${c.fg} on ${c.bg} = ${ratio.toFixed(2)}:1`,
          ).toBeGreaterThanOrEqual(min)
        })
      }
    })
  }
})
