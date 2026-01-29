import type { RequestHandler, RouteRule } from 'mokup'
import { user } from '../db/schema'

const handler: RequestHandler = async (c) => {
  const db = c.get('db')
  const users = await db.select().from(user).all()
  return {
    ok: true,
    users,
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
