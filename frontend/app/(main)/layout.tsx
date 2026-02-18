import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import ProtectedRoute from '@/components/ProtectedRoute'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Dashboard | NASA Space Biology Engine',
  description: 'Access your research dashboard with real-time analytics, AI-powered insights, and cosmic data visualization.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <ProtectedRoute>
        <SidebarProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
            <Header />
            <div className="flex pt-16">
              <Sidebar />
              <main className="flex-1 p-6 ml-64 transition-all duration-300">
                {children}
              </main>
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                  border: '1px solid #374151',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#f9fafb',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#f9fafb',
                  },
                },
              }}
            />
          </div>
        </SidebarProvider>
      </ProtectedRoute>
    </Providers>
  )
}
