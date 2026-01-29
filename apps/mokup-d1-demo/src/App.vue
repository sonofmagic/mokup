<script setup lang="ts">
import { createAuthClient } from 'better-auth/client'
import { onMounted, reactive, ref } from 'vue'

interface UserRecord {
  id: string
  name: string
  email: string
}

const apiBase = '/api'
const status = ref('Waiting for input.')
const users = ref<UserRecord[]>([])
const loadingUsers = ref(false)
const authBusy = ref(false)
const userBusy = ref(false)

const emailForm = reactive({
  name: '',
  email: '',
  password: '',
})

const userForm = reactive({
  name: '',
  email: '',
})

const authClient = createAuthClient({
  baseURL: window.location.origin,
})

function setStatus(message: string) {
  status.value = message
}

async function loadUsers() {
  loadingUsers.value = true
  try {
    const response = await fetch(`${apiBase}/users`)
    if (!response.ok) {
      setStatus(`User load failed (${response.status}).`)
      return
    }
    const payload = await response.json() as { users?: UserRecord[] }
    users.value = payload.users ?? []
    setStatus('Users loaded.')
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to load users.')
  }
  finally {
    loadingUsers.value = false
  }
}

async function signInGithub() {
  authBusy.value = true
  setStatus('Redirecting to GitHub...')
  try {
    await authClient.signIn.social({ provider: 'github' })
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'GitHub sign-in failed.')
  }
  finally {
    authBusy.value = false
  }
}

async function signOut() {
  authBusy.value = true
  try {
    await authClient.signOut()
    setStatus('Signed out.')
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'Sign-out failed.')
  }
  finally {
    authBusy.value = false
  }
}

async function signInEmail() {
  if (!emailForm.email || !emailForm.password) {
    setStatus('Email and password are required.')
    return
  }

  authBusy.value = true
  try {
    await authClient.signIn.email({
      email: emailForm.email,
      password: emailForm.password,
    })
    setStatus('Signed in with email.')
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'Email sign-in failed.')
  }
  finally {
    authBusy.value = false
  }
}

async function signUpEmail() {
  if (!emailForm.name) {
    setStatus('Name is required for sign-up.')
    return
  }
  if (!emailForm.email || !emailForm.password) {
    setStatus('Email and password are required.')
    return
  }

  authBusy.value = true
  try {
    await authClient.signUp.email({
      name: emailForm.name,
      email: emailForm.email,
      password: emailForm.password,
    })
    setStatus('Account created. You are signed in.')
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'Email sign-up failed.')
  }
  finally {
    authBusy.value = false
  }
}

async function createUser() {
  if (!userForm.name || !userForm.email) {
    setStatus('Provide a name and email.')
    return
  }
  if (!userForm.email.includes('@')) {
    setStatus('Email is invalid.')
    return
  }

  userBusy.value = true
  try {
    const response = await fetch(`${apiBase}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userForm.name,
        email: userForm.email,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      setStatus(`Create failed: ${errorText || response.status}`)
      return
    }

    userForm.name = ''
    userForm.email = ''
    setStatus('User created.')
    await loadUsers()
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'Create failed.')
  }
  finally {
    userBusy.value = false
  }
}

onMounted(() => {
  void loadUsers()
})
</script>

<template>
  <div class="min-h-screen px-6 pb-16 pt-12 text-stone-900">
    <div class="mx-auto flex max-w-6xl flex-col gap-8">
      <header class="collage-card collage-rise">
        <p class="collage-chip">
          Workers + D1 + Mokup
        </p>
        <div class="mt-5 flex flex-wrap items-end justify-between gap-6">
          <div class="max-w-xl">
            <h1 class="text-3xl font-semibold leading-tight md:text-4xl">
              D1 auth playground with real mocks.
            </h1>
            <p class="mt-3 text-sm text-stone-700 md:text-base">
              Drizzle-backed users, Better Auth sessions, and GitHub OAuth running
              through mokup rules in production.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              class="collage-button disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              :disabled="authBusy"
              @click="signInGithub"
            >
              Sign in with GitHub
            </button>
            <button
              class="collage-button-ghost disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              :disabled="authBusy"
              @click="signOut"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main class="grid gap-6 md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_0.8fr]">
        <section class="collage-card collage-rise collage-delay-1">
          <h2 class="text-xl font-semibold">
            Email login
          </h2>
          <form class="mt-4 space-y-4">
            <label class="block text-xs font-semibold uppercase tracking-[0.2em] text-stone-600">
              Name
              <input
                v-model.trim="emailForm.name"
                class="collage-input mt-2"
                type="text"
                placeholder="Ada Lovelace"
              >
            </label>
            <label class="block text-xs font-semibold uppercase tracking-[0.2em] text-stone-600">
              Email
              <input
                v-model.trim="emailForm.email"
                class="collage-input mt-2"
                type="email"
                placeholder="ada@mokup.dev"
              >
            </label>
            <label class="block text-xs font-semibold uppercase tracking-[0.2em] text-stone-600">
              Password
              <input
                v-model="emailForm.password"
                class="collage-input mt-2"
                type="password"
                minlength="8"
              >
            </label>
            <div class="flex flex-wrap gap-3">
              <button
                class="collage-button disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                :disabled="authBusy"
                @click="signUpEmail"
              >
                Sign up
              </button>
              <button
                class="collage-button-ghost disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                :disabled="authBusy"
                @click="signInEmail"
              >
                Sign in
              </button>
            </div>
          </form>
        </section>

        <section class="collage-card collage-rise collage-delay-2 md:col-span-1 xl:col-span-1">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              Users
            </h2>
            <button
              class="collage-button-ghost px-4 py-1.5 text-xs"
              type="button"
              :disabled="loadingUsers"
              @click="loadUsers"
            >
              Refresh
            </button>
          </div>
          <ul class="mt-4 space-y-2">
            <li
              v-for="entry in users"
              :key="entry.id"
              class="rounded-2xl border border-stone-900/10 bg-white/70 px-4 py-3 text-sm"
            >
              <p class="font-semibold">
                {{ entry.name }}
              </p>
              <p class="text-xs text-stone-600">
                {{ entry.email }}
              </p>
            </li>
            <li
              v-if="!loadingUsers && users.length === 0"
              class="rounded-2xl border border-dashed border-stone-900/20 bg-white/60 px-4 py-3 text-sm text-stone-600"
            >
              No users yet. Create one to see it here.
            </li>
            <li
              v-if="loadingUsers"
              class="rounded-2xl border border-dashed border-stone-900/20 bg-white/60 px-4 py-3 text-sm text-stone-600"
            >
              Loading users...
            </li>
          </ul>
          <form class="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" @submit.prevent="createUser">
            <input
              v-model.trim="userForm.name"
              class="collage-input"
              type="text"
              placeholder="Name"
            >
            <input
              v-model.trim="userForm.email"
              class="collage-input"
              type="email"
              placeholder="Email"
            >
            <button
              class="collage-button disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              :disabled="userBusy"
            >
              Create user
            </button>
          </form>
        </section>

        <section class="collage-card collage-rise collage-delay-3 md:col-span-2 xl:col-span-1">
          <h2 class="text-xl font-semibold">
            Status
          </h2>
          <p class="mt-3 text-sm font-semibold text-orange-700">
            {{ status }}
          </p>
          <p class="mt-4 text-xs uppercase tracking-[0.3em] text-stone-500">
            API base: {{ apiBase }}
          </p>
        </section>
      </main>
    </div>
  </div>
</template>
