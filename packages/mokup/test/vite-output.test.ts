import type { ViteDevServer } from 'vite'
import pc from 'picocolors'
import { describe, expect, it, vi } from 'vitest'
import { createMokupPlugin } from '../src/vite/plugin'

describe('mokup vite output', () => {
  it('inserts the playground URL after Local/Network lines', async () => {
    const output: string[] = []
    const logger = {
      info: (message: string) => {
        output.push(message)
      },
    }

    const server = {
      config: {
        root: '/__mokup_test_root__',
        logger,
      },
      resolvedUrls: {
        local: ['http://localhost:5173/'],
        network: ['http://10.10.17.213:5173/'],
      },
      middlewares: {
        stack: [],
        use: vi.fn(),
      },
      watcher: {
        add: vi.fn(),
        on: vi.fn(),
      },
      printUrls: () => {
        logger.info('  ➜  Local:   http://localhost:5173/')
        logger.info('  ➜  Network: http://10.10.17.213:5173/')
        logger.info('  ➜  Debug:   http://localhost:5173/__debug')
      },
    } as unknown as ViteDevServer

    const plugin = createMokupPlugin({
      entries: {
        watch: false,
      },
    })

    await plugin.configureServer?.(server)

    server.printUrls()

    const expectedPlayground = `  ➜  Mokup Playground: ${pc.magenta('http://localhost:5173/__mokup')}`
    expect(output).toEqual([
      '  ➜  Local:   http://localhost:5173/',
      '  ➜  Network: http://10.10.17.213:5173/',
      expectedPlayground,
      '  ➜  Debug:   http://localhost:5173/__debug',
    ])
  })
})
