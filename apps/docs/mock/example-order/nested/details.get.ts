import type { RequestHandler } from 'mokup'

const handler: RequestHandler = () => {
  return {
    ok: true,
    example: 'order',
    scope: 'nested',
  }
}

export default handler
