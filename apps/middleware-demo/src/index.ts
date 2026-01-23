import type { ServerOptions, WorkerBundle } from 'mokup/server'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createExpressMiddleware } from 'mokup/server'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

type AppEnv = NodeJS.ProcessEnv & {
  PORT?: string
}

function writeLine(message: string) {
  process.stdout.write(`${message}\n`)
}

function writeError(message: string) {
  process.stderr.write(`${message}\n`)
}

async function loadBundle(): Promise<WorkerBundle> {
  const bundleUrl = new URL('../.mokup/mokup.bundle.mjs', import.meta.url)
  try {
    const mod = await import(bundleUrl.href)
    const bundle = (mod.default ?? mod.mokupBundle) as WorkerBundle | undefined
    if (!bundle || !bundle.manifest) {
      throw new Error('Invalid mokup bundle: missing manifest.')
    }
    return bundle
  }
  catch (error) {
    writeError('Failed to load mokup bundle.')
    writeError('Run `pnpm --filter middleware-demo build:mock` first.')
    throw error
  }
}

async function start() {
  const bundle = await loadBundle()
  const options: ServerOptions = {
    manifest: bundle.manifest,
    moduleBase: new URL('../.mokup/', import.meta.url),
    onNotFound: 'next',
    ...(typeof bundle.moduleMap !== 'undefined'
      ? { moduleMap: bundle.moduleMap }
      : {}),
  }

  const app = express()

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      uptime: Math.round(process.uptime()),
    })
  })

  app.use('/api', createExpressMiddleware(options))

  app.use(express.static(path.join(rootDir, 'public')))

  app.use((_req, res) => {
    res.status(404).send('Not Found')
  })

  const env = process.env as AppEnv
  const port = Number(env.PORT ?? 3000)
  app.listen(port, () => {
    writeLine(`Middleware demo running at http://localhost:${port}`)
    writeLine(`Mokup routes: http://localhost:${port}/api/health`)
  })
}

start().catch((error) => {
  writeError(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
