import { describe, expect, it } from 'vitest'
import {
  compareRouteScore,
  matchRouteTokens,
  parseRouteTemplate,
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
})

describe('route scoring', () => {
  it('orders static before dynamic before catch-all', () => {
    const staticScore = parseRouteTemplate('/users/me').score
    const dynamicScore = parseRouteTemplate('/users/[id]').score
    const catchallScore = parseRouteTemplate('/users/[...slug]').score

    expect(compareRouteScore(staticScore, dynamicScore)).toBeLessThan(0)
    expect(compareRouteScore(dynamicScore, catchallScore)).toBeLessThan(0)
  })
})
