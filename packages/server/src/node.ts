import type { FSWatcher } from '@mokup/shared/chokidar'
import type { Hono } from '@mokup/shared/hono'
import type { Server as HttpServer, IncomingMessage, ServerResponse } from 'node:http'
import type { Logger, RouteTable } from './dev/types'

import type { DirInput } from './dev/utils'
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import { cwd } from 'node:process'
import chokidar from '@mokup/shared/chokidar'
import { Hono as HonoApp } from '@mokup/shared/hono'

import { createHonoApp } from './dev/hono'
import { createLogger } from './dev/logger'
import { registerPlaygroundRoutes, resolvePlaygroundOptions } from './dev/playground'
import { scanRoutes } from './dev/scanner'
import { createDebouncer, isInDirs, resolveDirs } from './dev/utils'

export interface MokupNodeServerOptions {
  dir?: DirInput
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  watch?: boolean
  log?: boolean
  playground?: boolean | { path?: string, enabled?: boolean }
  host?: string
  port?: number
  root?: string
}

export interface MokupNodeServer {
  server: HttpServer
  listen: () => Promise<{ host: string, port: number }>
  close: () => Promise<void>
  refresh: () => Promise<void>
  getRoutes: () => RouteTable
}

async function readRawBody(req: IncomingMessage) {
  return await new Promise<Uint8Array | null>((resolve, reject) => {
    const chunks: Uint8Array[] = []
    req.on('data', (chunk) => {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk))
        return
      }
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk)
        return
      }
      chunks.push(Buffer.from(String(chunk)))
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(null)
        return
      }
      resolve(Buffer.concat(chunks))
    })
    req.on('error', reject)
  })
}

function buildHeaders(headers: IncomingMessage['headers']) {
  const result = new Headers()
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'undefined') {
      continue
    }
    if (Array.isArray(value)) {
      result.set(key, value.join(','))
    }
    else {
      result.set(key, value)
    }
  }
  return result
}

async function toRequest(req: IncomingMessage) {
  const url = new URL(req.url ?? '/', 'http://mokup.local')
  const method = req.method ?? 'GET'
  const headers = buildHeaders(req.headers)
  const init: RequestInit = { method, headers }
  const rawBody = await readRawBody(req)
  if (rawBody && method !== 'GET' && method !== 'HEAD') {
    init.body = rawBody as BodyInit
  }
  return new Request(url.toString(), init)
}

async function sendResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  if (!response.body) {
    res.end()
    return
  }
  const buffer = new Uint8Array(await response.arrayBuffer())
  res.end(buffer)
}

function buildApp(params: {
  routes: RouteTable
  dirs: string[]
  playground: ReturnType<typeof resolvePlaygroundOptions>
  root: string
  logger: Logger
}) {
  const app = new HonoApp({ strict: false })
  registerPlaygroundRoutes({
    app,
    routes: params.routes,
    dirs: params.dirs,
    logger: params.logger,
    config: params.playground,
    root: params.root,
  })
  if (params.routes.length > 0) {
    const mockApp = createHonoApp(params.routes)
    app.route('/', mockApp)
  }
  return app
}

export async function createMokupServer(
  options: MokupNodeServerOptions = {},
): Promise<MokupNodeServer> {
  const root = options.root ?? cwd()
  const host = options.host ?? 'localhost'
  const port = options.port ?? 8080
  const watchEnabled = options.watch !== false
  const logEnabled = options.log !== false
  const logger = createLogger(logEnabled)
  const playgroundConfig = resolvePlaygroundOptions(options.playground)
  const dirs = resolveDirs(options.dir, root)

  let routes: RouteTable = []
  let app: Hono = new HonoApp({ strict: false })
  let watcher: FSWatcher | null = null

  const refreshRoutes = async () => {
    try {
      routes = await scanRoutes({
        dirs,
        prefix: options.prefix ?? '',
        include: options.include,
        exclude: options.exclude,
        logger,
      })
      app = buildApp({
        routes,
        dirs,
        playground: playgroundConfig,
        root,
        logger,
      })
      logger.info(`Loaded ${routes.length} mock routes.`)
    }
    catch (error) {
      routes = []
      app = buildApp({
        routes,
        dirs,
        playground: playgroundConfig,
        root,
        logger,
      })
      logger.error('Failed to scan mock routes:', error)
    }
  }

  await refreshRoutes()

  if (watchEnabled) {
    const scheduleRefresh = createDebouncer(80, () => {
      void refreshRoutes()
    })
    watcher = chokidar.watch(dirs, { ignoreInitial: true })
    watcher.on('add', (file) => {
      if (isInDirs(file, dirs)) {
        scheduleRefresh()
      }
    })
    watcher.on('change', (file) => {
      if (isInDirs(file, dirs)) {
        scheduleRefresh()
      }
    })
    watcher.on('unlink', (file) => {
      if (isInDirs(file, dirs)) {
        scheduleRefresh()
      }
    })
  }

  const server = createServer(async (req, res) => {
    try {
      const response = await app.fetch(await toRequest(req))
      if (res.writableEnded) {
        return
      }
      await sendResponse(res, response)
    }
    catch (error) {
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      }
      res.end('Mock server error')
      logger.error('Mock server failed:', error)
    }
  })

  const listen = async () => {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        server.off('listening', onListening)
        reject(error)
      }
      const onListening = () => {
        server.off('error', onError)
        resolve()
      }
      server.once('error', onError)
      server.once('listening', onListening)
      server.listen(port, host)
    })
    const address = server.address()
    const resolvedHost = typeof address === 'string'
      ? host
      : address?.address ?? host
    const resolvedPort = typeof address === 'string'
      ? port
      : address?.port ?? port
    logger.info(`Mock server ready at http://${resolvedHost}:${resolvedPort}`)
    if (playgroundConfig.enabled) {
      logger.info(`Playground at http://${resolvedHost}:${resolvedPort}${playgroundConfig.path}`)
    }
    return { host: resolvedHost, port: resolvedPort }
  }

  const close = async () => {
    if (watcher) {
      await watcher.close()
      watcher = null
    }
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  return {
    server,
    listen,
    close,
    refresh: refreshRoutes,
    getRoutes: () => routes,
  }
}

export async function startMokupServer(
  options: MokupNodeServerOptions = {},
): Promise<MokupNodeServer> {
  const server = await createMokupServer(options)
  await server.listen()
  return server
}
