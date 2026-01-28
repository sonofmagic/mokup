import { defineHandler } from 'mokup'

export default defineHandler({
  enabled: false,
  handler: () => ({
    ok: false,
    message: 'This route is disabled via defineHandler.',
  }),
})
