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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [layoutApplied, setLayoutApplied] = useState(false)

  const loadGraphData = async () => {
    setLoading(true)
    setError(null)
    setLayoutApplied(false) // Reset layout flag for new data
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

  const truncateLabel = (label: string, maxLength: number = 30) => {
    if (label.length <= maxLength) return label
    return label.substring(0, maxLength) + '...'
  }

  const initializeCytoscape = (data: GraphData) => {
    if (!cyRef.current) return

    // Destroy existing instance
    if (cyInstance.current) {
      cyInstance.current.destroy()
    }

    // Truncate labels to prevent overflow but keep original for tooltip
    const processedNodes = data.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        originalLabel: node.data.label,
        label: truncateLabel(node.data.label, 25)
      }
    }))

    const elements = [...processedNodes, ...data.edges]
    
    // Debug: Log the elements to see if edges are present
    console.log('Graph elements:', {
      nodes: processedNodes.length,
      edges: data.edges.length,
      sampleEdge: data.edges[0]
    })

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
            'font-size': '10px',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#ffffff',
            'border-width': 2,
            'border-color': '#e5e7eb'
          }
        },
        {
          selector: 'node[type="publication"]',
          style: {
            'background-color': '#3b82f6',
            'shape': 'rectangle',
            'width': 140,
            'height': 80,
            'font-size': '8px',
            'text-max-width': '130px',
            'text-wrap': 'wrap',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#ffffff',
            'text-margin-y': 0,
            'text-margin-x': 0
          }
        },
        {
          selector: 'node[type="entity"]',
          style: {
            'background-color': '#10b981',
            'shape': 'ellipse',
            'width': (ele: any) => Math.max(50, Math.min(100, ele.data('mentions') * 10)),
            'height': (ele: any) => Math.max(50, Math.min(100, ele.data('mentions') * 10)),
            'font-size': '9px',
            'text-max-width': '80px',
            'text-wrap': 'wrap',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#ffffff',
            'text-margin-y': 0,
            'text-margin-x': 0
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 4,
            'line-color': '#3b82f6',
            'target-arrow-color': '#3b82f6',
            'target-arrow-shape': 'triangle',
            'target-arrow-size': 8,
            'curve-style': 'bezier',
            'label': 'data(relationship)',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            'text-margin-y': -15,
            'color': '#1f2937',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.9,
            'text-border-color': '#3b82f6',
            'text-border-width': 1,
            'text-background-padding': '4px',
            'opacity': 0.8
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#f59e0b',
            'background-color': '#1d4ed8'
          }
        },
        {
          selector: 'node:hover',
          style: {
            'border-width': 3,
            'border-color': '#3b82f6',
            'background-color': '#1e40af'
          }
        },
        {
          selector: 'edge:hover',
          style: {
            'width': 4,
            'line-color': '#3b82f6',
            'target-arrow-color': '#3b82f6'
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
      wheelSensitivity: 0.1,
      autoungrabify: false,
      autolock: false
    })

    // Add event listeners
    cyInstance.current.on('tap', 'node', (evt) => {
      const node = evt.target
      const nodeData = node.data()
      console.log('Node clicked:', nodeData)
      toast.success(`Selected: ${nodeData.label}`)
    })

    cyInstance.current.on('tap', 'edge', (evt) => {
      const edge = evt.target
      const edgeData = edge.data()
      console.log('Edge clicked:', edgeData)
      toast.info(`Relationship: ${edgeData.relationship}`)
    })

    // Debug: Log all edges after layout
    cyInstance.current.ready(() => {
      const allEdges = cyInstance.current?.edges()
      console.log('All edges in graph:', allEdges?.length)
      allEdges?.forEach(edge => {
        console.log('Edge:', edge.data())
      })
    })

    // Add tooltip functionality for full text on hover
    let tooltip: HTMLElement | null = null

    cyInstance.current.on('mouseover', 'node', (evt) => {
      const node = evt.target
      const nodeData = node.data()
      const originalLabel = nodeData.originalLabel || nodeData.label
      
      if (originalLabel && originalLabel.length > 25) {
        tooltip = document.createElement('div')
        tooltip.className = 'fixed bg-gray-900 text-white text-xs rounded px-3 py-2 z-50 pointer-events-none shadow-lg'
        tooltip.textContent = originalLabel
        tooltip.style.maxWidth = '300px'
        tooltip.style.wordWrap = 'break-word'
        tooltip.style.lineHeight = '1.4'
        
        document.body.appendChild(tooltip)
        
        const updateTooltip = (e: MouseEvent) => {
          if (tooltip) {
            tooltip.style.left = (e.pageX + 15) + 'px'
            tooltip.style.top = (e.pageY - 15) + 'px'
          }
        }
        
        document.addEventListener('mousemove', updateTooltip)
      }
    })

    cyInstance.current.on('mouseout', 'node', () => {
      if (tooltip) {
        document.body.removeChild(tooltip)
        tooltip = null
      }
    })

    // Apply a single, stable layout only once
    if (!layoutApplied) {
      setTimeout(() => {
        if (cyInstance.current && !layoutApplied) {
          cyInstance.current.layout({
            name: 'cose',
            animate: true,
            animationDuration: 1000,
            nodeRepulsion: 2000,
            idealEdgeLength: 150,
            edgeElasticity: 0.3,
            fit: true,
            padding: 50,
            randomize: false
          }).run()
          setLayoutApplied(true)
        }
      }, 100)
    }
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

  const handleFullscreen = () => {
    setIsFullscreen(true)
  }

  const handleCloseFullscreen = () => {
    setIsFullscreen(false)
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

  const mainComponent = (
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
            onClick={handleFullscreen}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fullscreen"
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

  // Fullscreen Modal
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <h3 className="text-xl font-semibold text-gray-900">Interactive Knowledge Graph</h3>
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
              <button
                onClick={handleCloseFullscreen}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close Fullscreen"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Fullscreen Legend */}
          <div className="flex items-center space-x-6 p-3 bg-gray-50 text-sm">
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

          {/* Fullscreen Graph Container */}
          <div className="flex-1 p-4">
            <div
              ref={cyRef}
              className="w-full h-full border border-gray-200 rounded-lg bg-white"
              style={{ minHeight: '500px' }}
            />
          </div>

          {/* Fullscreen Status */}
          {graphData && !graphData.stats.has_neo4j_data && (
            <div className="p-3 bg-yellow-50 border-t border-yellow-200">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Note:</span> This is sample data. 
                Perform searches in the Knowledge Graph to populate with real data from Neo4j.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return mainComponent
}

export default GraphVisualization

