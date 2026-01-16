import type { Manifest } from 'moku-runtime'
import { readFile } from 'node:fs/promises'

import * as nodeProcess from 'node:process'
import { serve } from '@hono/node-server'
import { createMokuHonoApp } from 'moku-hono'

async function start() {
  const manifestPath = new URL('../dist/moku.manifest.json', import.meta.url)
  const manifest = JSON.parse(
    await readFile(manifestPath, 'utf8'),
  ) as Manifest

  const app = createMokuHonoApp({
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
    `moku mock server running on http://localhost:${port}\n`,
  )
}

start().catch((error) => {
  nodeProcess.stderr.write(
    `${error instanceof Error ? error.message : error}\n`,
  )
  nodeProcess.exitCode = 1
})
