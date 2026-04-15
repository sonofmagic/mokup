import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'

declare global {
  interface Window {
    __MOKUP_PLAYGROUND__?: {
      reloadRoutes?: () => void
      notifyHotReload?: () => void
    }
  }
}

function usePlaygroundShell(params: {
  loadRoutes: () => Promise<void>
  setBasePath: (pathname: string) => void
  restoreSplitWidth: () => void
  stopDrag: () => void
  splitWidth: Ref<number>
}) {
  const hotReloadVisible = ref(false)
  const hotReloadTimer = ref<number | null>(null)
  const sidebarCollapsed = ref(false)
  const sidebarLastWidth = ref(320)
  const sidebarCollapsedKey = 'mokup.playground.sidebarCollapsed'
  const sidebarCollapsedWidth = 72

  function handleRefresh() {
    params.loadRoutes().catch(() => undefined)
  }

  function notifyHotReload() {
    if (hotReloadTimer.value) {
      window.clearTimeout(hotReloadTimer.value)
    }
    hotReloadVisible.value = true
    hotReloadTimer.value = window.setTimeout(() => {
      hotReloadVisible.value = false
      hotReloadTimer.value = null
    }, 2000)
  }

  function toggleSidebar() {
    if (sidebarCollapsed.value) {
      sidebarCollapsed.value = false
      params.splitWidth.value = sidebarLastWidth.value
    }
    else {
      sidebarLastWidth.value = params.splitWidth.value
      sidebarCollapsed.value = true
      params.splitWidth.value = sidebarCollapsedWidth
    }
    localStorage.setItem(sidebarCollapsedKey, String(sidebarCollapsed.value))
  }

  onMounted(() => {
    params.setBasePath(window.location.pathname)
    params.restoreSplitWidth()
    sidebarLastWidth.value = params.splitWidth.value
    const storedCollapsed = localStorage.getItem(sidebarCollapsedKey)
    if (storedCollapsed === 'true') {
      sidebarCollapsed.value = true
      params.splitWidth.value = sidebarCollapsedWidth
    }
    window.__MOKUP_PLAYGROUND__ = {
      reloadRoutes: handleRefresh,
      notifyHotReload,
    }
    handleRefresh()
  })

  onBeforeUnmount(() => {
    params.stopDrag()
    if (hotReloadTimer.value) {
      window.clearTimeout(hotReloadTimer.value)
    }
  })

  return {
    hotReloadVisible,
    sidebarCollapsed,
    handleRefresh,
    toggleSidebar,
  }
}

export { usePlaygroundShell }
