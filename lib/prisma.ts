// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaMiddlewareInstalled?: boolean
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryablePrismaError(e: unknown): boolean {
  const anyErr = e as any
  const code = anyErr?.code as string | undefined
  const retryableCodes = new Set(['P1000', 'P1001', 'P1002', 'P1003', 'P1008', 'P1017'])
  if (code && retryableCodes.has(code)) return true

  const message = String(anyErr?.message || '')
  return (
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT') ||
    message.includes('ENOTFOUND') ||
    message.includes('Connection terminated unexpectedly') ||
    message.includes('socket hang up') ||
    message.includes('kind: Closed') ||
    message.includes('Error { kind: Closed')
  )
}

function getClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  console.log('?? [PRISMA] Creating new Prisma client...')

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  })

  globalForPrisma.prisma = client
  console.log('? [PRISMA] Prisma client created successfully')

  return client
}

export const prisma = getClient()

// Install middleware ONLY ONCE (hot reload safe)
if (!globalForPrisma.prismaMiddlewareInstalled) {
  globalForPrisma.prismaMiddlewareInstalled = true

  prisma.$use(async (params, next) => {
    const maxAttempts = Number(process.env.PRISMA_RETRY_ATTEMPTS || 3)
    const baseDelayMs = Number(process.env.PRISMA_RETRY_BASE_DELAY_MS || 150)

    let attempt = 0
    while (true) {
      try {
        return await next(params)
      } catch (e) {
        attempt += 1

        if (attempt >= maxAttempts || !isRetryablePrismaError(e)) {
          console.error(`? [PRISMA] Query failed after ${attempt} attempts:`, e)
          throw e
        }

        const backoff = baseDelayMs * Math.pow(2, attempt - 1)
        const jitter = Math.floor(Math.random() * 75)
        console.warn(`?? [PRISMA] Retrying query (attempt ${attempt}/${maxAttempts})...`)
        await sleep(backoff + jitter)
      }
    }
  })
}

// ? DO NOT disconnect automatically in dev (causes "Closed" during hot reload)
export default prisma
