export function formatDate(input?: string | Date | null): string {
  if (!input) return '—'
  const d = typeof input === 'string' ? new Date(input) : input
  if (!(d instanceof Date) || isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d)
}
