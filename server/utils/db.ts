import { drizzle } from 'drizzle-orm/node-postgres'
import * as authSchema from './auth-schema'
import * as appSchema from './schema'
import type { Hyperdrive } from '@cloudflare/workers-types'

const hyperdrive = process.env.HYPERDRIVE as Hyperdrive | undefined

export const useDB = () => drizzle(
  hyperdrive?.connectionString || process.env.DATABASE_URL!,
  {
    schema: { ...authSchema, ...appSchema }
  }
)
