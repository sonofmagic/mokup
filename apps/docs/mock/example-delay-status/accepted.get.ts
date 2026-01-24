import type { RequestHandler } from 'mokup'

const handler: RequestHandler = (c) => {
  c.status(202)
  return {
    ok: true,
    example: 'delay-status',
    status: 'accepted',
  }
}

export default handler
