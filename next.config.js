/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones para reducir uso de memoria
  compress: false, // Desactivar compresión para evitar Z_MEM_ERROR
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
  },
  // Configuración de imágenes para optimizar
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'fsuwpxnzdayupczabafs.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig
