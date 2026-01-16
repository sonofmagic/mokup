import type { MockRule } from 'mokup'

const rule: MockRule = {
  response: (req) => {
    const id = typeof req.params?.id === 'string' ? req.params.id : undefined
    return {
      ok: true,
      id,
      params: req.params ?? {},
    }
  },
}

export default rule
