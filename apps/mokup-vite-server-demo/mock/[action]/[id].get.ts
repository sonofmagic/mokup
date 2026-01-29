import type { RequestHandler } from 'mokup'
import { defineHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  return {
    ok: true,
    params: c.req.param(),
  }
}

export default defineHandler(handler)
