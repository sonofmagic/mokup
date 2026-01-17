import type { RuntimeOptions } from '@mokup/runtime'

export interface MokupServerOptions extends RuntimeOptions {
  onNotFound?: 'next' | 'response'
}

export type FetchHandler = (request: Request) => Promise<Response | null>
