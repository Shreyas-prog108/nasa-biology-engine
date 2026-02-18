import type { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Monitor your space biology research mission with real-time analytics, AI-powered insights, and cosmic data visualization.',
}

export default function DashboardPage() {
  return <DashboardClient />
}
