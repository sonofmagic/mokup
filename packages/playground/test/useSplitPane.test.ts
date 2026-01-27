import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSplitPane } from '../src/hooks/useSplitPane'

describe('useSplitPane', () => {
  it('handles drag interactions and restores width', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    })

    let moveHandler: ((event: PointerEvent) => void) | null = null
    let upHandler: (() => void) | null = null
    vi.stubGlobal('window', {
      addEventListener: (event: string, handler: (event: PointerEvent) => void) => {
        if (event === 'pointermove') {
          moveHandler = handler
        }
        if (event === 'pointerup') {
          upHandler = handler as () => void
        }
      },
      removeEventListener: vi.fn(),
    })

    const pane = useSplitPane({
      storageKey: 'split',
      defaultWidth: 200,
      minWidth: 100,
      maxWidth: 400,
    })

    expect(pane.splitStyle.value['--left-width']).toBe('200px')

    pane.restoreSplitWidth()
    expect(pane.splitWidth.value).toBe(200)

    const preventDefault = vi.fn()
    pane.handleDragStart({ button: 0, clientX: 10, preventDefault } as PointerEvent)
    moveHandler?.({ clientX: 210 } as PointerEvent)
    expect(pane.splitWidth.value).toBe(400)

    upHandler?.()
    expect(store.get('split')).toBe('400')
    expect(preventDefault).toHaveBeenCalled()

    moveHandler?.({ clientX: 999 } as PointerEvent)
    expect(pane.splitWidth.value).toBe(400)
  })

  it('ignores drag events when inactive or invalid', () => {
    const store = new Map<string, string>()
    const setItem = vi.fn((key: string, value: string) => {
      store.set(key, value)
    })
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem,
    })

    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const pane = useSplitPane({
      storageKey: 'split',
      defaultWidth: 200,
      minWidth: 100,
      maxWidth: 400,
    })

    pane.stopDrag()
    expect(setItem).not.toHaveBeenCalled()

    pane.handleDragStart({ button: 0, clientX: 10, preventDefault: vi.fn() } as PointerEvent)
    pane.stopDrag()
    expect(setItem).toHaveBeenCalled()

    pane.handleDragStart({ button: 1, clientX: 0, preventDefault: vi.fn() } as PointerEvent)
    expect(pane.isDragging.value).toBe(false)

    store.set('split', '0')
    pane.restoreSplitWidth()
    expect(pane.splitWidth.value).toBe(200)

    pane.handleDragStart({ button: 0, clientX: 20, preventDefault: vi.fn() } as PointerEvent)
    pane.stopDrag()
    store.set('split', '300')
    pane.restoreSplitWidth()
    expect(pane.splitWidth.value).toBe(300)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })
})
