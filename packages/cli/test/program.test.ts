import { createFetchServer } from '@mokup/server'
import { serve } from '@mokup/server/node'
import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildManifest } from '../src/manifest'
import { createCli, runCli } from '../src/program'

vi.mock('@mokup/server', () => ({
  createFetchServer: vi.fn(),
}))

vi.mock('@mokup/server/node', () => ({
  serve: vi.fn(),
}))

vi.mock('../src/manifest', () => ({
  buildManifest: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('CLI program', () => {
  it('runs build command with parsed options', async () => {
    const program = createCli()
    program.exitOverride()

    await program.parseAsync([
      'node',
      'mokup',
      'build',
      '--dir',
      'mock-a',
      '--dir',
      'mock-b',
      '--out',
      '.mokup-out',
      '--prefix',
      '/api',
      '--include',
      'users',
      '--exclude',
      'ignore',
      '--no-handlers',
    ])

    expect(buildManifest).toHaveBeenCalledTimes(1)
    const options = vi.mocked(buildManifest).mock.calls[0]?.[0]
    expect(options?.dir).toEqual(['mock-a', 'mock-b'])
    expect(options?.outDir).toBe('.mokup-out')
    expect(options?.prefix).toBe('/api')
    expect(options?.handlers).toBe(false)
    expect(options?.include?.[0]?.source).toBe('users')
    expect(options?.exclude?.[0]?.source).toBe('ignore')
    expect(typeof options?.log).toBe('function')
  })

  it('runs serve command and parses host/port flags', async () => {
    const injectWebSocket = vi.fn()
    vi.mocked(createFetchServer).mockResolvedValue({
      fetch: vi.fn(),
      close: vi.fn(),
      injectWebSocket,
    })
    vi.mocked(serve).mockReturnValue({
      close: (cb?: (error?: Error) => void) => cb?.(),
    } as never)
    const onSpy = vi.spyOn(process, 'on').mockImplementation(() => process)

    const program = createCli()
    program.exitOverride()

    await program.parseAsync([
      'node',
      'mokup',
      'serve',
      '--host',
      '0.0.0.0',
      '--port',
      '9001',
      '--no-watch',
      '--no-playground',
      '--no-log',
    ])

    expect(createFetchServer).toHaveBeenCalledWith({
      watch: false,
      log: false,
      host: '0.0.0.0',
      port: 9001,
      playground: false,
    })
    expect(serve).toHaveBeenCalledTimes(1)
    expect(injectWebSocket).toHaveBeenCalledTimes(1)
    onSpy.mockRestore()
  })

  it('throws on invalid port values', async () => {
    const program = createCli()
    program.exitOverride()
    await expect(program.parseAsync([
      'node',
      'mokup',
      'serve',
      '--port',
      'not-a-number',
    ])).rejects.toThrow('Invalid port')
  })

  it('shows help when no args are provided', async () => {
    const helpSpy = vi.spyOn(Command.prototype, 'help').mockImplementation(() => undefined)
    await runCli(['node', 'mokup'])
    expect(helpSpy).toHaveBeenCalled()
    helpSpy.mockRestore()
  })
})
