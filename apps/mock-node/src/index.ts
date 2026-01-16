import { readFile } from 'node:fs/promises'

import * as nodeProcess from 'node:process'
import { serve } from '@hono/node-server'
import { createMokupHonoApp } from '@mokup/hono'

async function start() {
  const manifestPath = new URL('../dist/mokup.manifest.json', import.meta.url)
  const manifest = JSON.parse(
    await readFile(manifestPath, 'utf8'),
  ) as Parameters<typeof createMokupHonoApp>[0]['manifest']

  const app = createMokupHonoApp({
    manifest,
    moduleBase: new URL('../dist/', import.meta.url),
    onNotFound: 'response',
  })

  const port = Number(nodeProcess.env.PORT ?? 8787)

  serve({
    fetch: app.fetch,
    port,
  })

  nodeProcess.stdout.write(
    `mokup mock server running on http://localhost:${port}\n`,
  )
}

start().catch((error) => {
  nodeProcess.stderr.write(
    `${error instanceof Error ? error.message : error}\n`,
  )
  nodeProcess.exit(1)
})
