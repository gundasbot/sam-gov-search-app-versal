type GlobalCoalescer = typeof globalThis & {
  __PGC_IN_FLIGHT_COALESCER__?: Map<string, Promise<unknown>>
}

const globalState = globalThis as GlobalCoalescer

const IN_FLIGHT = globalState.__PGC_IN_FLIGHT_COALESCER__ ?? new Map<string, Promise<unknown>>()
if (!globalState.__PGC_IN_FLIGHT_COALESCER__) {
  globalState.__PGC_IN_FLIGHT_COALESCER__ = IN_FLIGHT
}

export async function coalesceInFlight<T>(key: string, work: () => Promise<T>): Promise<T> {
  const existing = IN_FLIGHT.get(key)
  if (existing) return existing as Promise<T>

  const pending = (async () => work())()
  IN_FLIGHT.set(key, pending as Promise<unknown>)

  try {
    return await pending
  } finally {
    if (IN_FLIGHT.get(key) === pending) {
      IN_FLIGHT.delete(key)
    }
  }
}

