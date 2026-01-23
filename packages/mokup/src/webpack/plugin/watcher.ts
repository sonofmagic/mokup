import chokidar from '@mokup/shared/chokidar'
import { createDebouncer, isInDirs } from '../../vite/utils'

function createWebpackWatcher(params: {
  enabled: boolean
  dirs: string[]
  onRefresh: () => void | Promise<void>
}) {
  if (!params.enabled || params.dirs.length === 0) {
    return null
  }
  const watcher = chokidar.watch(params.dirs, { ignoreInitial: true })
  const scheduleRefresh = createDebouncer(80, () => {
    void params.onRefresh()
  })
  watcher.on('add', (file) => {
    if (isInDirs(file, params.dirs)) {
      scheduleRefresh()
    }
  })
  watcher.on('change', (file) => {
    if (isInDirs(file, params.dirs)) {
      scheduleRefresh()
    }
  })
  watcher.on('unlink', (file) => {
    if (isInDirs(file, params.dirs)) {
      scheduleRefresh()
    }
  })
  return watcher
}

export { createWebpackWatcher }
