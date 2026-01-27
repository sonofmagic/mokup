import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it } from 'vitest'
import { buildDisplayPath, buildResolvedPath, buildRouteParams } from '../src/hooks/playground-request/params'
import { buildQueryString, parseKeyValueInput } from '../src/hooks/playground-request/query'

describe('playground request params', () => {
  it('builds params and marks optional catchalls', () => {
    const tokens = parseRouteTemplate('/users/[id]/[...rest]').tokens
    const params = buildRouteParams(tokens)
    expect(params.map(param => param.token)).toEqual(['[id]', '[...rest]'])

    const optional = buildRouteParams(parseRouteTemplate('/docs/[[...opt]]').tokens)
    expect(optional.find(param => param.name === 'opt')?.required).toBe(false)

    const deduped = buildRouteParams(parseRouteTemplate('/items/[id]/[id]/[...rest]').tokens)
    expect(deduped.map(param => param.name)).toEqual(['id', 'rest'])
  })

  it('resolves paths and missing params', () => {
    const tokens = parseRouteTemplate('/files/[...path]').tokens
    const empty = buildResolvedPath(tokens, { path: '' })
    expect(empty.path).toBe('/files')
    expect(empty.missing).toEqual(['path'])

    const resolved = buildResolvedPath(tokens, { path: 'a/b' })
    expect(resolved.path).toBe('/files/a/b')

    const display = buildDisplayPath(tokens, { path: '' })
    expect(display).toBe('/files/[...path]')
  })

  it('handles optional params, encoding, and placeholders', () => {
    const tokens = parseRouteTemplate('/users/[id]/[[...rest]]').tokens
    const resolved = buildResolvedPath(tokens, { id: 'a b', rest: ' /deep/path/ ' })
    expect(resolved.path).toBe('/users/a%20b/deep/path')
    expect(resolved.missing).toEqual([])

    const missing = buildResolvedPath(tokens, { id: '' })
    expect(missing.path).toBe('/users')
    expect(missing.missing).toEqual(['id'])

    const display = buildDisplayPath(tokens, { id: '', rest: '' })
    expect(display).toBe('/users/[id]')
  })

  it('tracks missing catchalls and skips optional placeholders', () => {
    const catchallTokens = parseRouteTemplate('/files/[...path]').tokens
    const resolved = buildResolvedPath(catchallTokens, { path: '/' })
    expect(resolved.missing).toEqual(['path'])

    const display = buildDisplayPath(catchallTokens, { path: '/' })
    expect(display).toBe('/files/[...path]')

    const optionalTokens = parseRouteTemplate('/docs/[[...slug]]').tokens
    const resolvedOptional = buildResolvedPath(optionalTokens, { slug: '' })
    expect(resolvedOptional.missing).toEqual([])

    const displayOptional = buildDisplayPath(optionalTokens, { slug: '' })
    expect(displayOptional).toBe('/docs')
  })
})

describe('playground request query', () => {
  it('parses key/value pairs and builds query strings', () => {
    expect(parseKeyValueInput('')).toEqual([])
    expect(parseKeyValueInput('\n=skip&foo=bar')).toEqual([['foo', 'bar']])
    expect(parseKeyValueInput('foo=bar&baz=1=2')).toEqual([
      ['foo', 'bar'],
      ['baz', '1=2'],
    ])
    expect(parseKeyValueInput(' \n \n ')).toEqual([])

    const query = buildQueryString({ foo: 'bar', list: [1, 2], empty: undefined })
    expect(query).toBe('?foo=bar&list=1&list=2')
    expect(buildQueryString({})).toBe('')
  })
})
