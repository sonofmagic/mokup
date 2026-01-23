import type { PreviewServer, ViteDevServer } from 'vite'

function isViteDevServer(
  server: ViteDevServer | PreviewServer | undefined | null,
): server is ViteDevServer {
  return !!server && 'ws' in server
}

export { isViteDevServer }
