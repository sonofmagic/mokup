import { expect, test } from '@playwright/test'

test('mock-vite-server endpoints respond', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Mock Vite Server' })).toBeVisible()

  const profileResponse = await request.get('/api/profile')
  expect(profileResponse.ok()).toBe(true)
  const profile = await profileResponse.json() as Record<string, unknown>
  expect(profile).toEqual(expect.objectContaining({
    id: expect.any(String),
    name: expect.any(String),
    email: expect.any(String),
  }))

  const statusResponse = await request.get('/api/status')
  expect(statusResponse.ok()).toBe(true)
  const status = await statusResponse.json() as Record<string, unknown>
  expect(status.status).toBe('ok')

  const summaryResponse = await request.get('/api/summary')
  expect(summaryResponse.ok()).toBe(true)
  const summary = await summaryResponse.json() as Record<string, unknown>
  expect(summary.service).toBe('mock-vite-server')

  const userResponse = await request.get('/api/users/42')
  expect(userResponse.ok()).toBe(true)
  const user = await userResponse.json() as Record<string, unknown>
  expect(user.id).toBe('42')

  const actionResponse = await request.get('/api/run/123')
  expect(actionResponse.ok()).toBe(true)
  const actionPayload = await actionResponse.json() as Record<string, unknown>
  expect(actionPayload.params).toEqual({
    action: 'run',
    id: '123',
  })

  const loginResponse = await request.post('/api/login', {
    data: {
      username: 'mokup',
      password: '123456',
    },
  })
  expect(loginResponse.ok()).toBe(true)
  const login = await loginResponse.json() as Record<string, unknown>
  expect(login).toEqual(expect.objectContaining({
    ok: true,
    token: expect.any(String),
  }))

  const createdResponse = await request.post('/api/items', {
    data: { name: 'Demo Item' },
  })
  expect(createdResponse.status()).toBe(201)
  const created = await createdResponse.json() as Record<string, any>
  expect(created.item?.name).toBe('Demo Item')

  const putResponse = await request.put('/api/items/7', {
    data: { name: 'Updated Item' },
  })
  expect(putResponse.ok()).toBe(true)
  const putResult = await putResponse.json() as Record<string, unknown>
  expect(putResult.method).toBe('PUT')

  const patchResponse = await request.patch('/api/items/7', {
    data: { price: 42 },
  })
  expect(patchResponse.ok()).toBe(true)
  const patchResult = await patchResponse.json() as Record<string, unknown>
  expect(patchResult.method).toBe('PATCH')

  const deleteResponse = await request.delete('/api/items/7')
  expect(deleteResponse.status()).toBe(204)
})
