import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Rafaela Hoy - Noticias de Rafaela y la región",
  description: "El portal de noticias líder de Rafaela y la región. Información actualizada las 24 horas sobre lo que pasa en tu ciudad.",
  keywords: ["noticias", "rafaela", "santa fe", "argentina", "información", "actualidad"],
  authors: [{ name: "Rafaela Hoy" }],
  creator: "Rafaela Hoy",
  publisher: "Rafaela Hoy",
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL("https://rafaelahoy.com"),
  alternates: {
    canonical: "https://rafaelahoy.com",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://rafaelahoy.com",
    title: "Rafaela Hoy - Noticias de Rafaela y la región",
    description: "El portal de noticias líder de Rafaela y la región. Información actualizada las 24 horas sobre lo que pasa en tu ciudad.",
    siteName: "Rafaela Hoy",
    images: [
      {
        url: "/images/logo.png",
        width: 180,
        height: 60,
        alt: "Rafaela Hoy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rafaela Hoy - Noticias de Rafaela y la región",
    description: "El portal de noticias líder de Rafaela y la región. Información actualizada las 24 horas sobre lo que pasa en tu ciudad.",
    images: ["/images/logo.png"],
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
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
