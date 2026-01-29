import { defineConfig, onAfterAll, onBeforeAll } from 'mokup'

export default defineConfig(({ app }) => {
  onBeforeAll(() => {
    app.use(async (c, next) => {
      c.header('x-mokup-pre', '1')
      await next()
    })
  })

  app.use(async (_c, next) => {
    await next()
  })

  onAfterAll(() => {
    app.use(async (c, next) => {
      await next()
      c.header('x-mokup-post', '1')
    })
  })

  return {
    delay: 20,
    headers: {
      'x-mokup-demo': 'mock-vite-server',
    },
  }
})
