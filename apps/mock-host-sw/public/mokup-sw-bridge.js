const mokupSwPath = '/mokup-sw.js'
const mokupSwUrl = new URL(mokupSwPath, globalThis.location.origin).href

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
    // eslint-disable-next-line no-console
    console.warn('[mokup] Failed to import mokup SW:', error)
    await notifyClients({ type: 'mokup:bridge-error', error: String(error) })
  }
}

void loadMokup()
