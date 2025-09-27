import React, { useEffect, useRef, useState } from 'react'
import cytoscape, { Core, ElementDefinition } from 'cytoscape'
import { motion } from 'framer-motion'
import { RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { getGraphVisualizationData } from '../services/api'
import toast from 'react-hot-toast'

interface GraphData {
  nodes: ElementDefinition[]
  edges: ElementDefinition[]
  stats: {
    node_count: number
    edge_count: number
    has_neo4j_data: boolean
  }
}

const GraphVisualization: React.FC = () => {
  const cyRef = useRef<HTMLDivElement>(null)
  const cyInstance = useRef<Core | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGraphData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getGraphVisualizationData(50)
      if (data.error) {
        setError(data.error)
      } else {
        setGraphData(data)
      }
    } catch (err) {
      setError('Failed to load graph data')
      console.error('Graph data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const initializeCytoscape = (data: GraphData) => {
    if (!cyRef.current) return

    // Destroy existing instance
    if (cyInstance.current) {
      cyInstance.current.destroy()
    }

    const elements = [...data.nodes, ...data.edges]

    cyInstance.current = cytoscape({
      container: cyRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#6366f1',
            'label': 'data(label)',
            'width': 40,
            'height': 40,
            'font-size': '12px',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#374151',
            'border-width': 2,
            'border-color': '#e5e7eb'
          }
        },
        {
          selector: 'node[type="publication"]',
          style: {
            'background-color': '#3b82f6',
            'shape': 'rectangle',
            'width': 60,
            'height': 40
          }
        },
        {
          selector: 'node[type="entity"]',
          style: {
            'background-color': '#10b981',
            'shape': 'ellipse',
            'width': (ele: any) => Math.max(30, Math.min(60, ele.data('mentions') * 8))
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#d1d5db',
            'target-arrow-color': '#d1d5db',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(relationship)',
            'font-size': '10px',
            'color': '#6b7280',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#f59e0b'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'width': 3
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 1000,
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 40,
        nodeRepulsion: () => 400000,
        edgeElasticity: () => 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      },
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.1
    })

    // Add event listeners
    cyInstance.current.on('tap', 'node', (evt) => {
      const node = evt.target
      const nodeData = node.data()
      toast.success(`Selected: ${nodeData.label}`)
    })

    cyInstance.current.on('tap', 'edge', (evt) => {
      const edge = evt.target
      const edgeData = edge.data()
      toast.info(`Relationship: ${edgeData.relationship}`)
    })
  }

  const handleZoomIn = () => {
    if (cyInstance.current) {
      cyInstance.current.zoom(cyInstance.current.zoom() * 1.2)
      cyInstance.current.center()
    }
  }

  const handleZoomOut = () => {
    if (cyInstance.current) {
      cyInstance.current.zoom(cyInstance.current.zoom() * 0.8)
      cyInstance.current.center()
    }
  }

  const handleFitToView = () => {
    if (cyInstance.current) {
      cyInstance.current.fit()
    }
  }

  useEffect(() => {
    loadGraphData()
  }, [])

  useEffect(() => {
    if (graphData && !loading) {
      initializeCytoscape(graphData)
    }
  }, [graphData, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading graph visualization...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-center">
          <p className="font-semibold">Failed to load graph</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={loadGraphData}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Interactive Knowledge Graph</h3>
          {graphData && (
            <div className="text-sm text-gray-500">
              {graphData.stats.node_count} nodes, {graphData.stats.edge_count} edges
              {graphData.stats.has_neo4j_data ? '' : ' (sample data)'}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleFitToView}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fit to View"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={loadGraphData}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-6 p-3 bg-gray-50 rounded-lg text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-3 bg-blue-500 rounded"></div>
          <span>Publications</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Entities</span>
        </div>
        <div className="text-gray-500">
          Click nodes/edges to explore • Drag to move • Scroll to zoom
        </div>
      </div>

      {/* Graph Container */}
      <div className="relative">
        <div
          ref={cyRef}
          className="w-full h-96 border border-gray-200 rounded-lg bg-white"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Status */}
      {graphData && !graphData.stats.has_neo4j_data && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Note:</span> This is sample data. 
            Perform searches in the Knowledge Graph to populate with real data from Neo4j.
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default GraphVisualization

