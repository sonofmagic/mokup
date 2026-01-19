import type { MockContext, MockRequest } from 'mokup'
import type { ServerResponse } from 'node:http'

export interface DocsMockParams {
  id?: string | string[]
  [key: string]: string | string[] | undefined
}

export interface DocsMockQuery {
  status?: string | string[]
  fail?: string | string[]
  [key: string]: string | string[] | undefined
}

export interface DocsMockBody {
  status?: unknown
  fail?: unknown
  username?: unknown
  password?: unknown
  [key: string]: unknown
}

export type DocsMockRequest = Omit<MockRequest, 'params' | 'query' | 'body'> & {
  params?: DocsMockParams
  query?: DocsMockQuery
  body?: DocsMockBody
}

export type DocsMockResponseHandler = (
  req: DocsMockRequest,
  res: ServerResponse,
  ctx: MockContext,
) => unknown | Promise<unknown>
