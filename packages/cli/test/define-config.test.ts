import { describe, expect, it } from 'vitest'
import { defineConfig } from '../src/manifest/define-config'

const middlewareSymbol = Symbol.for('mokup.config.middlewares')

describe('defineConfig', () => {
  it('attaches empty middleware metadata for object input', () => {
    const config = defineConfig({ delay: 120 })
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

  it('collects middleware from factory input', () => {
    const pre = async () => {}
    const normal = async () => {}
    const post = async () => {}
    const config = defineConfig(({ pre: preRegistry, normal: normalRegistry, post: postRegistry }) => {
      preRegistry.use(pre)
      normalRegistry.use(normal)
      postRegistry.use(post)
      return { status: 201 }
    })
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

  it('handles factories that return nothing', () => {
    const config = defineConfig(() => {})
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

  it('defaults to empty config for non-object input', () => {
    const config = defineConfig(null as unknown as Record<string, unknown>)
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
})
