const statusEl = document.querySelector<HTMLSpanElement>('[data-sw-status]')
const outputEl = document.querySelector<HTMLPreElement>('[data-output]')

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

function updateSwStatus() {
  if (!statusEl) {
    return
  }
  if (!('serviceWorker' in navigator)) {
    statusEl.textContent = 'not supported'
    return
  }
  if (navigator.serviceWorker.controller) {
    statusEl.textContent = 'active'
    return
  }
  statusEl.textContent = 'installing...'
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

async function upload() {
  const formData = new FormData()
  formData.append('title', 'Mokup upload')
  formData.append('note', 'Sent from the SW demo')
  formData.append('files', new File(['hello'], 'hello.txt', { type: 'text/plain' }))
  formData.append('files', new File(['world'], 'world.txt', { type: 'text/plain' }))
  const result = await fetchJson('/api/upload', {
    method: 'POST',
    body: formData,
  })
  setOutput(result)
}

document.querySelector('[data-action="ping"]')?.addEventListener('click', () => {
  void ping()
})

document.querySelector('[data-action="echo"]')?.addEventListener('click', () => {
  void echo()
})

document.querySelector('[data-action="upload"]')?.addEventListener('click', () => {
  void upload()
})

updateSwStatus()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    updateSwStatus()
  })
}
