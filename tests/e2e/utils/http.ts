import type { Server } from 'node:http'

export async function listen(server: Server, host = '127.0.0.1') {
  await new Promise<void>((resolve) => {
    server.listen(0, host, () => resolve())
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind server to an ephemeral port.')
  }
  const url = `http://${host}:${address.port}`
  return {
    url,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
    },
  }
}

export async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  const json = await response.json() as Record<string, unknown>
  return { response, json }
}
