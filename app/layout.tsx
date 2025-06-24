import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Prompt } from 'next/font/google'
import PWAInstaller from '@/components/PWAInstaller'

const prompt = Prompt({ 
  subsets: ['thai', 'latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CareClockPWA',
  description: 'Progressive Web App for healthcare management - Mobile optimized',
  manifest: '/manifest.json',
  keywords: ['healthcare', 'mobile', 'pwa', 'care', 'clock'],
  authors: [{ name: 'CareClockPWA Team' }],
  creator: 'CareClockPWA',
  publisher: 'CareClockPWA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CareClockPWA',
  },
  icons: {
    icon: '/asset/CareClockLOGO.PNG',
    apple: '/asset/CareClockLOGO.PNG',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2196f3',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <link rel="icon" href="/asset/CareClockLOGO.PNG" />
        <link rel="apple-touch-icon" href="/asset/CareClockLOGO.PNG" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CareClockPWA" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${prompt.className} antialiased`}>
        <PWAInstaller />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}
