import type { Ref } from 'vue'
import type {
  PlaygroundConfigFile,
  PlaygroundDisabledRoute,
  PlaygroundIgnoredRoute,
  PlaygroundRoute,
} from '../types'
import { computed } from 'vue'

export function usePlaygroundCounts(params: {
  routes: Ref<PlaygroundRoute[]>
  configCount: Ref<number>
  disabledCount: Ref<number>
  ignoredCount: Ref<number>
  disabledConfigCount: Ref<number>
  routeCount: Ref<number>
  disabledFiltered: Ref<PlaygroundDisabledRoute[]>
  ignoredFiltered: Ref<PlaygroundIgnoredRoute[]>
  configFiltered: Ref<PlaygroundConfigFile[]>
  disabledConfigFiltered: Ref<PlaygroundConfigFile[]>
  routeMode: Ref<'active' | 'disabled' | 'ignored'>
  enabledMode: Ref<'api' | 'config'>
  disabledMode: Ref<'api' | 'config'>
}) {
  const isDisabledMode = computed(() => params.routeMode.value === 'disabled')
  const isIgnoredMode = computed(() => params.routeMode.value === 'ignored')
  const activeTotal = computed(() => params.routes.value.length + params.configCount.value)
  const apiTotal = computed(() => params.routes.value.length)
  const disabledTotal = computed(() => params.disabledCount.value + params.disabledConfigCount.value)
  const ignoredTotal = computed(() => params.ignoredCount.value)
  const configTotal = computed(() => params.configCount.value)
  const disabledConfigTotal = computed(() => params.disabledConfigCount.value)
  const disabledApiTotal = computed(() => params.disabledCount.value)
  const visibleCount = computed(() => {
    if (isDisabledMode.value) {
      return params.disabledMode.value === 'config'
        ? params.disabledConfigFiltered.value.length
        : params.disabledFiltered.value.length
    }
    if (isIgnoredMode.value) {
      return params.ignoredFiltered.value.length
    }
    return params.enabledMode.value === 'config'
      ? params.configFiltered.value.length
      : params.routeCount.value
  })

  return {
    activeTotal,
    apiTotal,
    disabledTotal,
    ignoredTotal,
    configTotal,
    disabledConfigTotal,
    disabledApiTotal,
    visibleCount,
  }
}
