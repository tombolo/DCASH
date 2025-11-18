// app/layout.tsx
import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export const viewport: Viewport = {
  themeColor: '#0d6efd',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'My Trading App',
  description: 'Simplify your trading journey with free tools, AI bots, and copy trading',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'My Trading App',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="My Trading App" />
        <meta name="apple-mobile-web-app-title" content="My Trading App" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* Register service worker */}
        <Script
          id="service-worker"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body>
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
