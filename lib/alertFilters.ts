export type AlertFilters = {
  keywords?: string
  naics?: string
  agency?: string
  setAside?: string
  stateOfPerformance?: string
  postedAfter?: string // ISO string
  postedBefore?: string // ISO string
  procurementType?: string
  // add more fields if your search page supports them
}

// base64url helpers (browser + server compatible)
function b64urlEncode(input: string) {
  const b64 =
    typeof window === 'undefined'
      ? Buffer.from(input, 'utf8').toString('base64')
      : btoa(unescape(encodeURIComponent(input)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function b64urlDecode(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
  const raw =
    typeof window === 'undefined'
      ? Buffer.from(padded, 'base64').toString('utf8')
      : decodeURIComponent(escape(atob(padded)))
  return raw
}

export function encodeFilters(filters: AlertFilters) {
  return b64urlEncode(JSON.stringify(filters ?? {}))
}

export function decodeFilters(encoded: string): AlertFilters {
  try {
    const json = b64urlDecode(encoded)
    const obj = JSON.parse(json)
    return (obj && typeof obj === 'object') ? obj : {}
  } catch {
    return {}
  }
}
