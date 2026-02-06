import { computed, ref } from 'vue'

type DetailPanelKey = 'configChain' | 'middlewares'
type DetailPanelState = Record<DetailPanelKey, boolean>

const STORAGE_KEY = 'mokup.playground.detailPanels.v2'
const LEGACY_STORAGE_KEY = 'mokup.playground.detailPanels'
const defaultState: DetailPanelState = {
  configChain: false,
  middlewares: false,
}

const panelState = ref<DetailPanelState>(defaultState)
let isHydrated = false

function readPanelState(): DetailPanelState {
  if (typeof window === 'undefined') {
    return defaultState
  }

  const parseState = (raw: string | null): DetailPanelState | null => {
    if (!raw) {
      return null
    }
    try {
      const parsed = JSON.parse(raw) as Partial<DetailPanelState>
      return {
        ...defaultState,
        ...parsed,
      }
    }
    catch {
      return null
    }
  }

  try {
    return parseState(localStorage.getItem(STORAGE_KEY))
      ?? parseState(localStorage.getItem(LEGACY_STORAGE_KEY))
      ?? defaultState
  }
  catch {
    return defaultState
  }
}

function persistPanelState(state: DetailPanelState) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(state))
  }
  catch {
    // ignore storage errors
  }
}

function ensurePanelState() {
  if (isHydrated || typeof window === 'undefined') {
    return
  }
  panelState.value = readPanelState()
  isHydrated = true
}

function setPanelState(key: DetailPanelKey, value: boolean) {
  ensurePanelState()
  const next = {
    ...panelState.value,
    [key]: value,
  }
  panelState.value = next
  persistPanelState(next)
}

export function useDetailPanel(key: DetailPanelKey) {
  ensurePanelState()

  const isOpen = computed(() => panelState.value[key])
  const toggle = () => setPanelState(key, !panelState.value[key])
  const setOpen = (value: boolean) => setPanelState(key, value)

  return {
    isOpen,
    toggle,
    setOpen,
  }
}
