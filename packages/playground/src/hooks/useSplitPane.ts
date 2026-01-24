import { computed, ref } from 'vue'

interface SplitPaneOptions {
  storageKey: string
  defaultWidth: number
  minWidth: number
  maxWidth: number
}

export function useSplitPane(options: SplitPaneOptions) {
  const splitWidth = ref(options.defaultWidth)
  const isDragging = ref(false)
  let dragStartX = 0
  let dragStartWidth = 0

  const splitStyle = computed(() => ({
    '--left-width': `${splitWidth.value}px`,
  }))

  function clampSplitWidth(value: number) {
    return Math.min(options.maxWidth, Math.max(options.minWidth, value))
  }

  function handleDragMove(event: PointerEvent) {
    if (!isDragging.value) {
      return
    }
    const delta = event.clientX - dragStartX
    splitWidth.value = clampSplitWidth(dragStartWidth + delta)
  }

  function stopDrag() {
    if (!isDragging.value) {
      return
    }
    isDragging.value = false
    window.removeEventListener('pointermove', handleDragMove)
    window.removeEventListener('pointerup', stopDrag)
    localStorage.setItem(options.storageKey, String(splitWidth.value))
  }

  function handleDragStart(event: PointerEvent) {
    if (event.button !== 0) {
      return
    }
    event.preventDefault()
    isDragging.value = true
    dragStartX = event.clientX
    dragStartWidth = splitWidth.value
    window.addEventListener('pointermove', handleDragMove)
    window.addEventListener('pointerup', stopDrag)
  }

  function restoreSplitWidth() {
    const stored = Number(localStorage.getItem(options.storageKey))
    if (Number.isFinite(stored) && stored > 0) {
      splitWidth.value = clampSplitWidth(stored)
    }
  }

  return {
    splitWidth,
    splitStyle,
    isDragging,
    handleDragStart,
    restoreSplitWidth,
    stopDrag,
  }
}
