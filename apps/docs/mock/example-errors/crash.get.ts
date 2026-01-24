import type { RequestHandler } from 'mokup'

const handler: RequestHandler = () => {
  throw new Error('mock crash')
}

export default handler
