import { describe, expect, it } from 'vitest'
import {
  compareRouteScore,
  matchRouteTokens,
  normalizePathname,
  parseRouteTemplate,
  scoreRouteTokens,
} from '../src/index'

const getTokens = (template: string) => parseRouteTemplate(template).tokens

describe('router parsing', () => {
  it('parses params and optional catch-all', () => {
    const parsed = parseRouteTemplate('/users/[id]')
    expect(parsed.errors).toEqual([])
    expect(parsed.tokens).toEqual([
      { type: 'static', value: 'users' },
      { type: 'param', name: 'id' },
    ])

    const optional = parseRouteTemplate('/docs/[[...slug]]')
    expect(optional.errors).toEqual([])
    expect(optional.tokens).toEqual([
      { type: 'static', value: 'docs' },
      { type: 'optional-catchall', name: 'slug' },
    ])
  })

  it('rejects route groups and invalid catch-all placement', () => {
    const group = parseRouteTemplate('/(admin)/users')
    expect(group.errors.length).toBeGreaterThan(0)

    const catchall = parseRouteTemplate('/reports/[...slug]/extra')
    expect(catchall.errors.length).toBeGreaterThan(0)
  })

  it('normalizes templates and warns on duplicate params', () => {
    const parsed = parseRouteTemplate('users/[id]/[id]')
    expect(parsed.template).toBe('/users/[id]/[id]')
    expect(parsed.warnings).toContain('Duplicate param name "id"')

    const catchallDup = parseRouteTemplate('/files/[id]/[...id]')
    expect(catchallDup.warnings).toContain('Duplicate param name "id"')

    const optionalDup = parseRouteTemplate('/docs/[id]/[[...id]]')
    expect(optionalDup.warnings).toContain('Duplicate param name "id"')
  })

  it('rejects invalid params and segments', () => {
    const invalidParam = parseRouteTemplate('/users/[i*d]')
    expect(invalidParam.errors.length).toBeGreaterThan(0)

    const invalidSegment = parseRouteTemplate('/users/[id]extra')
    expect(invalidSegment.errors.length).toBeGreaterThan(0)

    const optionalPlacement = parseRouteTemplate('/docs/[[...slug]]/extra')
    expect(optionalPlacement.errors.length).toBeGreaterThan(0)

    const invalidOptional = parseRouteTemplate('/docs/[[...slug*]]')
    expect(invalidOptional.errors.length).toBeGreaterThan(0)

    const invalidCatchall = parseRouteTemplate('/files/[...slug*]')
    expect(invalidCatchall.errors.length).toBeGreaterThan(0)
  })
})

describe('pathname normalization', () => {
  it('strips query/hash and normalizes slashes', () => {
    expect(normalizePathname('docs/?q=1#hash')).toBe('/docs')
    expect(normalizePathname('/docs/')).toBe('/docs')
  })

  it('handles missing query/hash segments defensively', () => {
    const missingQuery = normalizePathname({ split: () => [undefined] } as any)
    expect(missingQuery).toBe('/')

    const missingHash = normalizePathname({
      split: () => [{ split: () => [undefined] }],
    } as any)
    expect(missingHash).toBe('/')
  })
})

describe('router matching', () => {
  it('matches params and catch-all', () => {
    const dynamic = matchRouteTokens(getTokens('/users/[id]'), '/users/42')
    expect(dynamic?.params).toEqual({ id: '42' })

    const catchall = matchRouteTokens(getTokens('/reports/[...slug]'), '/reports/2026/q1')
    expect(catchall?.params).toEqual({ slug: ['2026', 'q1'] })
  })

  it('matches optional catch-all with empty params', () => {
    const optional = matchRouteTokens(getTokens('/docs/[[...slug]]'), '/docs')
    expect(optional?.params).toEqual({ slug: [] })
  })

  it('does not match catch-all with no segments', () => {
    const catchall = matchRouteTokens(getTokens('/reports/[...slug]'), '/reports')
    expect(catchall).toBeNull()
  })

  it('decodes params and rejects extra segments', () => {
    const decoded = matchRouteTokens(getTokens('/users/[id]'), '/users/hello%20world')
    expect(decoded?.params).toEqual({ id: 'hello world' })

    const invalid = matchRouteTokens(getTokens('/users/[id]'), '/users/%E0')
    expect(invalid?.params).toEqual({ id: '%E0' })

    const extra = matchRouteTokens(getTokens('/users'), '/users/extra')
    expect(extra).toBeNull()

    const missing = matchRouteTokens(getTokens('/users/[id]'), '/users')
    expect(missing).toBeNull()
  })
})

describe('route scoring', () => {
  it('orders static before dynamic before catch-all', () => {
    const staticScore = parseRouteTemplate('/users/me').score
    const dynamicScore = parseRouteTemplate('/users/[id]').score
    const catchallScore = parseRouteTemplate('/users/[...slug]').score

    expect(compareRouteScore(staticScore, dynamicScore)).toBeLessThan(0)
    expect(compareRouteScore(dynamicScore, catchallScore)).toBeLessThan(0)
  })

  it('scores tokens consistently and compares length', () => {
    const score = scoreRouteTokens([
      { type: 'static', value: 'users' },
      { type: 'param', name: 'id' },
      { type: 'catchall', name: 'slug' },
    ])
    expect(score).toEqual([4, 3, 2])
    expect(compareRouteScore([4, 4], [4])).toBeLessThan(0)
  })

  it('handles sparse score entries', () => {
    expect(compareRouteScore([undefined, 2] as unknown as number[], [1, 2])).toBeGreaterThan(0)
  })

  it('treats missing compare score entries as zero', () => {
    expect(compareRouteScore([1], [undefined] as unknown as number[])).toBeLessThan(0)
  })

  it('scores unknown token types as zero', () => {
    const score = scoreRouteTokens([{ type: 'unknown', value: 'noop' } as any])
    expect(score).toEqual([0])
  })
})
