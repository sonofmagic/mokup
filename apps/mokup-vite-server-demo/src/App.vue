<script setup lang="ts">
import { ref } from 'vue'

const responseText = ref('Click Run to see mock output.')
const responseStatus = ref('idle')
const responseMeta = ref('none')
const busy = ref(false)

const userId = ref('1')
const loginUsername = ref('mokup')
const loginPassword = ref('123456')
const uploadTitle = ref('Mokup upload')
const uploadFiles = ref<File[]>([])

async function runRequest(label: string, url: string, init?: RequestInit) {
  busy.value = true
  responseStatus.value = 'loading'
  responseMeta.value = label
  try {
    const res = await fetch(url, init)
    const contentType = res.headers.get('content-type') ?? ''
    const raw = await res.text()
    if (contentType.includes('application/json')) {
      try {
        responseText.value = JSON.stringify(JSON.parse(raw), null, 2)
      }
      catch {
        responseText.value = raw
      }
    }
    else {
      responseText.value = raw
    }
    responseStatus.value = `${res.status} ${res.statusText}`
  }
  catch (error) {
    responseStatus.value = 'error'
    responseText.value = error instanceof Error ? error.message : String(error)
  }
  finally {
    busy.value = false
  }
}

function fetchProfile() {
  return runRequest('profile', '/api/profile')
}

function fetchUser() {
  const id = userId.value.trim() || '1'
  return runRequest(`user ${id}`, `/api/users/${encodeURIComponent(id)}`)
}

function submitLogin() {
  return runRequest('login', '/api/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      username: loginUsername.value,
      password: loginPassword.value,
    }),
  })
}

function handleUploadFiles(event: Event) {
  const input = event.target as HTMLInputElement | null
  uploadFiles.value = Array.from(input?.files ?? [])
}

function submitUpload() {
  const formData = new FormData()
  const title = uploadTitle.value.trim()
  if (title) {
    formData.append('title', title)
  }
  for (const file of uploadFiles.value) {
    formData.append('files', file)
  }
  return runRequest('upload', '/api/upload', {
    method: 'POST',
    body: formData,
  })
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">
          Mokup / Vite server mode
        </p>
        <h1 data-testid="page-title">
          Mock Vite Server
        </h1>
        <p class="subtitle">
          Three mock endpoints powered by faker. Hit run to generate fresh data.
        </p>
      </div>
      <div class="hero-meta">
        <div class="meta-card">
          <span class="meta-label">Prefix</span>
          <span class="meta-value">/api</span>
        </div>
        <div class="meta-card">
          <span class="meta-label">Runtime</span>
          <span class="meta-value">server</span>
        </div>
      </div>
    </header>

    <main class="content">
      <section class="panel actions">
        <div class="card">
          <div>
            <h2>Profile</h2>
            <p class="endpoint">
              GET /api/profile
            </p>
          </div>
          <button class="btn" :disabled="busy" data-testid="run-profile" @click="fetchProfile">
            Run
          </button>
        </div>

        <div class="card">
          <div>
            <h2>User by ID</h2>
            <p class="endpoint">
              GET /api/users/:id
            </p>
          </div>
          <div class="inline">
            <input v-model="userId" class="input" type="text" placeholder="User id" data-testid="input-user-id">
            <button class="btn" :disabled="busy" data-testid="run-user" @click="fetchUser">
              Run
            </button>
          </div>
        </div>

        <div class="card">
          <div>
            <h2>Login</h2>
            <p class="endpoint">
              POST /api/login
            </p>
          </div>
          <div class="stack">
            <input v-model="loginUsername" class="input" type="text" placeholder="Username" data-testid="input-login-username">
            <input v-model="loginPassword" class="input" type="password" placeholder="Password" data-testid="input-login-password">
            <button class="btn" :disabled="busy" data-testid="run-login" @click="submitLogin">
              Run
            </button>
          </div>
        </div>

        <div class="card">
          <div>
            <h2>Upload</h2>
            <p class="endpoint">
              POST /api/upload (multipart/form-data)
            </p>
          </div>
          <div class="stack">
            <input v-model="uploadTitle" class="input" type="text" placeholder="Title" data-testid="input-upload-title">
            <input class="input file-input" type="file" multiple data-testid="input-upload-files" @change="handleUploadFiles">
            <p class="hint">
              {{ uploadFiles.length ? `${uploadFiles.length} files selected` : 'Select files to upload.' }}
            </p>
            <button class="btn" :disabled="busy" data-testid="run-upload" @click="submitUpload">
              Run
            </button>
          </div>
        </div>
      </section>

      <section class="panel response">
        <div class="response-head">
          <div>
            <h2>Response</h2>
            <p class="status">
              <span class="status-label">Status</span>
              <span class="status-value" data-testid="response-status">{{ responseStatus }}</span>
            </p>
          </div>
          <div class="meta">
            <span class="meta-label">Last action</span>
            <span class="meta-value" data-testid="response-meta">{{ responseMeta }}</span>
          </div>
        </div>
        <pre class="response-body" data-testid="response-body">{{ responseText }}</pre>
      </section>

      <section class="panel catalog">
        <h2>Endpoint catalog</h2>
        <ul class="catalog-list">
          <li><span class="tag">GET</span> /api/profile (defineHandler)</li>
          <li><span class="tag">GET</span> /api/users/:id (dynamic)</li>
          <li><span class="tag">POST</span> /api/login</li>
          <li><span class="tag">POST</span> /api/upload (multipart)</li>
          <li><span class="tag">GET</span> /api/status (json file)</li>
          <li><span class="tag">GET</span> /api/summary (jsonc file)</li>
          <li><span class="tag">GET</span> /api/items</li>
          <li><span class="tag">POST</span> /api/items</li>
          <li><span class="tag">GET</span> /api/items/:id</li>
          <li><span class="tag">PUT</span> /api/items/:id</li>
          <li><span class="tag">PATCH</span> /api/items/:id</li>
          <li><span class="tag">DELETE</span> /api/items/:id</li>
          <li><span class="tag">GET</span> /api/variants (multi rules)</li>
          <li><span class="tag">GET</span> /api/disabled (disabled)</li>
          <li><span class="tag">GET</span> /api/docs/* (optional params)</li>
          <li><span class="tag">GET</span> /api/:action/:id (defineHandler params)</li>
        </ul>
        <p class="catalog-note">
          Global config via <code>index.config.ts</code> adds headers and a small delay.
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
@import 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap';

:global(body) {
  margin: 0;
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  color: #1d1c1a;
  background: radial-gradient(circle at top, #fef6e4, #f2efe9 45%, #e8edf0 100%);
}

:global(*) {
  box-sizing: border-box;
}

.page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-height: 100vh;
  padding: 48px 24px 64px;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  padding: 32px 36px;
  background: linear-gradient(120deg, #fff4d6 0%, #fef6e4 40%, #f7d6c3 100%);
  border-radius: 28px;
  box-shadow: 0 20px 60px rgb(61 90 128 / 12%);
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(2.2rem, 4vw, 3.4rem);
}

.subtitle {
  max-width: 560px;
  margin: 0;
  font-size: 1.05rem;
  color: #3d3a36;
}

.hero-meta {
  display: grid;
  gap: 12px;
}

.meta-card {
  min-width: 160px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px #f0e2d6;
}

.meta-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.meta-value {
  display: block;
  margin-top: 6px;
  font-weight: 600;
}

.content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  align-items: start;
}

.panel {
  padding: 24px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 16px 40px rgb(15 23 42 / 8%);
}

.actions {
  display: grid;
  gap: 16px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  background: #fdf8f3;
  border: 1px solid #f0e2d6;
  border-radius: 18px;
}

.card h2 {
  margin: 0 0 4px;
  font-size: 1.2rem;
}

.endpoint {
  margin: 0;
  font-size: 0.95rem;
  color: #6b7280;
}

.inline {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stack {
  display: grid;
  gap: 10px;
}

.input {
  padding: 10px 12px;
  font-size: 0.95rem;
  border: 1px solid #e2d6ca;
  border-radius: 12px;
}

.file-input {
  font-size: 0.85rem;
  background: #fffaf4;
  border-style: dashed;
}

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.btn {
  padding: 10px 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background: #3d5a80;
  border: none;
  border-radius: 999px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.btn:not(:disabled):hover {
  box-shadow: 0 10px 20px rgb(61 90 128 / 25%);
  transform: translateY(-1px);
}

.response {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.response-head {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.status {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 8px 0 0;
}

.status-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.status-value {
  font-weight: 600;
}

.meta {
  text-align: right;
}

.response-body {
  min-height: 220px;
  padding: 18px;
  overflow: auto;
  font-size: 0.9rem;
  color: #f9fafb;
  background: #111827;
  border-radius: 16px;
}

.catalog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.catalog-list {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.catalog-list li {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 0.95rem;
  color: #3d3a36;
}

.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 4px 8px;
  font-size: 0.7rem;
  color: #5a4634;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  background: #f0e2d6;
  border-radius: 999px;
}

.catalog-note {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

@media (width <= 720px) {
  .hero {
    padding: 24px;
  }

  .response-body {
    min-height: 180px;
  }
}
</style>
