import type { MockRule } from 'mokup'

const rule: MockRule = {
  response: async (req, res, ctx) => {
    await ctx.delay(220)
    const query = req.query.q
    const term = Array.isArray(query) ? query[0] : query
    res.setHeader('x-mokup-query', String(term ?? ''))
    const pageValue = req.query.page
    const pageText = Array.isArray(pageValue) ? pageValue[0] : pageValue
    return {
      term: term ?? 'none',
      page: Number(pageText ?? 1),
      results: [
        { id: 1, label: `${term ?? 'signal'}-alpha` },
        { id: 2, label: `${term ?? 'signal'}-beta` },
      ],
    }
  },
}

export default rule
