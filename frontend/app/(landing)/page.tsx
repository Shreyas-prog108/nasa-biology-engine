'use client'

import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Rocket, Search, Brain, Network, X, Lock } from 'lucide-react'
import Link from 'next/link'
import * as THREE from 'three'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

// Custom Star Field Component
const StarField = () => {
  const starsRef = useRef<THREE.Points>(null!)
  
  const starPositions = React.useMemo(() => {
    const positions = new Float32Array(15000 * 3)
    for (let i = 0; i < 15000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000
    }
    return positions
  }, [])

  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.x += 0.0001
      starsRef.current.rotation.y += 0.0002
    }
  })

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={15000}
          array={starPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  )
}

const Planet = ({ orbitRadius, size, color, speed, name, onClick, zoomDistance, orbitInclination, orbitOffset }: any) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += speed * 2
      meshRef.current.rotation.x += speed * 0.8
      
      const time = state.clock.getElapsedTime()
      const angle = time * speed + orbitOffset
      
      meshRef.current.position.x = Math.cos(angle) * orbitRadius
      meshRef.current.position.z = Math.sin(angle) * orbitRadius
      meshRef.current.position.y = Math.sin(angle + orbitInclination) * orbitRadius * 0.1
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    onClick(meshRef.current.position, zoomDistance, name)
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.3 : 1}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      {hovered && (
        <Html>
          <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl text-sm font-semibold border border-white/20">
            <div className="text-center">
              <div className="font-bold">{name}</div>
              <div className="text-xs opacity-75 mt-1">Click to zoom in</div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

const Sun = ({ onClick }: any) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02
      meshRef.current.rotation.x += 0.008
      
      const time = state.clock.getElapsedTime()
      const scale = 1 + Math.sin(time * 2) * 0.05
      meshRef.current.scale.setScalar(scale)
    }
  })

  const handleClick = (event: any) => {
    event.stopPropagation()
    onClick(new THREE.Vector3(0, 0, 0), 8, 'Sun')
  }

  return (
    <mesh 
      ref={meshRef} 
      position={[0, 0, 0]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshStandardMaterial
        color="#FDB813"
        emissive="#FDB813"
        emissiveIntensity={hovered ? 0.7 : 0.5}
      />
      <pointLight intensity={2} distance={100} />
      {hovered && (
        <Html>
          <div className="bg-yellow-900/80 backdrop-blur-sm text-yellow-100 px-3 py-2 rounded-lg shadow-xl text-sm font-semibold border border-yellow-400/20">
            <div className="text-center">
              <div className="font-bold">Sun</div>
              <div className="text-xs opacity-75 mt-1">Click to zoom in</div>
            </div>
          </div>
        </Html>
      )}
    </mesh>
  )
}

const SolarSystem = () => {
  const controlsRef = useRef<any>()
  const { camera } = useThree()
  
  const planetsData = [
    { name: 'Mercury', orbitRadius: 8, size: 0.8, color: '#8c7853', speed: 0.08, zoomDistance: 4, orbitInclination: 0.2, orbitOffset: 0 },
    { name: 'Venus', orbitRadius: 12, size: 1.2, color: '#ffc649', speed: 0.06, zoomDistance: 5, orbitInclination: 0.5, orbitOffset: 1.5 },
    { name: 'Earth', orbitRadius: 16, size: 1.3, color: '#6b93d6', speed: 0.05, zoomDistance: 6, orbitInclination: 0.1, orbitOffset: 3 },
    { name: 'Mars', orbitRadius: 20, size: 1.0, color: '#cd5c5c', speed: 0.04, zoomDistance: 5, orbitInclination: 0.8, orbitOffset: 4.5 },
    { name: 'Jupiter', orbitRadius: 30, size: 3.5, color: '#d8ca9d', speed: 0.025, zoomDistance: 12, orbitInclination: 0.3, orbitOffset: 6 },
    { name: 'Saturn', orbitRadius: 40, size: 3.0, color: '#fab27b', speed: 0.02, zoomDistance: 10, orbitInclination: 0.6, orbitOffset: 1 },
    { name: 'Uranus', orbitRadius: 50, size: 2.5, color: '#4fd0e3', speed: 0.015, zoomDistance: 8, orbitInclination: 1.2, orbitOffset: 2.5 },
    { name: 'Neptune', orbitRadius: 60, size: 2.3, color: '#4b70dd', speed: 0.012, zoomDistance: 8, orbitInclination: 0.4, orbitOffset: 5.5 }
  ]

  const zoomToPlanet = (position: THREE.Vector3, distance: number, name: string) => {
    if (controlsRef.current) {
      const direction = new THREE.Vector3(1, 0.5, 1).normalize()
      const cameraPosition = position.clone().add(direction.multiplyScalar(distance))
      
      const startPosition = camera.position.clone()
      const startTarget = controlsRef.current.target.clone()
      
      let progress = 0
      const animateCamera = () => {
        progress += 0.03
        if (progress <= 1) {
          camera.position.lerpVectors(startPosition, cameraPosition, progress)
          controlsRef.current.target.lerpVectors(startTarget, position, progress)
          controlsRef.current.update()
          requestAnimationFrame(animateCamera)
        } else {
          camera.position.copy(cameraPosition)
          controlsRef.current.target.copy(position)
          controlsRef.current.update()
        }
      }
      animateCamera()
      
      console.log(`Zoomed to ${name} at distance ${distance}`)
    }
  }

  return (
    <>
      <Sun onClick={zoomToPlanet} />
      {planetsData.map((planet, index) => (
        <Planet
          key={index}
          {...planet}
          onClick={zoomToPlanet}
        />
      ))}
      <OrbitControls
        ref={controlsRef}
        target={[0, 0, 0]}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={0.8}
        minDistance={8}
        maxDistance={150}
        zoomSpeed={2.0}
        panSpeed={1.5}
        rotateSpeed={1.2}
        enableDamping={true}
        dampingFactor={0.05}
        screenSpacePanning={false}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />
    </>
  )
}

function LoginModal({ isOpen, onClose, onLogin }: { isOpen: boolean; onClose: () => void; onLogin: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
                <p className="text-gray-400 mb-6">
                  Please login with your GitHub account to access the dashboard and explore NASA space biology research.
                </p>
                
                <button
                  onClick={onLogin}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Login with GitHub</span>
                </button>
                
                <button
                  onClick={onClose}
                  className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function LandingPage() {
  const { isAuthenticated, login } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleProtectedLink = (e: React.MouseEvent, href: string) => {
    if (!isAuthenticated) {
      e.preventDefault()
      setShowLoginModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 overflow-hidden relative">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLogin={login}
      />
      
      {/* Background with Solar System */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 80], fov: 75 }}>
          <Suspense fallback={null}>
            <StarField />
            <ambientLight intensity={0.4} />
            <pointLight position={[0, 0, 0]} intensity={1.5} />
            <SolarSystem />
          </Suspense>
        </Canvas>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section - Home */}
        <section id="home" className="flex-1 flex flex-col items-center justify-center px-6 py-8 pt-24">
          <div className="max-w-5xl mx-auto text-center">
            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mb-96 lg:mb-[32rem]"
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
                Space Biology
                <span className="block text-gray-300 mt-2">Research Engine</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-4 max-w-3xl mx-auto">
                Explore 600+ NASA publications through AI-powered search
              </p>
              <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
                Intelligent Q&A and interactive knowledge graphs
              </p>
            </motion.div>

            {/* Interactive Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
              className="mb-16 text-center"
            >
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm px-8 py-4 rounded-2xl border border-gray-600/40 inline-block shadow-2xl">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🌌</div>
                  <div>
                    <div className="text-lg font-semibold text-white">Explore the Interactive Solar System</div>
                  </div>
                  <div className="text-2xl">✨</div>
                </div>
              </div>
            </motion.div>

            {/* Statistics Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
              id="stats"
              className="mb-16"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="text-3xl font-bold text-gray-200 mb-2">600+</div>
                  <div className="text-sm text-gray-400">NASA Publications</div>
                </div>
                <div className="text-center bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="text-3xl font-bold text-gray-200 mb-2">AI</div>
                  <div className="text-sm text-gray-400">Powered Search</div>
                </div>
                <div className="text-center bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="text-3xl font-bold text-gray-200 mb-2">3D</div>
                  <div className="text-sm text-gray-400">Knowledge Graphs</div>
                </div>
                <div className="text-center bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="text-3xl font-bold text-gray-200 mb-2">Real-time</div>
                  <div className="text-sm text-gray-400">Q&A System</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Everything you need to explore space biology research
              </p>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            >
              <Link href="/search" onClick={(e) => handleProtectedLink(e, '/search')} className="group">
                <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 hover:bg-black/50 transition-all duration-300 transform group-hover:scale-105 border border-gray-700/50 h-full">
                  <Search className="h-10 w-10 text-gray-300 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-white mb-2">Smart Search</h3>
                  <p className="text-gray-400 text-sm">Vector-powered search across NASA publications</p>
                </div>
              </Link>

              <Link href="/qa" onClick={(e) => handleProtectedLink(e, '/qa')} className="group">
                <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 hover:bg-black/50 transition-all duration-300 transform group-hover:scale-105 border border-gray-700/50 h-full">
                  <Brain className="h-10 w-10 text-gray-300 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-white mb-2">AI Q&A</h3>
                  <p className="text-gray-400 text-sm">Intelligent answers powered by Gemini AI</p>
                </div>
              </Link>

              <Link href="/knowledge-graph" onClick={(e) => handleProtectedLink(e, '/knowledge-graph')} className="group">
                <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 hover:bg-black/50 transition-all duration-300 transform group-hover:scale-105 border border-gray-700/50 h-full">
                  <Network className="h-10 w-10 text-gray-300 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-white mb-2">Knowledge Graph</h3>
                  <p className="text-gray-400 text-sm">Visualize research connections</p>
                </div>
              </Link>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center"
            >
              <Link
                href="/dashboard"
                onClick={(e) => handleProtectedLink(e, '/dashboard')}
                className="inline-flex items-center px-12 py-6 lg:px-16 lg:py-8 bg-space-orange hover:bg-orange-600 text-white font-bold rounded-full text-xl lg:text-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                <Rocket className="mr-3 h-6 w-6 lg:h-8 lg:w-8" />
                Launch Explorer
                <ChevronRight className="ml-3 h-6 w-6 lg:h-8 lg:w-8" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Technology Stack Section */}
        <section id="technology" className="px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white text-center mb-8">Powered by Advanced Technology</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {['Gemini AI', 'Pinecone', 'Neo4j', 'FastAPI', 'React', 'Three.js'].map((tech) => (
                  <div key={tech} className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-gray-700/50 hover:border-cyan-500/50 transition-colors">
                    <div className="text-gray-300 font-semibold text-sm">{tech}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white text-center mb-12">Perfect for Researchers & Students</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-cyan-500/30 transition-colors">
                  <div className="text-4xl mb-4">🔬</div>
                  <h4 className="text-xl font-semibold text-white mb-3">Research Discovery</h4>
                  <p className="text-gray-300">Find relevant NASA publications instantly with AI-powered semantic search across 600+ space biology papers.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-cyan-500/30 transition-colors">
                  <div className="text-4xl mb-4">🎓</div>
                  <h4 className="text-xl font-semibold text-white mb-3">Academic Learning</h4>
                  <p className="text-gray-300">Get instant answers to complex questions about space biology, microgravity effects, and space research.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-cyan-500/30 transition-colors">
                  <div className="text-4xl mb-4">🌐</div>
                  <h4 className="text-xl font-semibold text-white mb-3">Knowledge Mapping</h4>
                  <p className="text-gray-300">Visualize connections between research topics, authors, and findings through interactive 3D knowledge graphs.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white text-center mb-12">What Researchers Say</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
                  <p className="text-gray-300 italic mb-4">&ldquo;This platform revolutionized how I search for space biology research. The AI understands context like no other search engine.&rdquo;</p>
                  <div className="text-cyan-400 font-semibold">Dr. Sarah Chen</div>
                  <div className="text-sm text-gray-400">Astrobiology Researcher, MIT</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
                  <p className="text-gray-300 italic mb-4">&ldquo;The knowledge graphs help me understand research connections I never would have found manually. Incredible tool!&rdquo;</p>
                  <div className="text-cyan-400 font-semibold">Prof. Michael Rodriguez</div>
                  <div className="text-sm text-gray-400">Space Medicine, Stanford</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Company Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-8 h-8 fill-white">
                      <circle cx="50" cy="50" r="45" fill="currentColor" />
                      <path d="M20 50 L40 35 L40 45 L70 45 L70 35 L80 50 L70 65 L70 55 L40 55 L40 65 Z" fill="#1e1b4b" />
                      <circle cx="30" cy="30" r="6" fill="#f97316" />
                      <ellipse cx="50" cy="70" rx="20" ry="4" fill="#f97316" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">NASA Space Biology Engine</h3>
                    <p className="text-gray-400">Powered by AI & Advanced Analytics</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6 max-w-md">
                  Revolutionizing space biology research through AI-powered search, intelligent Q&A, and interactive knowledge graphs. Explore 600+ NASA publications like never before.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                    <span className="text-white text-sm">📧</span>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                    <span className="text-white text-sm">🐦</span>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                    <span className="text-white text-sm">💼</span>
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                    <span className="text-white text-sm">📱</span>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-6">Quick Links</h4>
                <ul className="space-y-3">
                  <li><Link href="/search" onClick={(e) => handleProtectedLink(e, '/search')} className="text-gray-400 hover:text-cyan-400 transition-colors">Smart Search</Link></li>
                  <li><Link href="/qa" onClick={(e) => handleProtectedLink(e, '/qa')} className="text-gray-400 hover:text-cyan-400 transition-colors">AI Q&A</Link></li>
                  <li><Link href="/knowledge-graph" onClick={(e) => handleProtectedLink(e, '/knowledge-graph')} className="text-gray-400 hover:text-cyan-400 transition-colors">Knowledge Graph</Link></li>
                  <li><Link href="/dashboard" onClick={(e) => handleProtectedLink(e, '/dashboard')} className="text-gray-400 hover:text-cyan-400 transition-colors">Dashboard</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-6">Resources</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">API Reference</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Tutorials</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Support</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-gray-400 text-sm mb-4 md:mb-0">
                  © 2025 NASA Space Biology Engine. Built with ❤️ for the scientific community.
                </div>
                <div className="flex space-x-6 text-sm">
                  <Link href="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors">Privacy Policy</Link>
                  <Link href="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors">Terms of Service</Link>
                  <Link href="/contact" className="text-gray-400 hover:text-cyan-400 transition-colors">Contact</Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
