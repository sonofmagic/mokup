import type { Logger } from '../dev/types'
import { isInDirs } from '../dev/utils'

interface RuntimeDeno {
  watchFs?: (paths: string | string[], options?: { recursive?: boolean }) => {
    close: () => void
    [Symbol.asyncIterator]: () => AsyncIterator<{ kind: string, paths: string[] }>
  }
}

async function createDenoWatcher(params: {
  dirs: string[]
  onChange: () => void
  logger: Logger
}): Promise<null | { close: () => Promise<void> }> {
  const deno = (globalThis as { Deno?: RuntimeDeno }).Deno
  if (!deno?.watchFs) {
    return null
  }
  const watcher = deno.watchFs(params.dirs, { recursive: true })
  let closed = false
  ;(async () => {
    try {
      for await (const event of watcher) {
        if (closed) {
          break
        }
        if (event.kind === 'access') {
          continue
        }
        params.onChange()
      }
    }
    catch (error) {
      if (!closed) {
        params.logger.warn('Watcher failed:', error)
      }
    }
  })()

  return {
    close: async () => {
      closed = true
      watcher.close()
    },
  }
}

async function createChokidarWatcher(params: {
  dirs: string[]
  onChange: () => void
}): Promise<null | { close: () => Promise<void> }> {
  try {
    const { default: chokidar } = await import('@mokup/shared/chokidar')
    const watcher = chokidar.watch(params.dirs, { ignoreInitial: true })
    watcher.on('add', (file) => {
      if (isInDirs(file, params.dirs)) {
        params.onChange()
      }
    })
    watcher.on('change', (file) => {
      if (isInDirs(file, params.dirs)) {
        params.onChange()
      }
    })
    watcher.on('unlink', (file) => {
      if (isInDirs(file, params.dirs)) {
        params.onChange()
      }
    })
    return {
      close: async () => {
        await watcher.close()
      },
    }
  }
  catch {
    return null
  }
}

async function createWatcher(params: {
  enabled: boolean
  dirs: string[]
  onChange: () => void
  logger: Logger
}) {
  if (!params.enabled || params.dirs.length === 0) {
    return null
  }
  const denoWatcher = await createDenoWatcher(params)
  if (denoWatcher) {
    return denoWatcher
  }
  const chokidarWatcher = await createChokidarWatcher(params)
  if (chokidarWatcher) {
    return chokidarWatcher
  }
  params.logger.warn('Watcher is not available in this runtime; file watching disabled.')
  return null
}

export { createWatcher }
