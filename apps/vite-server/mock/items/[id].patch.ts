import type { RequestHandler } from 'mokup'
import { defineHandler } from 'mokup'

const handler: RequestHandler = async (c) => {
  const id = c.req.param('id') ?? 'unknown'
  const payload = await c.req.json().catch(() => ({}))
  const body = payload && typeof payload === 'object' ? payload : {}
  return {
    ok: true,
    method: 'PATCH',
    id,
    patched: true,
    fields: body,
  }
}

export default defineHandler(handler)
