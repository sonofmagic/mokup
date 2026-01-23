/**
 * Minimal readable stream shape used by adapters.
 *
 * @example
 * import type { ReadableStreamLike } from '@mokup/server'
 *
 * const stream: ReadableStreamLike = {
 *   on: () => {},
 * }
 */
export interface ReadableStreamLike {
  on: (event: string, listener: (...args: unknown[]) => void) => void
}

/**
 * Minimal Node request shape used by adapters.
 *
 * @example
 * import type { NodeRequestLike } from '@mokup/server'
 *
 * const req: NodeRequestLike = { method: 'GET', url: '/api/ping' }
 */
export interface NodeRequestLike extends ReadableStreamLike {
  method?: string
  url?: string
  originalUrl?: string
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

/**
 * Minimal Node response shape used by adapters.
 *
 * @example
 * import type { NodeResponseLike } from '@mokup/server'
 *
 * const res: NodeResponseLike = {
 *   setHeader: () => {},
 *   end: () => {},
 * }
 */
export interface NodeResponseLike {
  statusCode?: number
  setHeader: (name: string, value: string) => void
  end: (data?: string | Uint8Array | ArrayBuffer | null) => void
}
