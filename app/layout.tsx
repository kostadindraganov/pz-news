import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'PZ-News - Новини от Пазарджик и региона',
    template: '%s | PZ-News',
  },
  description: 'Регионална новинарска платформа за Пазарджик и околните райони',
  keywords: ['новини', 'Пазарджик', 'региони', 'България', 'актуално'],
  authors: [{ name: 'PZ-News' }],
  creator: 'PZ-News',
  publisher: 'PZ-News',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'bg_BG',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'PZ-News',
    title: 'PZ-News - Новини от Пазарджик и региона',
    description: 'Регионална новинарска платформа за Пазарджик и околните райони',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PZ-News - Новини от Пазарджик и региона',
    description: 'Регионална новинарска платформа за Пазарджик и околните райони',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
