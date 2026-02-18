import { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import TransparentNavbar from '@/components/TransparentNavbar'

export const metadata: Metadata = {
  title: 'NASA Space Biology Engine | AI-Powered Research Platform',
  description: 'Explore 600+ NASA space biology publications through AI-powered search, intelligent Q&A, and interactive knowledge graphs. Built for researchers and students.',
  keywords: ['NASA', 'space biology', 'research', 'AI', 'publications', 'knowledge graph', 'Gemini AI'],
  authors: [{ name: 'NASA Space Biology Engine' }],
  openGraph: {
    title: 'NASA Space Biology Engine | AI-Powered Research Platform',
    description: 'Explore 600+ NASA space biology publications through AI-powered search and intelligent Q&A.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NASA Space Biology Engine',
    description: 'AI-powered research platform for NASA space biology publications.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <TransparentNavbar />
      {children}
    </Providers>
  )
}
