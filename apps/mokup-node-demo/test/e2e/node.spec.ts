import { expect, test } from '@playwright/test'

test('node demo serves mokup endpoints', async ({ request }) => {
  const pingResponse = await request.get('/ping')
  expect(pingResponse.ok()).toBe(true)
  const ping = await pingResponse.json() as { ok?: boolean, message?: string }
  expect(ping.ok).toBe(true)
  expect(ping.message).toBe('pong')

  const timeResponse = await request.get('/time')
  expect(timeResponse.ok()).toBe(true)
  const time = await timeResponse.json() as { now?: string, timezone?: string }
  expect(time.now).toMatch(/\d{4}-\d{2}-\d{2}T/)
  expect(time.timezone).toBeTruthy()
})
