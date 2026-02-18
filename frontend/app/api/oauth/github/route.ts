import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GITHUB_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/oauth/callback`
  
  console.log('GitHub OAuth Debug:')
  console.log('  GITHUB_ID:', clientId ? 'Set (length: ' + clientId.length + ')' : 'NOT SET')
  console.log('  NEXT_PUBLIC_APP_URL:', appUrl)
  console.log('  Redirect URI:', redirectUri)
  
  if (!clientId) {
    console.error('ERROR: GITHUB_ID is not defined in environment variables')
    return NextResponse.json(
      { 
        error: 'GitHub OAuth not configured',
        debug: {
          github_id_set: false,
          app_url: appUrl
        }
      },
      { status: 500 }
    )
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`
  
  console.log('  Redirecting to GitHub...')
  return NextResponse.redirect(githubAuthUrl)
}
