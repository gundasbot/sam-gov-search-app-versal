import { redirect } from 'next/navigation'

interface AlertsSearchesPageProps {
  searchParams?: { view?: string | string[] }
}

export const metadata = {
  title: 'Alerts & Saved Searches | PreciseGovCon',
  description: 'Manage your alerts and saved searches from the dedicated alerts workspace.',
  robots: { index: false },
}

const resolveViewParam = (value?: string | string[] | null) => {
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}

export default function AlertsSearchesPage({ searchParams }: AlertsSearchesPageProps) {
  const view = resolveViewParam(searchParams?.view)

  if (view === 'subscribed') {
    redirect('/alerts/manage-alerts')
  }

  if (view === 'saved') {
    redirect('/alerts/manage-searches')
  }

  redirect('/alerts')
}
