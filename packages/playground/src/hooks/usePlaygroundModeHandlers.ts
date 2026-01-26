import type { Ref } from 'vue'
import type {
  PlaygroundConfigFile,
  PlaygroundDisabledRoute,
  PlaygroundIgnoredRoute,
  PlaygroundRoute,
} from '../types'

export function usePlaygroundModeHandlers(params: {
  routeMode: Ref<'active' | 'disabled' | 'ignored'>
  enabledMode: Ref<'api' | 'config'>
  disabledMode: Ref<'api' | 'config'>
  selected: Ref<PlaygroundRoute | null>
  selectedDisabled: Ref<PlaygroundDisabledRoute | null>
  selectedIgnored: Ref<PlaygroundIgnoredRoute | null>
  selectedConfig: Ref<PlaygroundConfigFile | null>
  filtered: Ref<PlaygroundRoute[]>
  disabledFiltered: Ref<PlaygroundDisabledRoute[]>
  ignoredFiltered: Ref<PlaygroundIgnoredRoute[]>
  lastSelectedKey: Ref<string>
  getRouteKey: (route: PlaygroundRoute) => string
  selectRoute: (route: PlaygroundRoute | null) => void
  selectDisabledRoute: (route: PlaygroundDisabledRoute | null) => void
  selectIgnoredRoute: (route: PlaygroundIgnoredRoute | null) => void
  selectConfig: (config: PlaygroundConfigFile | null) => void
}) {
  function resolveLastSelectedRoute() {
    const key = params.lastSelectedKey.value
    if (!key) {
      return null
    }
    return params.filtered.value.find(route => params.getRouteKey(route) === key) ?? null
  }

  function setRouteMode(mode: 'active' | 'disabled' | 'ignored') {
    params.routeMode.value = mode
    if (mode !== 'active') {
      params.selectRoute(null)
      params.selectConfig(null)
      if (mode === 'disabled' && params.disabledMode.value === 'api') {
        params.selectDisabledRoute(params.disabledFiltered.value[0] ?? null)
        params.selectIgnoredRoute(null)
      }
      if (mode === 'ignored') {
        params.selectIgnoredRoute(params.ignoredFiltered.value[0] ?? null)
        params.selectDisabledRoute(null)
      }
      return
    }
    params.selectDisabledRoute(null)
    params.selectIgnoredRoute(null)
    if (params.enabledMode.value === 'api' && !params.selected.value) {
      const lastSelected = resolveLastSelectedRoute()
      if (lastSelected) {
        params.selectRoute(lastSelected)
      }
    }
    if (params.enabledMode.value !== 'config') {
      params.selectConfig(null)
    }
  }

  function setEnabledMode(mode: 'api' | 'config') {
    params.enabledMode.value = mode
    if (mode === 'config') {
      params.selectRoute(null)
      return
    }
    params.selectConfig(null)
    params.selectDisabledRoute(null)
    params.selectIgnoredRoute(null)
    if (!params.selected.value) {
      const lastSelected = resolveLastSelectedRoute()
      if (lastSelected) {
        params.selectRoute(lastSelected)
      }
    }
  }

  function setDisabledMode(mode: 'api' | 'config') {
    params.disabledMode.value = mode
    if (mode === 'config') {
      params.selectDisabledRoute(null)
      return
    }
    params.selectConfig(null)
    if (!params.selectedDisabled.value) {
      params.selectDisabledRoute(params.disabledFiltered.value[0] ?? null)
    }
  }

  function handleSelectRoute(route: PlaygroundRoute | null) {
    params.selectConfig(null)
    params.selectDisabledRoute(null)
    params.selectIgnoredRoute(null)
    params.selectRoute(route)
  }

  function handleSelectConfig(config: PlaygroundConfigFile | null) {
    params.selectRoute(null)
    params.selectDisabledRoute(null)
    params.selectIgnoredRoute(null)
    params.selectConfig(config)
  }

  function handleSelectDisabled(route: PlaygroundDisabledRoute | null) {
    params.selectRoute(null)
    params.selectConfig(null)
    params.selectIgnoredRoute(null)
    params.selectDisabledRoute(route)
  }

  function handleSelectIgnored(route: PlaygroundIgnoredRoute | null) {
    params.selectRoute(null)
    params.selectConfig(null)
    params.selectDisabledRoute(null)
    params.selectIgnoredRoute(route)
  }

  return {
    setRouteMode,
    setEnabledMode,
    setDisabledMode,
    handleSelectRoute,
    handleSelectConfig,
    handleSelectDisabled,
    handleSelectIgnored,
  }
}
