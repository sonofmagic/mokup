import type { RequestHandler } from 'mokup'
import { defineHandler } from 'mokup'

const handler: RequestHandler = () => {
  return undefined
}

export default defineHandler({
  status: 204,
  handler,
})
