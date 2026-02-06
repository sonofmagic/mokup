import type { PreviewServer, ViteDevServer } from 'vite'
import { normalizeBase } from './config'

function injectPlaygroundHmr(html: string, base: string) {
  if (html.includes('mokup-playground-hmr')) {
    return html
  }
  const normalizedBase = normalizeBase(base)
  const clientPath = `${normalizedBase}/@vite/client`
  const snippet = [
    '<script type="module" id="mokup-playground-hmr">',
    `import('${clientPath}').then(({ createHotContext }) => {`,
    '  const hot = createHotContext(\'/@mokup/playground\')',
    '  const updateMokupServiceWorker = () => {',
    '    if (typeof navigator === \"undefined\" || !(\'serviceWorker\' in navigator)) {',
    '      return',
    '    }',
    '    navigator.serviceWorker.getRegistrations().then((registrations) => {',
    '      return Promise.all(registrations.map((registration) => registration.update()))',
    '    }).catch(() => {})',
    '  }',
    '  hot.on(\'mokup:routes-changed\', () => {',
    '    updateMokupServiceWorker()',
    '    const api = window.__MOKUP_PLAYGROUND__',
    '    if (api && typeof api.reloadRoutes === \'function\') {',
    '      api.reloadRoutes()',
    '      if (typeof api.notifyHotReload === \'function\') {',
    '        api.notifyHotReload()',
    '      }',
    '      return',
    '    }',
    '    window.location.reload()',
    '  })',
    '}).catch(() => {})',
    '</script>',
  ].join('\n')
  if (html.includes('</body>')) {
    return html.replace('</body>', `${snippet}\n</body>`)
  }
  return `${html}\n${snippet}`
}

function injectPlaygroundSw(html: string, script: string | null | undefined) {
  if (!script) {
    return html
  }
  if (html.includes('mokup-playground-sw')) {
    return html
  }
  const snippet = [
    '<script type="module" id="mokup-playground-sw">',
    script,
    '</script>',
  ].join('\n')
  if (html.includes('</head>')) {
    return html.replace('</head>', `${snippet}\n</head>`)
  }
  if (html.includes('</body>')) {
    return html.replace('</body>', `${snippet}\n</body>`)
  }
  return `${html}\n${snippet}`
}

function isViteDevServer(
  server: ViteDevServer | PreviewServer | undefined | null,
): server is ViteDevServer {
  return !!server && 'ws' in server
}

export { injectPlaygroundHmr, injectPlaygroundSw, isViteDevServer }
