import type { Metadata } from 'next'
import AlertsClient from './AlertsClient'

export const metadata: Metadata = {
  title: 'Alerts & Saved Searches',
  description:
    'Create, manage, and automate your saved searches and email alerts for new government contract opportunities.',
}

export default function AlertsPage() {
  return <AlertsClient />
}

