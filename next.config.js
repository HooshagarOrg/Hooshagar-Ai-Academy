/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode
  reactStrictMode: true,

  // غیرفعال کردن ESLint در build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // غیرفعال کردن TypeScript errors در build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Experimental features
  experimental: {
    // Server Actions
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.arvanstorage.ir',
        pathname: '/**',
      },
    ],
  },

  // i18n for Persian
  i18n: {
    locales: ['fa'],
    defaultLocale: 'fa',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Redirects - handled by middleware
  async redirects() {
    return []
  },
}

module.exports = nextConfig
