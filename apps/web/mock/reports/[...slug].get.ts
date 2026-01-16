import type { MockRule } from 'mokup'

const rule: MockRule = {
  response: (req) => {
    const slug = Array.isArray(req.params?.slug) ? req.params?.slug : []
    return {
      ok: true,
      slug,
      trail: slug.join('/'),
    }
  },
}

export default rule
