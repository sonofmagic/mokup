import type { RequestHandler } from 'mokup'

const handler: RequestHandler = () => {
  return {
    ok: true,
    note: 'disabled-dir index',
  }
}

export default handler
