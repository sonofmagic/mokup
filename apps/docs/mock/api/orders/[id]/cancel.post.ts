import type { RequestHandler } from 'mokup'

const handler: RequestHandler = async (c) => {
  const rawId = c.req.param('id') ?? 'ord_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const payload = await c.req.json().catch(() => ({}))
  const body = payload && typeof payload === 'object' ? payload : {}
  const rawStatus = c.req.query('status') ?? (body as { status?: unknown }).status
  const statusValue = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus
  if (statusValue === 'shipped') {
    c.status(409)
    return {
      ok: false,
      error: 'order_already_shipped',
      id,
    }
  }
  return {
    ok: true,
    id,
    status: 'canceled',
  }
}

export default handler
