import { createAuthClient } from 'better-auth/client'
import './style.css'

interface UserRecord {
  id: string
  name: string
  email: string
}

const apiBase = '/api'
const authClient = createAuthClient({ baseURL: window.location.origin })

const statusEl = document.querySelector<HTMLParagraphElement>('#status')
const usersEl = document.querySelector<HTMLUListElement>('#users')
const apiBaseEl = document.querySelector<HTMLSpanElement>('#api-base')
const githubButton = document.querySelector<HTMLButtonElement>('#github-login')
const signOutButton = document.querySelector<HTMLButtonElement>('#signout')
const refreshButton = document.querySelector<HTMLButtonElement>('#refresh-users')
const emailForm = document.querySelector<HTMLFormElement>('#email-form')
const userForm = document.querySelector<HTMLFormElement>('#user-form')

if (apiBaseEl) {
  apiBaseEl.textContent = apiBase
}

function setStatus(message: string) {
  if (statusEl) {
    statusEl.textContent = message
  }
}

function renderUsers(users: UserRecord[]) {
  if (!usersEl) {
    return
  }
  usersEl.innerHTML = ''
  if (users.length === 0) {
    const empty = document.createElement('li')
    empty.textContent = 'No users yet. Create one to see it here.'
    usersEl.append(empty)
    return
  }
  for (const user of users) {
    const item = document.createElement('li')
    item.textContent = `${user.name} - ${user.email}`
    usersEl.append(item)
  }
}

async function loadUsers() {
  try {
    const response = await fetch(`${apiBase}/users`)
    if (!response.ok) {
      setStatus(`User load failed (${response.status})`)
      return
    }
    const payload = await response.json() as { users?: UserRecord[] }
    renderUsers(payload.users ?? [])
    setStatus('Users loaded.')
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to load users.')
  }
}

githubButton?.addEventListener('click', async () => {
  setStatus('Redirecting to GitHub...')
  try {
    await authClient.signIn.social({ provider: 'github' })
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'GitHub sign-in failed.')
  }
})

signOutButton?.addEventListener('click', async () => {
  try {
    await authClient.signOut()
    setStatus('Signed out.')
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'Sign-out failed.')
  }
})

refreshButton?.addEventListener('click', () => {
  void loadUsers()
})

emailForm?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = event.currentTarget
  if (!(form instanceof HTMLFormElement)) {
    return
  }
  const submitEvent = event as SubmitEvent
  const action = submitEvent.submitter?.getAttribute('data-action')
  const name = (form.querySelector('#name') as HTMLInputElement | null)?.value.trim()
  const email = (form.querySelector('#email') as HTMLInputElement | null)?.value.trim()
  const password = (form.querySelector('#password') as HTMLInputElement | null)?.value

  if (!email || !password) {
    setStatus('Email and password are required.')
    return
  }

  try {
    if (action === 'signin') {
      await authClient.signIn.email({ email, password })
      setStatus('Signed in with email.')
      return
    }
    if (!name) {
      setStatus('Name is required for sign-up.')
      return
    }
    await authClient.signUp.email({ name, email, password })
    setStatus('Account created. You are signed in.')
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'Auth request failed.')
  }
})

userForm?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const nameInput = document.querySelector<HTMLInputElement>('#user-name')
  const emailInput = document.querySelector<HTMLInputElement>('#user-email')
  const name = nameInput?.value.trim() ?? ''
  const email = emailInput?.value.trim() ?? ''

  if (!name || !email) {
    setStatus('Provide a name and email.')
    return
  }

  try {
    const response = await fetch(`${apiBase}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    })
    if (!response.ok) {
      const errorText = await response.text()
      setStatus(`Create failed: ${errorText || response.status}`)
      return
    }
    nameInput?.value && (nameInput.value = '')
    emailInput?.value && (emailInput.value = '')
    setStatus('User created.')
    await loadUsers()
  }
  catch (error) {
    setStatus(error instanceof Error ? error.message : 'Create failed.')
  }
})

void loadUsers()
