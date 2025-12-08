/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode
  reactStrictMode: true,

  // ✅ فعال کردن ESLint و TypeScript Checks
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
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

  // ✅ Comprehensive Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://openrouter.ai https://api.anthropic.com https://*.workers.dev https://api.kavenegar.com https://*.arvanstorage.ir",
              "frame-src 'self' https://www.google.com",
              "media-src 'self' blob:",
              "worker-src 'self' blob:"
            ].join('; ')
          }
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
