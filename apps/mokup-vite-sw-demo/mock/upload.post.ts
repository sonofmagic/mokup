import type { RequestHandler, RouteRule } from 'mokup'
import { faker } from '@faker-js/faker'

const handler: RequestHandler = async (c) => {
  const form = await c.req.formData().catch(() => null)
  if (!form) {
    return {
      ok: false,
      error: 'Invalid form data.',
    }
  }
  const fields: Record<string, string[]> = {}
  const files: Array<{ field: string, name: string, size: number, type: string }> = []
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') {
      fields[key] = fields[key] ? [...fields[key], value] : [value]
      continue
    }
    files.push({
      field: key,
      name: value.name,
      size: value.size,
      type: value.type,
    })
  }
  return {
    ok: true,
    traceId: faker.string.uuid(),
    fields,
    files,
  }
}

const rule: RouteRule = {
  handler,
}

export default rule
