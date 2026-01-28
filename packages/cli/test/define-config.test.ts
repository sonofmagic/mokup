import { describe, expect, it, vi } from 'vitest'
import { defineConfig, onAfterAll, onBeforeAll } from '../src/manifest/define-config'

const middlewareSymbol = Symbol.for('mokup.config.middlewares')

describe('defineConfig', () => {
  it('attaches empty middleware metadata for object input', async () => {
    const config = await Promise.resolve(defineConfig({ delay: 120 }))
    const meta = (config as Record<symbol, unknown>)[middlewareSymbol] as {
      pre: unknown[]
      normal: unknown[]
      post: unknown[]
    }

    expect(config.delay).toBe(120)
    expect(meta.pre).toEqual([])
    expect(meta.normal).toEqual([])
    expect(meta.post).toEqual([])
  })

  it('collects middleware from factory input', async () => {
    const pre = async () => {}
    const normal = async () => {}
    const post = async () => {}
    const config = await Promise.resolve(defineConfig(({ app }) => {
      onBeforeAll(() => {
        app.use(pre)
      })
      app.use(normal)
      onAfterAll(() => {
        app.use(post)
      })
      return { status: 201 }
    }))
    const meta = (config as Record<symbol, unknown>)[middlewareSymbol] as {
      pre: unknown[]
      normal: unknown[]
      post: unknown[]
    }

    expect(config.status).toBe(201)
    expect(meta.pre).toEqual([pre])
    expect(meta.normal).toEqual([normal])
    expect(meta.post).toEqual([post])
  })

  it('handles factories that return nothing', async () => {
    const config = await Promise.resolve(defineConfig(() => {}))
    const meta = (config as Record<symbol, unknown>)[middlewareSymbol] as {
      pre: unknown[]
      normal: unknown[]
      post: unknown[]
    }

    expect(config).toEqual({})
    expect(meta.pre).toEqual([])
    expect(meta.normal).toEqual([])
    expect(meta.post).toEqual([])
  })

  it('defaults to empty config for non-object input', async () => {
    const config = await Promise.resolve(defineConfig(null as unknown as Record<string, unknown>))
    const meta = (config as Record<symbol, unknown>)[middlewareSymbol] as {
      pre: unknown[]
      normal: unknown[]
      post: unknown[]
    }

    expect(config).toEqual({})
    expect(meta.pre).toEqual([])
    expect(meta.normal).toEqual([])
    expect(meta.post).toEqual([])
  })

  it('awaits async hooks and handles hook errors', async () => {
    const pre = async () => {}
    const config = await Promise.resolve(defineConfig(async ({ app }) => {
      onBeforeAll(async () => {
        await Promise.resolve()
        app.use(pre)
      })
      return { hookError: 'warn' }
    }))
    const meta = (config as Record<symbol, unknown>)[middlewareSymbol] as {
      pre: unknown[]
      normal: unknown[]
      post: unknown[]
    }
    expect(meta.pre).toEqual([pre])

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const warnConfig = await Promise.resolve(defineConfig(() => {
      onAfterAll(() => {
        throw new Error('warn-me')
      })
      return { hookError: 'warn' }
    }))
    expect(warnConfig).toEqual({ hookError: 'warn' })
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()

    expect(() => defineConfig(() => {
      onBeforeAll(() => {
        throw new Error('boom')
      })
      return { hookError: 'throw' }
    })).toThrow('boom')
  })

  it('rejects hooks outside defineConfig', () => {
    expect(() => onBeforeAll(() => {})).toThrow('defineConfig')
    expect(() => onAfterAll(() => {})).toThrow('defineConfig')
  })
})
