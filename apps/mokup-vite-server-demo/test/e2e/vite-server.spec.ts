import { Buffer } from 'node:buffer'
import { expect, test } from '@playwright/test'

test('vite server demo runs core mock flows', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('page-title')).toHaveText('Mock Vite Server')

  await page.getByTestId('run-profile').click()
  await expect(page.getByTestId('response-meta')).toContainText('profile')
  await expect(page.getByTestId('response-status')).toContainText('200')
  await expect(page.getByTestId('response-body')).toContainText('"email"')

  await page.getByTestId('input-user-id').fill('42')
  await page.getByTestId('run-user').click()
  await expect(page.getByTestId('response-meta')).toContainText('user 42')
  await expect(page.getByTestId('response-body')).toContainText('"id": "42"')

  await page.getByTestId('run-login').click()
  await expect(page.getByTestId('response-meta')).toContainText('login')
  await expect(page.getByTestId('response-body')).toContainText('"ok": true')

  await page.getByTestId('input-upload-files').setInputFiles({
    name: 'demo.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello'),
  })
  await page.getByTestId('run-upload').click()
  await expect(page.getByTestId('response-meta')).toContainText('upload')
  await expect(page.getByTestId('response-body')).toContainText('"files"')
})
