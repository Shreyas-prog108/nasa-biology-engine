import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'NASA Space Biology Engine | AI-Powered Research Platform',
    template: '%s | NASA Space Biology Engine'
  },
  description: 'Explore 600+ NASA space biology publications through AI-powered search, intelligent Q&A, and interactive knowledge graphs. Built for researchers and students.',
  keywords: ['NASA', 'space biology', 'research', 'AI', 'publications', 'knowledge graph', 'Gemini AI', 'academic', 'science'],
  authors: [{ name: 'NASA Space Biology Engine Team' }],
  creator: 'NASA Space Biology Engine',
  publisher: 'NASA Space Biology Engine',
  metadataBase: new URL('https://nasaspacebiology.engine'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'NASA Space Biology Engine | AI-Powered Research Platform',
    description: 'Explore 600+ NASA space biology publications through AI-powered search and intelligent Q&A.',
    url: 'https://nasaspacebiology.engine',
    siteName: 'NASA Space Biology Engine',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NASA Space Biology Engine',
    description: 'AI-powered research platform for NASA space biology publications.',
    creator: '@nasaspacebio',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0f0f23" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
