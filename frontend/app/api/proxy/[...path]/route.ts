import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const token = request.cookies.get('auth_token')?.value
  
  console.log(`[Proxy] GET /${path}`)
  console.log(`[Proxy] Token present: ${!!token}`)
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const url = `${API_URL}/${path}`
    console.log(`[Proxy] Fetching: ${url}`)
    
    const response = await fetch(url, { headers })
    console.log(`[Proxy] Response status: ${response.status}`)
    
    // Forward the response
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        responseHeaders[key] = value
      }
    })
    
    const body = await response.text()
    return new NextResponse(body, { 
      status: response.status,
      headers: responseHeaders
    })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    return NextResponse.json({ 
      error: 'Proxy failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const token = request.cookies.get('auth_token')?.value
  
  console.log(`[Proxy] POST /${path}`)
  console.log(`[Proxy] Token present: ${!!token}`)
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const body = await request.text()
    
    const url = `${API_URL}/${path}`
    console.log(`[Proxy] Fetching: ${url}`)
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body || undefined,
    })
    console.log(`[Proxy] Response status: ${response.status}`)
    
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        responseHeaders[key] = value
      }
    })
    
    const responseBody = await response.text()
    return new NextResponse(responseBody, { 
      status: response.status,
      headers: responseHeaders
    })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    return NextResponse.json({ 
      error: 'Proxy failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
