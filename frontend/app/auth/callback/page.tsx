'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

function CallbackHandler() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Verifying session...')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[Auth Callback] Starting auth check...')
        setStatus('Checking authentication...')
        
        // Small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('[Auth Callback] Calling /api/proxy/auth/me')
        const response = await fetch('/api/proxy/auth/me')
        console.log('[Auth Callback] Response status:', response.status)
        
        if (response.ok) {
          const userData = await response.json()
          console.log('[Auth Callback] Auth successful:', userData)
          setStatus('Redirecting to dashboard...')
          router.push('/dashboard')
        } else {
          let errorText = ''
          try {
            const errorData = await response.json()
            errorText = errorData.detail || errorData.error || JSON.stringify(errorData)
          } catch {
            errorText = await response.text()
          }
          console.error('[Auth Callback] Auth failed:', response.status, errorText)
          setError(`Authentication failed (${response.status}): ${errorText}`)
          setTimeout(() => router.push('/?error=auth_check_failed'), 3000)
        }
      } catch (err) {
        console.error('[Auth Callback] Error:', err)
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
        setTimeout(() => router.push('/?error=auth_exception'), 3000)
      }
    }
    
    checkAuth()
  }, [router])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      {error ? (
        <>
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-3xl">✕</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-red-400 max-w-md mx-auto">{error}</p>
          <p className="text-gray-500 mt-4 text-sm">Redirecting to home...</p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{status}</h2>
          <p className="text-gray-400">Please wait while we complete your sign in.</p>
        </>
      )}
    </motion.div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
