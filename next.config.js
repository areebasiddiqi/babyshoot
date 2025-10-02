/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'cdn.astria.ai',
      'replicate.delivery',
      'pbxt.replicate.delivery',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Force all API routes to be dynamic to prevent static generation issues
  async rewrites() {
    return []
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
