import { describe, expect, it, vi } from 'vitest'
import { parseWsMessage, resolvePlaygroundWsUrl } from '../src/hooks/playground-request/websocket'

describe('playground websocket helpers', () => {
  it('parses websocket payloads', () => {
    const snapshot = parseWsMessage('{"type":"snapshot","total":1,"perRoute":{"GET /a":2}}')
    expect(snapshot?.type).toBe('snapshot')

    const increment = parseWsMessage('{"type":"increment","routeKey":"GET /a","total":2}')
    expect(increment?.type).toBe('increment')

    const missingFields = parseWsMessage('{"type":"snapshot","total":1}')
    expect(missingFields).toBeNull()

    const invalid = parseWsMessage('not-json')
    expect(invalid).toBeNull()
  })

  it('resolves websocket URLs from base paths', () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost' } })
    expect(resolvePlaygroundWsUrl('')).toBe('')
    expect(resolvePlaygroundWsUrl('/__mokup')).toBe('ws://localhost/__mokup/ws')
    expect(resolvePlaygroundWsUrl('mokup')).toBe('ws://localhost/mokup/ws')
  })

  it('disables websocket when env flags are off', () => {
    const original = { ...import.meta.env }
    Object.assign(import.meta.env, { DEV: false, VITE_MOKUP_PLAYGROUND_WS: '' })
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } })

    expect(resolvePlaygroundWsUrl('/__mokup')).toBe('')

    Object.assign(import.meta.env, { DEV: false, VITE_MOKUP_PLAYGROUND_WS: 'true' })
    expect(resolvePlaygroundWsUrl('/__mokup')).toBe('wss://example.com/__mokup/ws')

    Object.assign(import.meta.env, { DEV: false, VITE_MOKUP_PLAYGROUND_WS: 'off' })
    expect(resolvePlaygroundWsUrl('/__mokup')).toBe('')

    Object.assign(import.meta.env, { DEV: false, VITE_MOKUP_PLAYGROUND_WS: 'maybe' })
    expect(resolvePlaygroundWsUrl('/__mokup')).toBe('')

    Object.assign(import.meta.env, original)
  })
})
