import type { ThemeMode } from '../utils/theme'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  applyTheme,
  nextThemeMode,
  persistThemeMode,
  readThemeMode,
  resolveTheme,

} from '../utils/theme'

export function usePlaygroundTheme() {
  const themeMode = ref<ThemeMode>('system')
  const prefersDark = ref(false)
  let media: MediaQueryList | null = null

  const effectiveTheme = computed(() => resolveTheme(themeMode.value, prefersDark.value))

  const updateFromMedia = () => {
    if (!media) {
      return
    }
    prefersDark.value = media.matches
    if (themeMode.value === 'system') {
      applyTheme(themeMode.value, prefersDark.value)
    }
  }

  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode
    persistThemeMode(mode)
    applyTheme(mode, prefersDark.value)
  }

  function cycleThemeMode() {
    setThemeMode(nextThemeMode(themeMode.value))
  }

  onMounted(() => {
    media = window.matchMedia('(prefers-color-scheme: dark)')
    prefersDark.value = media.matches
    themeMode.value = readThemeMode() ?? 'system'
    applyTheme(themeMode.value, prefersDark.value)
    media.addEventListener('change', updateFromMedia)
  })

  onBeforeUnmount(() => {
    media?.removeEventListener('change', updateFromMedia)
    media = null
  })

  return {
    themeMode,
    effectiveTheme,
    setThemeMode,
    cycleThemeMode,
  }
}
