import type { Context } from 'hono'

export type DocsMockResponseHandler = (
  context: Context,
) => Response | Promise<Response> | unknown
