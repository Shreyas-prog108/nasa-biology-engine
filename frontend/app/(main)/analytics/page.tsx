import type { Metadata } from 'next'
import AnalyticsClient from './AnalyticsClient'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Explore trends, patterns, and insights from NASA space biology research publications with interactive charts and statistics.',
}

export default function AnalyticsPage() {
  return <AnalyticsClient />
}
