/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gmtlqkymoobnbqhmeenp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'fsuwpxnzdayupczabafs.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'media.rafaelahoy.com',
        pathname: '/**',
      },
    ],
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.vercel-analytics.com https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https: wss: https://www.google-analytics.com https://www.googletagmanager.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; frame-ancestors 'none';",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig
