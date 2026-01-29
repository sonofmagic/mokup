<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const status = ref('checking...')
const output = ref('{}')

function setOutput(value: unknown) {
  output.value = JSON.stringify(value, null, 2)
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
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    status.value = 'not supported'
    return
  }
  if (navigator.serviceWorker.controller) {
    status.value = 'active'
    return
  }
  status.value = 'installing...'
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

function handleControllerChange() {
  updateSwStatus()
}

onMounted(() => {
  updateSwStatus()
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
  }
})

onBeforeUnmount(() => {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
  }
})
</script>

<template>
  <main>
    <h1>Mokup Service Worker Demo</h1>
    <p>Vite dev uses <code>mokup/vite</code> with <code>mode: "sw"</code>. No manual registration needed.</p>
    <div class="meta">
      <span class="pill">/api/ping</span>
      <span class="pill">/api/echo</span>
      <span class="pill">/api/upload</span>
      <span class="pill secondary">SW: <span>{{ status }}</span></span>
    </div>
    <div class="actions">
      <button type="button" @click="ping">
        Ping mock
      </button>
      <button type="button" class="secondary" @click="echo">
        Echo mock
      </button>
      <button type="button" class="secondary" @click="upload">
        Upload mock
      </button>
    </div>
    <pre>{{ output }}</pre>
  </main>
</template>

<style>
:root {
  color-scheme: light;
  font-family: 'Space Grotesk', 'IBM Plex Sans', ui-sans-serif, system-ui;
  background: radial-gradient(circle at 10% 10%, #f6f2ff 0%, #fef7e5 45%, #f3f9ff 100%);
  color: #1a1a1a;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
}

main {
  width: min(880px, 92vw);
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 24px 60px rgba(31, 32, 41, 0.12);
  backdrop-filter: blur(12px);
}

h1 {
  font-size: clamp(28px, 5vw, 40px);
  margin: 0 0 8px;
}

p {
  margin: 0 0 16px;
  color: #4a4a4a;
}

.meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  font-size: 14px;
}

.pill {
  padding: 6px 12px;
  border-radius: 999px;
  background: #111;
  color: #fff;
  font-weight: 600;
}

.pill.secondary {
  background: #fff;
  color: #111;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

button {
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  background: #111;
  color: #fff;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

button.secondary {
  background: #fff;
  color: #111;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(17, 17, 17, 0.18);
}

pre {
  margin: 0;
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 16px;
  min-height: 180px;
  white-space: pre-wrap;
}
</style>
