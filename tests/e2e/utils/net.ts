import net from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'

export async function isPortOpen(port: number, host = '127.0.0.1') {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ port, host })
    const done = (result: boolean) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(result)
    }
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
    socket.setTimeout(500)
    socket.once('timeout', () => done(false))
  })
}

export async function waitForHttp(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' })
      if (response.ok || response.status < 500) {
        return
      }
    }
    catch (error) {
      lastError = error
    }
    await delay(250)
  }
  throw new Error(`Timeout waiting for ${url}: ${String(lastError)}`)
}
