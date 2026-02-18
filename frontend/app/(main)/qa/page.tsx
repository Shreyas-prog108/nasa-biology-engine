import type { Metadata } from 'next'
import QAClient from './QAClient'

export const metadata: Metadata = {
  title: 'AI Q&A',
  description: 'Ask questions about NASA space biology research and get intelligent answers powered by Google Gemini AI.',
}

export default function QAPage() {
  return <QAClient />
}
