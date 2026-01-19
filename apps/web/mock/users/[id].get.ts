import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = (c) => {
  const id = c.req.param('id')
  return {
    ok: true,
    id,
    params: c.req.param() ?? {},
  }
}

const rule: MockRule = {
  response: handler,
}

export default rule
