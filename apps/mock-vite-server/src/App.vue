<script setup lang="ts">
import { ref } from 'vue'

const responseText = ref('Click Run to see mock output.')
const responseStatus = ref('idle')
const responseMeta = ref('none')
const busy = ref(false)

const userId = ref('1')
const loginUsername = ref('mokup')
const loginPassword = ref('123456')

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
</script>

<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">
          Mokup / Vite server mode
        </p>
        <h1>Mock Vite Server</h1>
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
          <button class="btn" :disabled="busy" @click="fetchProfile">
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
            <input v-model="userId" class="input" type="text" placeholder="User id">
            <button class="btn" :disabled="busy" @click="fetchUser">
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
            <input v-model="loginUsername" class="input" type="text" placeholder="Username">
            <input v-model="loginPassword" class="input" type="password" placeholder="Password">
            <button class="btn" :disabled="busy" @click="submitLogin">
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
              <span class="status-value">{{ responseStatus }}</span>
            </p>
          </div>
          <div class="meta">
            <span class="meta-label">Last action</span>
            <span class="meta-value">{{ responseMeta }}</span>
          </div>
        </div>
        <pre class="response-body">{{ responseText }}</pre>
      </section>

      <section class="panel catalog">
        <h2>Endpoint catalog</h2>
        <ul class="catalog-list">
          <li><span class="tag">GET</span> /api/profile (defineHandler)</li>
          <li><span class="tag">GET</span> /api/users/:id (dynamic)</li>
          <li><span class="tag">POST</span> /api/login</li>
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
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');

:global(body) {
  margin: 0;
  font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
  background: radial-gradient(circle at top, #fef6e4, #f2efe9 45%, #e8edf0 100%);
  color: #1d1c1a;
}

:global(*) {
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  padding: 48px 24px 64px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  border-radius: 28px;
  padding: 32px 36px;
  background: linear-gradient(120deg, #fff4d6 0%, #fef6e4 40%, #f7d6c3 100%);
  box-shadow: 0 20px 60px rgba(61, 90, 128, 0.12);
}

.eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #6b7280;
  margin: 0 0 12px;
}

h1 {
  font-size: clamp(2.2rem, 4vw, 3.4rem);
  margin: 0 0 12px;
}

.subtitle {
  max-width: 560px;
  font-size: 1.05rem;
  color: #3d3a36;
  margin: 0;
}

.hero-meta {
  display: grid;
  gap: 12px;
}

.meta-card {
  background: #ffffff;
  padding: 12px 16px;
  border-radius: 16px;
  box-shadow: inset 0 0 0 1px #f0e2d6;
  min-width: 160px;
}

.meta-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.meta-value {
  display: block;
  font-weight: 600;
  margin-top: 6px;
}

.content {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  align-items: start;
}

.panel {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.actions {
  display: grid;
  gap: 16px;
}

.card {
  border-radius: 18px;
  padding: 18px 20px;
  background: #fdf8f3;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid #f0e2d6;
}

.card h2 {
  margin: 0 0 4px;
  font-size: 1.2rem;
}

.endpoint {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.inline {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stack {
  display: grid;
  gap: 10px;
}

.input {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2d6ca;
  font-size: 0.95rem;
}

.btn {
  padding: 10px 16px;
  border-radius: 999px;
  border: none;
  background: #3d5a80;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(61, 90, 128, 0.25);
}

.response {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.response-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status {
  margin: 8px 0 0;
  display: flex;
  gap: 8px;
  align-items: center;
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
  background: #111827;
  color: #f9fafb;
  border-radius: 16px;
  padding: 18px;
  font-size: 0.9rem;
  min-height: 220px;
  overflow: auto;
}

.catalog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.catalog-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
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
  border-radius: 999px;
  background: #f0e2d6;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #5a4634;
}

.catalog-note {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

@media (max-width: 720px) {
  .hero {
    padding: 24px;
  }

  .response-body {
    min-height: 180px;
  }
}
</style>
