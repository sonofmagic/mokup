<script setup lang="ts">
import { reactive } from 'vue'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface RequestState {
  status: Status
  output: string
}

function createState(initial: string): RequestState {
  return {
    status: 'idle',
    output: initial,
  }
}

const apiBase = '/api'

const state = reactive({
  health: createState('Click request to load /api/health.'),
  users: createState('Click request to load /api/users.'),
  user: createState('Click request to load /api/users/42.'),
  echo: createState('Click request to POST /api/echo.'),
})

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

function parseBody(text: string) {
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  }
  catch {
    return text
  }
}

async function fetchJson(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init)
  const text = await response.text()
  const data = parseBody(text)
  if (!response.ok) {
    const message = typeof data === 'string' ? data : response.statusText
    throw new Error(`${response.status} ${message}`.trim())
  }
  return data
}

async function runRequest(stateItem: RequestState, task: () => Promise<unknown>) {
  stateItem.status = 'loading'
  stateItem.output = 'Loading...'
  try {
    const data = await task()
    stateItem.status = 'success'
    stateItem.output = JSON.stringify(data, null, 2)
  }
  catch (error) {
    stateItem.status = 'error'
    stateItem.output = formatError(error)
  }
}

const loadHealth = () => runRequest(state.health, () => fetchJson(`${apiBase}/health`))
const loadUsers = () => runRequest(state.users, () => fetchJson(`${apiBase}/users`))
const loadUser = () => runRequest(state.user, () => fetchJson(`${apiBase}/users/42`))
function sendEcho() {
  return runRequest(state.echo, () =>
    fetchJson(`${apiBase}/echo`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello from mokup + webpack',
        sentAt: new Date().toISOString(),
      }),
    }))
}

function runAll() {
  loadHealth()
  loadUsers()
  loadUser()
  sendEcho()
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">
          Mokup × Webpack
        </p>
        <h1>Webpack Mock Playground</h1>
        <p class="subtext">
          File-based mock routes are served through the webpack plugin.
          Try dev server mode or build the bundle to see the same API responses.
        </p>
      </div>
      <button class="primary" type="button" @click="runAll">
        Run all requests
      </button>
    </header>

    <section class="grid">
      <article class="card">
        <div class="card-header">
          <div>
            <h2>Health</h2>
            <p class="hint">
              GET /api/health
            </p>
          </div>
          <span class="status" :data-status="state.health.status">{{ state.health.status }}</span>
        </div>
        <button type="button" @click="loadHealth">
          Request
        </button>
        <pre>{{ state.health.output }}</pre>
      </article>

      <article class="card">
        <div class="card-header">
          <div>
            <h2>Users</h2>
            <p class="hint">
              GET /api/users
            </p>
          </div>
          <span class="status" :data-status="state.users.status">{{ state.users.status }}</span>
        </div>
        <button type="button" @click="loadUsers">
          Request
        </button>
        <pre>{{ state.users.output }}</pre>
      </article>

      <article class="card">
        <div class="card-header">
          <div>
            <h2>User detail</h2>
            <p class="hint">
              GET /api/users/42
            </p>
          </div>
          <span class="status" :data-status="state.user.status">{{ state.user.status }}</span>
        </div>
        <button type="button" @click="loadUser">
          Request
        </button>
        <pre>{{ state.user.output }}</pre>
      </article>

      <article class="card">
        <div class="card-header">
          <div>
            <h2>Echo</h2>
            <p class="hint">
              POST /api/echo
            </p>
          </div>
          <span class="status" :data-status="state.echo.status">{{ state.echo.status }}</span>
        </div>
        <button type="button" @click="sendEcho">
          Request
        </button>
        <pre>{{ state.echo.output }}</pre>
      </article>
    </section>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
  color: #1d1a2b;
  background: radial-gradient(circle at top, #fff6e6 0%, #f6f1ff 45%, #eef6ff 100%);
}

.page {
  box-sizing: border-box;
  max-width: 1100px;
  min-height: 100vh;
  padding: 48px 24px 72px;
  margin: 0 auto;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #6a4fff;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(32px, 4vw, 48px);
}

.subtext {
  max-width: 560px;
  margin: 0;
  line-height: 1.6;
  color: #473f66;
}

.primary {
  padding: 12px 20px;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  background: #1d1a2b;
  border: none;
  border-radius: 999px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: rgb(255 255 255 / 80%);
  border: 1px solid rgb(75 70 90 / 10%);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgb(28 22 50 / 8%);
}

.card-header {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
}

h2 {
  margin: 0 0 4px;
  font-size: 18px;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: #5f5a7c;
}

.status {
  padding: 4px 8px;
  font-size: 10px;
  color: #5b3fe8;
  text-transform: uppercase;
  background: #f0ebff;
  border-radius: 999px;
}

.status[data-status='loading'] {
  color: #b86a00;
  background: #fff3d6;
}

.status[data-status='success'] {
  color: #0f7a3e;
  background: #e5f7ed;
}

.status[data-status='error'] {
  color: #a40021;
  background: #ffe4e4;
}

button {
  align-self: flex-start;
  padding: 8px 14px;
  font-size: 12px;
  cursor: pointer;
  background: transparent;
  border: 1px solid #1d1a2b;
  border-radius: 999px;
}

pre {
  padding: 10px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  background: rgb(29 26 43 / 6%);
  border-radius: 12px;
}

@media (width <= 640px) {
  .page {
    padding: 32px 16px 48px;
  }

  .primary {
    width: 100%;
    text-align: center;
  }
}
</style>
