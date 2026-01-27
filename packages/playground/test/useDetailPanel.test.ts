import { afterEach, describe, expect, it, vi } from 'vitest'

async function setupPanel(storageValue?: string) {
  vi.resetModules()
  const store = new Map<string, string>()
  if (storageValue) {
    store.set('mokup.playground.detailPanels', storageValue)
  }
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  })

  const mod = await import('../src/hooks/useDetailPanel')
  return { store, useDetailPanel: mod.useDetailPanel }
}

describe('useDetailPanel', () => {
  it('hydrates state from storage and persists updates', async () => {
    const { store, useDetailPanel } = await setupPanel(JSON.stringify({ configChain: true }))
    const panel = useDetailPanel('configChain')

    expect(panel.isOpen.value).toBe(true)
    panel.toggle()
    expect(panel.isOpen.value).toBe(false)
    expect(store.get('mokup.playground.detailPanels')).toContain('configChain')
  })

  it('uses defaults when storage is missing', async () => {
    const { useDetailPanel } = await setupPanel()
    const panel = useDetailPanel('middlewares')
    expect(panel.isOpen.value).toBe(false)
    panel.setOpen(true)
    expect(panel.isOpen.value).toBe(true)
  })

  it('falls back on invalid storage and missing window', async () => {
    const { useDetailPanel: withInvalid } = await setupPanel('{oops')
    const invalidPanel = withInvalid('configChain')
    expect(invalidPanel.isOpen.value).toBe(false)

    vi.unstubAllGlobals()
    vi.resetModules()
    const mod = await import('../src/hooks/useDetailPanel')
    const panel = mod.useDetailPanel('configChain')
    expect(panel.isOpen.value).toBe(false)
    panel.toggle()
    expect(panel.isOpen.value).toBe(true)
  })

  it('ignores storage write errors', async () => {
    vi.resetModules()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('fail')
      },
    })

    const mod = await import('../src/hooks/useDetailPanel')
    const panel = mod.useDetailPanel('configChain')
    panel.toggle()
    expect(panel.isOpen.value).toBe(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })
})
