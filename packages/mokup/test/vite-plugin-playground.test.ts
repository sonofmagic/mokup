import { describe, expect, it, vi } from 'vitest'
import { stripAnsi } from '../src/shared/terminal'
import { patchPlaygroundPrintUrls } from '../src/vite/plugin/playground'

function createServer(lines: Array<unknown[]>, localUrl = 'http://localhost:5173/') {
  const calls: Array<unknown[]> = []
  const logger = {
    info: (...args: unknown[]) => {
      calls.push(args)
    },
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  }
  const server = {
    config: { logger },
    resolvedUrls: { local: [localUrl] },
    printUrls: () => {
      for (const args of lines) {
        logger.info(...args)
      }
    },
  }
  return { server, calls }
}

describe('vite plugin playground urls', () => {
  it('inserts the playground url after network entries', () => {
    const { server, calls } = createServer([
      ['  ➜  Local: http://localhost:5173/'],
      ['  ➜  Network: http://192.168.0.1:5173/'],
    ])
    patchPlaygroundPrintUrls(server as any, '/__mokup')
    server.printUrls()

    const cleaned = calls.map(args =>
      typeof args[0] === 'string' ? stripAnsi(args[0]) : args[0],
    )
    const networkIndex = cleaned.findIndex(line => typeof line === 'string' && line.includes('Network:'))
    const playgroundIndex = cleaned.findIndex(line => typeof line === 'string' && line.includes('Mokup Playground'))
    expect(playgroundIndex).toBe(networkIndex + 1)
    expect(String(cleaned[playgroundIndex])).toContain('/__mokup')
  })

  it('inserts the playground url after local entries', () => {
    const { server, calls } = createServer([
      ['  ➜  Local: http://localhost:5173/'],
    ])
    patchPlaygroundPrintUrls(server as any, '/__mokup')
    server.printUrls()

    const cleaned = calls.map(args =>
      typeof args[0] === 'string' ? stripAnsi(args[0]) : args[0],
    )
    const localIndex = cleaned.findIndex(line => typeof line === 'string' && line.includes('Local:'))
    const playgroundIndex = cleaned.findIndex(line => typeof line === 'string' && line.includes('Mokup Playground'))
    expect(playgroundIndex).toBe(localIndex + 1)
  })

  it('appends the playground url and preserves non-string logs', () => {
    const payload = { ok: true }
    const { server, calls } = createServer([
      ['ready'],
      [payload],
    ], '')
    patchPlaygroundPrintUrls(server as any, '/__mokup')
    server.printUrls()

    const cleaned = calls.map(args =>
      typeof args[0] === 'string' ? stripAnsi(args[0]) : args[0],
    )
    const playgroundIndex = cleaned.findIndex(line => typeof line === 'string' && line.includes('Mokup Playground'))
    expect(playgroundIndex).toBe(cleaned.length - 1)
    expect(calls.some(args => args[0] === payload)).toBe(true)
  })
})
