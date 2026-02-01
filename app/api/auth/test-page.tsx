'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

export default function AuthTest() {
  const { data: session, status } = useSession()
  const [authResult, setAuthResult] = useState<any>(null)

  const testGoogleSignIn = async () => {
    console.log('Starting Google sign-in test...')
    
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/'
      })
      
      console.log('Sign-in result:', result)
      setAuthResult(result)
      
    } catch (error) {
      console.error('Sign-in error:', error)
      setAuthResult({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  }

  const testCredentialsSignIn = async () => {
    console.log('Starting credentials sign-in test...')
    
    try {
      const result = await signIn('credentials', {
        email: 'test@example.com',
        passwordHash: 'test123',
        redirect: false,
        callbackUrl: '/'
      })
      
      console.log('Credentials result:', result)
      setAuthResult(result)
      
    } catch (error) {
      console.error('Credentials error:', error)
      setAuthResult({ error: error instanceof Error ? error.message : 'An error occurred' })
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">NextAuth Debug Page</h1>
      
      {/* Session Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Session Status</h2>
        <p><strong>Status:</strong> {status}</p>
        {session && (
          <div>
            <p><strong>User:</strong> {session.user?.email}</p>
            <p><strong>ID:</strong> {session.user?.id}</p>
            <p><strong>Role:</strong> {(session.user as any)?.role}</p>
          </div>
        )}
      </div>

      {/* Test Buttons */}
      <div className="space-y-4 mb-6">
        <button
          onClick={testGoogleSignIn}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Google Sign In
        </button>
        
        <button
          onClick={testCredentialsSignIn}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-4"
        >
          Test Credentials Sign In
        </button>
        
        {session && (
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-4"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* Auth Result */}
      {authResult && (
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">Last Auth Result</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(authResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Environment Check */}
      <div className="mb-6 p-4 bg-yellow-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Environment Check</h2>
        <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || 'Not set'}</p>
        <p><strong>Has Google Client ID:</strong> {process.env.GOOGLE_CLIENT_ID ? 'Yes' : 'No'}</p>
        <p><strong>Has NextAuth Secret:</strong> {process.env.NEXTAUTH_SECRET ? 'Yes' : 'No'}</p>
      </div>

      {/* Quick Links */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold mb-2">Quick Test Links</h2>
        <div className="space-y-1">
          <a 
            href="/api/auth/providers" 
            target="_blank"
            className="block text-blue-600 hover:underline"
          >
            /api/auth/providers - Check available providers
          </a>
          <a 
            href="/api/auth/session" 
            target="_blank"
            className="block text-blue-600 hover:underline"
          >
            /api/auth/session - Check current session
          </a>
          <a 
            href="/api/auth/csrf" 
            target="_blank"
            className="block text-blue-600 hover:underline"
          >
            /api/auth/csrf - Check CSRF token
          </a>
          <a 
            href="/api/auth/signin" 
            target="_blank"
            className="block text-blue-600 hover:underline"
          >
            /api/auth/signin - Built-in sign-in page
          </a>
        </div>
      </div>
    </div>
  )
}