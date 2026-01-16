import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = (req) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : undefined
  return {
    ok: true,
    id,
    params: req.params ?? {},
  }
}

const rule: MockRule = {
  response: handler,
}

export default rule
