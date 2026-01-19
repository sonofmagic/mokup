import type { MockResponseHandler, MockRule } from 'mokup'

const handler: MockResponseHandler = async (c) => {
  await new Promise(resolve => setTimeout(resolve, 220))
  const term = c.req.query('q')
  c.header('x-mokup-query', String(term ?? ''))
  const pageText = c.req.query('page')
  return {
    term: term ?? 'none',
    page: Number(pageText ?? 1),
    results: [
      { id: 1, label: `${term ?? 'signal'}-alpha` },
      { id: 2, label: `${term ?? 'signal'}-beta` },
    ],
  }
}

const rule: MockRule = {
  handler,
}

export default rule
