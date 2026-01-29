import type { RequestHandler, RouteRule } from 'mokup'
import { eq } from 'drizzle-orm'
import { user } from '../db/schema'

const handler: RequestHandler = async (c) => {
  const db = c.get('db')
  const payload = await c.req.json().catch(() => ({}))
  const body = payload && typeof payload === 'object' ? payload : {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''

  if (!name || !email) {
    return c.json({ ok: false, message: 'name and email are required.' }, 400)
  }

  if (!email.includes('@')) {
    return c.json({ ok: false, message: 'email is invalid.' }, 400)
  }

  const existing = await db.select().from(user).where(eq(user.email, email)).get()
  if (existing) {
    return c.json({ ok: false, message: 'email already exists.' }, 409)
  }

  const id = crypto.randomUUID()
  await db.insert(user).values({ id, name, email })
  const created = await db.select().from(user).where(eq(user.id, id)).get()

  return c.json({
    ok: true,
    user: created ?? { id, name, email },
  })
}

const rule: RouteRule = {
  handler,
}

export default rule
