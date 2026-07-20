import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createFetchServer } from 'mokup/server'
import { serve } from 'mokup/server/node'

async function start() {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const server = await createFetchServer({ entries: { dir: 'mock', root } })
  const env = process.env as { PORT?: string }
  const port = Number(env.PORT ?? 8787)

  serve({
    fetch: server.fetch,
    port,
    ...(server.websocket ? { websocket: server.websocket } : {}),
  })

  process.stdout.write(
    `mokup mock server running on http://localhost:${port}\n`,
  )
}

start().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : error}\n`,
  )
  process.exit(1)
})
