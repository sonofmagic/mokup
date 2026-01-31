import { describe, expect, it, vi } from 'vitest'
import { applyMokupToQueryClient, createMokupQueryClient } from '../src/index'

describe('applyMokupToQueryClient', () => {
  it('uses setDefaultOptions when available', () => {
    const setDefaultOptions = vi.fn()
    const client = {
      setDefaultOptions,
      getDefaultOptions: () => ({ queries: { staleTime: 1000 } }),
    }

    const mokup = applyMokupToQueryClient(client)

    expect(setDefaultOptions).toHaveBeenCalledTimes(1)
    const options = setDefaultOptions.mock.calls[0][0]
    expect(options.queries?.queryFn).toBe(mokup.queryFn)
    expect(options.mutations?.mutationFn).toBe(mokup.mutationFn)
    expect(options.queries?.staleTime).toBe(1000)
  })

  it('falls back to defaultOptions mutation when no setter', () => {
    const client = {
      defaultOptions: { queries: { retry: 1 } },
    }

    const mokup = applyMokupToQueryClient(client)

    expect(client.defaultOptions?.queries?.queryFn).toBe(mokup.queryFn)
    expect(client.defaultOptions?.mutations?.mutationFn).toBe(mokup.mutationFn)
    expect(client.defaultOptions?.queries?.retry).toBe(1)
  })
})

describe('createMokupQueryClient', () => {
  it('exposes queryFn and mutationFn', () => {
    const mokup = createMokupQueryClient()
    expect(typeof mokup.queryFn).toBe('function')
    expect(typeof mokup.mutationFn).toBe('function')
  })
})
