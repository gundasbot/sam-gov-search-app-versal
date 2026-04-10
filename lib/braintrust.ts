import { initLogger, type Logger, type Span } from 'braintrust'

type TraceEvent = {
  input?: unknown
  output?: unknown
  metadata?: Record<string, unknown>
  tags?: string[]
}

let cachedLogger: Logger<true> | null | undefined

function readEnv(name: string): string | null {
  const value = process.env[name]
  if (!value) return null
  const trimmed = value.trim()
  return trimmed || null
}

export function getBraintrustLogger(): Logger<true> | null {
  if (cachedLogger !== undefined) return cachedLogger

  const apiKey = readEnv('BRAINTRUST_API_KEY') || readEnv('BRAINTRUST_API_KEY_LOCAL')
  if (!apiKey) {
    cachedLogger = null
    return cachedLogger
  }

  const projectName =
    readEnv('BRAINTRUST_PROJECT_NAME') ||
    readEnv('BRAINTRUST_PROJECT') ||
    'sam-gov-search-app'

  try {
    cachedLogger = initLogger({
      apiKey,
      projectName,
    })
  } catch (error) {
    console.error('[braintrust] Failed to initialize logger:', error)
    cachedLogger = null
  }

  return cachedLogger
}

export async function withBraintrustTrace<T>(
  name: string,
  run: (span: Span | null) => Promise<T>,
  options?: { event?: TraceEvent; type?: 'task' | 'llm' | 'tool' | 'score' | 'function' }
): Promise<T> {
  const logger = getBraintrustLogger()
  if (!logger) return run(null)

  return logger.traced(
    async (span: Span) => run(span),
    {
      name,
      type: options?.type || 'task',
      ...(options?.event ? { event: options.event } : {}),
    }
  )
}
