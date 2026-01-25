import { env } from 'node:process'
import { defineConfig } from 'drizzle-kit'

const envVars = env as Record<
  'CLOUDFLARE_ACCOUNT_ID' | 'CLOUDFLARE_DATABASE_ID' | 'CLOUDFLARE_D1_TOKEN',
  string | undefined
>

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: envVars.CLOUDFLARE_ACCOUNT_ID ?? '',
    databaseId: envVars.CLOUDFLARE_DATABASE_ID ?? '',
    token: envVars.CLOUDFLARE_D1_TOKEN ?? '',
  },
})
