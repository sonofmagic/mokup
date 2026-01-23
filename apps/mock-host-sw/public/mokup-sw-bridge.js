const mokupSwPath = '/mokup-sw.js'
const mokupSwUrl = new URL(mokupSwPath, globalThis.location.origin).href
const logger = globalThis.consola?.withTag?.('mokup')
  ?? globalThis.consola
  ?? { warn: () => {} }

async function notifyClients(payload) {
  const clients = await globalThis.clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const client of clients) {
    client.postMessage(payload)
  }
}

async function loadMokup() {
  try {
    await import(mokupSwUrl)
    await notifyClients({ type: 'mokup:bridge-ready', url: mokupSwPath })
  }
  catch (error) {
    logger.warn('Failed to import mokup SW:', error)
    await notifyClients({ type: 'mokup:bridge-error', error: String(error) })
  }
}

void loadMokup()
