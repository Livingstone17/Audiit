import { describe, expect, it } from 'vitest'
import { hashPassword, sha256Hex, verifyPassword } from '../lib/hash'

describe('sha256Hex', () => {
  it('matches the standard test vectors', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('matches node:crypto on padded and non-ascii input', () => {
    /* reference values computed with node:crypto */
    expect(sha256Hex('a'.repeat(100))).toBe(
      '2816597888e4a0d3a36b82b83316ab32680eb8f00f8cd3b904d681246d285a0e',
    )
    expect(sha256Hex('héllo')).toBe(
      '3c48591d8d098a4538f5e013dfcf406e948eac4d3277b10bf614e295d6068179',
    )
  })
})

describe('hashPassword / verifyPassword', () => {
  it('round-trips and rejects wrong passwords', () => {
    const stored = hashPassword('s3cret', 'mysalt')
    expect(stored.startsWith('mysalt$')).toBe(true)
    expect(stored).not.toContain('s3cret')
    expect(verifyPassword('s3cret', stored)).toBe(true)
    expect(verifyPassword('wrong', stored)).toBe(false)
    expect(verifyPassword('s3cret', 'not-a-valid-hash')).toBe(false)
  })

  it('uses the salt so equal passwords differ across accounts', () => {
    expect(hashPassword('same', 'salt-a')).not.toBe(hashPassword('same', 'salt-b'))
  })
})
