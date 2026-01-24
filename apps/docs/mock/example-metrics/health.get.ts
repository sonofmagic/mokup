import type { RequestHandler } from 'mokup'

const handler: RequestHandler = () => {
  return {
    ok: true,
    example: 'metrics',
    status: 'healthy',
  }
}

export default handler
