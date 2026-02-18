import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  try {
    // Exchange code for access token with GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      console.error('[OAuth Callback] GitHub error:', tokenData.error)
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url))
    }

    const accessToken = tokenData.access_token
    if (!accessToken) {
      return NextResponse.redirect(new URL('/?error=no_token', request.url))
    }

    // Get user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data')
    }

    const userData = await userResponse.json()
    console.log('[OAuth Callback] GitHub user:', userData.login, 'ID:', userData.id)

    // Get user email if not public
    let email = userData.email
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })
      
      if (emailsResponse.ok) {
        const emails = await emailsResponse.json()
        const primaryEmail = emails.find((e: any) => e.primary)
        if (primaryEmail) {
          email = primaryEmail.email
        }
      }
    }

    // Send to backend to create/update user and get JWT
    console.log('[OAuth Callback] Sending to backend:', process.env.NEXT_PUBLIC_API_URL)
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        github_id: String(userData.id),
        email,
        name: userData.name,
        avatar_url: userData.avatar_url,
        username: userData.login,
        access_token: accessToken,
      }),
    })

    console.log('[OAuth Callback] Backend response status:', backendResponse.status)
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error('[OAuth Callback] Backend error:', backendResponse.status, errorText)
      return NextResponse.redirect(new URL('/?error=backend_failed', request.url))
    }

    const responseData = await backendResponse.json()
    console.log('[OAuth Callback] Backend response data:', { 
      success: responseData.success, 
      hasToken: !!responseData.token,
      user: responseData.user?.username 
    })

    if (!responseData.token) {
      console.error('[OAuth Callback] No token in response')
      return NextResponse.redirect(new URL('/?error=no_jwt_token', request.url))
    }

    // Create redirect response
    const response = NextResponse.redirect(new URL('/auth/callback', request.url))
    
    // Set HTTP-only cookie
    const isProd = process.env.NODE_ENV === 'production'
    response.cookies.set('auth_token', responseData.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    // Set indicator cookie (non-httpOnly for client-side awareness)
    response.cookies.set('auth_indicator', '1', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    console.log('[OAuth Callback] Cookies set, redirecting to /auth/callback')
    return response
  } catch (error) {
    console.error('[OAuth Callback] Error:', error)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
