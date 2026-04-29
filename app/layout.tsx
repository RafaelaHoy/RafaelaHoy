import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Rafaela hoy",
  description: "El portal de noticias de Rafaela y la Región. Información actualizada las 24 horas sobre lo que pasa en tu localidad.",
  keywords: ["noticias", "rafaela", "santa fe", "argentina", "información", "actualidad"],
  authors: [{ name: "Rafaela hoy" }],
  creator: "Rafaela hoy",
  publisher: "Rafaela hoy",
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL("https://rafaelahoy.com"),
  alternates: {
    canonical: "https://rafaelahoy.com",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://rafaelahoy.com",
    title: "Rafaela hoy",
    description: "El portal de noticias de Rafaela y la Región. Información actualizada las 24 horas sobre lo que pasa en tu localidad.",
    siteName: "Rafaela hoy",
    images: [
      {
        url: '/images/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Rafaela Hoy',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rafaela hoy",
    description: "El portal de noticias de Rafaela y la Región. Información actualizada las 24 horas sobre lo que pasa en tu localidad.",
    images: ['/images/logo.jpg'],
  },
  icons: {
    icon: [
      {
        url: '/images/icono.jpg',
        sizes: '32x32',
        type: 'image/jpeg',
      },
      {
        url: '/images/icono.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        url: '/images/icono.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
    apple: [
      {
        url: '/images/icono.jpg',
        sizes: '180x180',
        type: 'image/jpeg',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#4a5568',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
