import type { PreviewServer, ViteDevServer } from 'vite'
import { isAbsolute, resolve } from 'node:path'
import chokidar from '@mokup/shared/chokidar'
import { createDebouncer, isInDirs } from '../utils'

function normalizeWatcherFile(file: string, rootDir: string) {
  if (!file) {
    return file
  }
  if (isAbsolute(file)) {
    return file
  }
  return resolve(rootDir, file)
}

function normalizeRawWatcherPath(rawPath: unknown) {
  if (typeof rawPath === 'string') {
    return rawPath
  }
  if (rawPath && typeof (rawPath as { toString?: () => string }).toString === 'function') {
    return (rawPath as { toString: () => string }).toString()
  }
  return ''
}

function setupViteWatchers(params: {
  server: ViteDevServer
  root: string
  dirs: string[]
  refresh: () => void | Promise<void>
}) {
  const scheduleRefresh = createDebouncer(80, () => {
    void params.refresh()
  })
  const handleWatchedFile = (file: string) => {
    const resolvedFile = normalizeWatcherFile(file, params.server.config.root ?? params.root)
    if (isInDirs(resolvedFile, params.dirs)) {
      scheduleRefresh()
    }
  }
  params.server.watcher.add(params.dirs)
  params.server.watcher.on('add', handleWatchedFile)
  params.server.watcher.on('change', handleWatchedFile)
  params.server.watcher.on('unlink', handleWatchedFile)
  params.server.watcher.on('raw', (eventName, rawPath, details) => {
    if (eventName !== 'rename') {
      return
    }
    const candidate = normalizeRawWatcherPath(rawPath)
    if (!candidate) {
      return
    }
    const baseDir = typeof details === 'object' && details && 'watchedPath' in details
      ? (details as { watchedPath?: string }).watchedPath ?? (params.server.config.root ?? params.root)
      : params.server.config.root ?? params.root
    const resolvedFile = normalizeWatcherFile(candidate, baseDir)
    if (isInDirs(resolvedFile, params.dirs)) {
      scheduleRefresh()
    }
  })
}

function setupPreviewWatchers(params: {
  server: PreviewServer
  root: string
  dirs: string[]
  refresh: () => void | Promise<void>
}) {
  const watcher = chokidar.watch(params.dirs, { ignoreInitial: true })
  const scheduleRefresh = createDebouncer(80, () => {
    void params.refresh()
  })
  const handleWatchedFile = (file: string) => {
    const resolvedFile = normalizeWatcherFile(file, params.server.config.root ?? params.root)
    if (isInDirs(resolvedFile, params.dirs)) {
      scheduleRefresh()
    }
  }
  watcher.on('add', handleWatchedFile)
  watcher.on('change', handleWatchedFile)
  watcher.on('unlink', handleWatchedFile)
  watcher.on('raw', (eventName, rawPath, details) => {
    if (eventName !== 'rename') {
      return
    }
    const candidate = normalizeRawWatcherPath(rawPath)
    if (!candidate) {
      return
    }
    const baseDir = typeof details === 'object' && details && 'watchedPath' in details
      ? (details as { watchedPath?: string }).watchedPath ?? (params.server.config.root ?? params.root)
      : params.server.config.root ?? params.root
    const resolvedFile = normalizeWatcherFile(candidate, baseDir)
    if (isInDirs(resolvedFile, params.dirs)) {
      scheduleRefresh()
    }
  })
  params.server.httpServer?.once('close', () => {
    watcher.close()
  })
  return watcher
}

export { setupPreviewWatchers, setupViteWatchers }
