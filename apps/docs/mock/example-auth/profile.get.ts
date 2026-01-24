import { defineHandler } from 'mokup'

export default defineHandler(() => {
  return {
    ok: true,
    user: {
      id: 'user_demo',
      name: 'Demo User',
      role: 'member',
    },
  }
})
