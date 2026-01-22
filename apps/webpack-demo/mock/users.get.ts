import type { RouteRule } from 'mokup'

const rule: RouteRule = {
  delay: 120,
  handler: () => ({
    users: [
      { id: '24', name: 'Nova Chen', role: 'Designer' },
      { id: '42', name: 'Ari Park', role: 'Engineer' },
      { id: '58', name: 'Mika Ito', role: 'PM' },
    ],
  }),
}

export default rule
