const hostStatusEl = document.querySelector<HTMLSpanElement>('[data-host-status]')
const hostScriptEl = document.querySelector<HTMLSpanElement>('[data-host-script]')
const bridgeStatusEl = document.querySelector<HTMLSpanElement>('[data-bridge-status]')
const outputEl = document.querySelector<HTMLPreElement>('[data-output]')

function setText(el: HTMLElement | null, value: string) {
  if (!el) {
    return
  }
  el.textContent = value
}

function setOutput(value: unknown) {
  if (!outputEl) {
    return
  }
  outputEl.textContent = JSON.stringify(value, null, 2)
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

function formatScriptUrl(scriptUrl: string | undefined) {
  if (!scriptUrl) {
    return 'n/a'
  }
  try {
    return new URL(scriptUrl).pathname
  }
  catch {
    return scriptUrl
  }
}

function isHostScript(scriptUrl: string | undefined) {
  if (!scriptUrl) {
    return false
  }
  try {
    return new URL(scriptUrl).pathname.endsWith('/sw.js')
  }
  catch {
    return scriptUrl.includes('sw.js')
  }
}

function getRegistrationScriptUrl(registration: ServiceWorkerRegistration) {
  return (
    registration.active?.scriptURL
    ?? registration.waiting?.scriptURL
    ?? registration.installing?.scriptURL
  )
}

async function getHostRegistration() {
  if (!('serviceWorker' in navigator)) {
    return null
  }
  const registrations = await navigator.serviceWorker.getRegistrations()
  if (registrations.length === 0) {
    return null
  }
  const preferred = registrations.find(registration =>
    isHostScript(getRegistrationScriptUrl(registration)),
  )
  return preferred ?? registrations[0] ?? null
}

async function updateHostStatus() {
  if (!hostStatusEl || !hostScriptEl) {
    return
  }
  if (!('serviceWorker' in navigator)) {
    setText(hostStatusEl, 'not supported')
    setText(hostScriptEl, 'n/a')
    return
  }
  const registration = await getHostRegistration()
  if (!registration) {
    setText(hostStatusEl, 'not registered')
    setText(hostScriptEl, 'n/a')
    return
  }
  const scriptUrl = getRegistrationScriptUrl(registration)
  setText(hostScriptEl, formatScriptUrl(scriptUrl))
  if (navigator.serviceWorker.controller) {
    setText(hostStatusEl, 'active')
    return
  }
  if (registration.installing || registration.waiting) {
    setText(hostStatusEl, 'installing')
    return
  }
  setText(hostStatusEl, 'installed')
}

function updateBridgeStatus(value: string) {
  setText(bridgeStatusEl, value)
}

async function ping() {
  const result = await fetchJson('/api/ping')
  setOutput(result)
}

async function echo() {
  const result = await fetchJson('/api/echo', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      ok: true,
      sentAt: new Date().toISOString(),
    }),
  })
  setOutput(result)
}

async function registerHostSw() {
  if (!('serviceWorker' in navigator)) {
    return
  }
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  }
  catch (error) {
    setOutput({ error: String(error) })
  }
  await updateHostStatus()
}

async function updateHostSw() {
  if (!('serviceWorker' in navigator)) {
    return
  }
  const registration = await getHostRegistration()
  await registration?.update()
  await updateHostStatus()
}

async function unregisterHostSw() {
  if (!('serviceWorker' in navigator)) {
    return
  }
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map(registration => registration.unregister()))
  updateBridgeStatus('waiting...')
  await updateHostStatus()
}

document.querySelector('[data-action="ping"]')?.addEventListener('click', () => {
  void ping()
})

document.querySelector('[data-action="echo"]')?.addEventListener('click', () => {
  void echo()
})

document.querySelector('[data-action="register-sw"]')?.addEventListener('click', () => {
  void registerHostSw()
})

document.querySelector('[data-action="update-sw"]')?.addEventListener('click', () => {
  void updateHostSw()
})

document.querySelector('[data-action="unregister-sw"]')?.addEventListener('click', () => {
  void unregisterHostSw()
})

updateBridgeStatus('waiting...')
void updateHostStatus()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    void updateHostStatus()
  })
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data
    if (!data || typeof data !== 'object') {
      return
    }
    if (data.type === 'mokup:bridge-ready') {
      updateBridgeStatus('ready')
    }
    if (data.type === 'mokup:bridge-error') {
      updateBridgeStatus('error')
    }
  })
  void navigator.serviceWorker.ready.then(() => updateHostStatus())
}
