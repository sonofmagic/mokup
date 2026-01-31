import { describe, expect, it, vi } from 'vitest'
import { createMokupQueryClient } from '../src/index'

describe('mokup query helpers', () => {
  it('builds request from queryKey and passes to executor', async () => {
    const executor = vi.fn(async () => 'ok')
    const { queryFn } = createMokupQueryClient({ executor })

    const result = await queryFn({
      queryKey: ['GET', '/users', { params: { q: 'test' }, mock: true }],
    })

    expect(result).toBe('ok')
    expect(executor).toHaveBeenCalledTimes(1)
    const request = executor.mock.calls[0][0]
    expect(request.url).toBe('/users?q=test')
    expect(request.method).toBe('GET')
    expect(request.mock).toBe(true)
  })

  it('merges meta into request', async () => {
    const executor = vi.fn(async () => 'ok')
    const { queryFn } = createMokupQueryClient({ executor })

    await queryFn({
      queryKey: ['/users'],
      meta: { mokup: true, trace: '1' },
    })

    const request = executor.mock.calls[0][0]
    expect(request.meta).toEqual({ mokup: true, trace: '1' })
  })

  it('builds mutation request from variables', async () => {
    const executor = vi.fn(async () => 'ok')
    const { mutationFn } = createMokupQueryClient({ executor })

    const result = await mutationFn(['POST', '/users', { body: { name: 'hi' } }])

    expect(result).toBe('ok')
    const request = executor.mock.calls[0][0]
    expect(request.url).toBe('/users')
    expect(request.method).toBe('POST')
    expect(request.body).toEqual({ name: 'hi' })
  })
})
