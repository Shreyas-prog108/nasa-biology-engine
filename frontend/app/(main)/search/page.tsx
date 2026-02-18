import type { Metadata } from 'next'
import SearchClient from './SearchClient'

export const metadata: Metadata = {
  title: 'Search Publications',
  description: 'Search through 600+ NASA space biology publications using semantic search technology powered by AI.',
}

export default function SearchPage() {
  return <SearchClient />
}
