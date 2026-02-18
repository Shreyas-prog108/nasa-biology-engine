import type { Metadata } from 'next'
import KnowledgeGraphClient from './KnowledgeGraphClient'

export const metadata: Metadata = {
  title: 'Knowledge Graph',
  description: 'Explore the interconnected network of NASA space biology research, entities, and relationships through interactive 3D visualizations.',
}

export default function KnowledgeGraphPage() {
  return <KnowledgeGraphClient />
}
