import type { RouteRule } from 'mokup'

const rule: RouteRule = {
  handler: () => ({
    users: [
      { id: '1', name: 'Milo Rivera', role: 'Ops' },
      { id: '2', name: 'Sora Lin', role: 'Developer Advocate' },
    ],
  }),
}

export default rule
