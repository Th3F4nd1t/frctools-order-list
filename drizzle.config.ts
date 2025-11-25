import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./server/utils/schema.ts', './server/utils/auth-schema.ts'],

  dbCredentials: { url: process.env.DATABASE_URL || '' }
})
