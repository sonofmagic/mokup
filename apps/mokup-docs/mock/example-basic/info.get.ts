import type { RequestHandler } from 'mokup'

const handler: RequestHandler = () => {
  return {
    ok: true,
    example: 'basic',
    note: 'middleware runs in pre/normal/post order',
  }
}

export default handler
