import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { usePlaygroundCounts } from '../src/hooks/usePlaygroundCounts'

describe('usePlaygroundCounts', () => {
  it('computes totals and visible counts', () => {
    const routes = ref([{ method: 'GET', url: '/a', file: 'a.ts', type: 'handler' }])
    const configCount = ref(1)
    const disabledCount = ref(2)
    const ignoredCount = ref(1)
    const disabledConfigCount = ref(1)
    const routeCount = ref(1)
    const disabledFiltered = ref([{ file: 'b.ts', reason: 'disabled' }])
    const ignoredFiltered = ref([{ file: 'c.ts', reason: 'ignored' }])
    const configFiltered = ref([{ file: 'index.config.ts' }])
    const disabledConfigFiltered = ref([{ file: 'disabled.config.ts' }])
    const routeMode = ref<'active' | 'disabled' | 'ignored'>('active')
    const enabledMode = ref<'api' | 'config'>('api')
    const disabledMode = ref<'api' | 'config'>('api')

    const counts = usePlaygroundCounts({
      routes,
      configCount,
      disabledCount,
      ignoredCount,
      disabledConfigCount,
      routeCount,
      disabledFiltered,
      ignoredFiltered,
      configFiltered,
      disabledConfigFiltered,
      routeMode,
      enabledMode,
      disabledMode,
    })

    expect(counts.activeTotal.value).toBe(2)
    expect(counts.apiTotal.value).toBe(1)
    expect(counts.disabledTotal.value).toBe(3)
    expect(counts.ignoredTotal.value).toBe(1)
    expect(counts.visibleCount.value).toBe(1)

    routeMode.value = 'disabled'
    disabledMode.value = 'config'
    expect(counts.visibleCount.value).toBe(1)

    routeMode.value = 'ignored'
    expect(counts.visibleCount.value).toBe(1)

    routeMode.value = 'active'
    enabledMode.value = 'config'
    expect(counts.visibleCount.value).toBe(1)
  })

  it('switches visible counts across modes', () => {
    const routes = ref([{ method: 'GET', url: '/a', file: 'a.ts', type: 'handler' }])
    const configCount = ref(2)
    const disabledCount = ref(1)
    const ignoredCount = ref(0)
    const disabledConfigCount = ref(3)
    const routeCount = ref(1)
    const disabledFiltered = ref([{ file: 'b.ts', reason: 'disabled' }])
    const ignoredFiltered = ref([] as Array<{ file: string, reason: string }>)
    const configFiltered = ref([{ file: 'index.config.ts' }, { file: 'other.config.ts' }])
    const disabledConfigFiltered = ref([{ file: 'disabled.config.ts' }])
    const routeMode = ref<'active' | 'disabled' | 'ignored'>('disabled')
    const enabledMode = ref<'api' | 'config'>('api')
    const disabledMode = ref<'api' | 'config'>('api')

    const counts = usePlaygroundCounts({
      routes,
      configCount,
      disabledCount,
      ignoredCount,
      disabledConfigCount,
      routeCount,
      disabledFiltered,
      ignoredFiltered,
      configFiltered,
      disabledConfigFiltered,
      routeMode,
      enabledMode,
      disabledMode,
    })

    expect(counts.disabledConfigTotal.value).toBe(3)
    expect(counts.disabledApiTotal.value).toBe(1)
    expect(counts.visibleCount.value).toBe(1)

    disabledMode.value = 'config'
    expect(counts.visibleCount.value).toBe(1)

    routeMode.value = 'active'
    enabledMode.value = 'config'
    expect(counts.visibleCount.value).toBe(2)
  })
})
